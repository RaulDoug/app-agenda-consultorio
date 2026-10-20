import { CliniAssistLocalDB, localDb } from '../db/local-db.js';
import type { SyncOutboxItem } from '../db/types.js';

export interface SyncManagerConfig {
  baseUrl?: string;
  tenantId: string;
  token?: string;
  db?: CliniAssistLocalDB;
}

export interface SyncPushResult {
  pushedCount: number;
  success: boolean;
  error?: string;
}

export interface SyncPullResult {
  pulledPatientsCount: number;
  pulledAppointmentsCount: number;
  serverTimestamp: string;
  success: boolean;
  error?: string;
}

export class SyncManager {
  private baseUrl: string;
  private tenantId: string;
  private token?: string;
  private db: CliniAssistLocalDB;
  private isSyncing = false;

  constructor(config: SyncManagerConfig) {
    this.baseUrl = config.baseUrl || '';
    this.tenantId = config.tenantId;
    this.token = config.token;
    this.db = config.db || localDb;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * PUSH: Despacha itens pendentes da sync_outbox para POST /api/sync/batch
   */
  async push(): Promise<SyncPushResult> {
    const pendingItems = await this.db.sync_outbox
      .where('status')
      .equals('PENDING')
      .sortBy('created_at');

    if (pendingItems.length === 0) {
      return { pushedCount: 0, success: true };
    }

    try {
      // 1. Marca temporariamente como SYNCING
      await this.db.transaction('rw', this.db.sync_outbox, async () => {
        for (const item of pendingItems) {
          await this.db.sync_outbox.update(item.id, { status: 'SYNCING' });
        }
      });

      // 2. Monta payload esperado pelo backend em POST /api/sync/batch
      const batchPayload = {
        mutations: pendingItems.map((item) => ({
          client_mutation_id: item.client_mutation_id,
          entity: item.entity,
          record_id: item.record_id,
          operation: item.operation,
          payload: item.payload,
          timestamp: item.created_at,
        })),
      };

      const res = await fetch(`${this.baseUrl}/api/sync/batch`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(batchPayload),
      });

      if (!res.ok) {
        throw new Error(`Falha no servidor ao sincronizar: HTTP ${res.status}`);
      }

      // 3. Sucesso: remove os itens da outbox
      await this.db.transaction('rw', this.db.sync_outbox, async () => {
        for (const item of pendingItems) {
          await this.db.sync_outbox.delete(item.id);
        }
      });

      return { pushedCount: pendingItems.length, success: true };
    } catch (err: any) {
      // 4. Erro de rede ou servidor: restaura status para PENDING e incrementa retry
      await this.db.transaction('rw', this.db.sync_outbox, async () => {
        for (const item of pendingItems) {
          await this.db.sync_outbox.update(item.id, {
            status: 'PENDING',
            retry_count: item.retry_count + 1,
            error_message: err.message,
          });
        }
      });

      return {
        pushedCount: 0,
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * PULL: Consulta mutações ocorridas no servidor via GET /api/sync/pull?since=...
   */
  async pull(): Promise<SyncPullResult> {
    try {
      const meta = await this.db.sync_metadata.get('last_server_sync_timestamp');
      const since = meta?.value || '1970-01-01T00:00:00.000Z';

      const res = await fetch(`${this.baseUrl}/api/sync/pull?since=${encodeURIComponent(since)}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Falha no servidor ao puxar deltas: HTTP ${res.status}`);
      }

      const data = await res.json();
      const serverTimestamp = data.server_timestamp || new Date().toISOString();

      // Grava deltas nas tabelas locais
      await this.db.transaction(
        'rw',
        [this.db.patients, this.db.procedures, this.db.appointments, this.db.appointment_items, this.db.sync_metadata],
        async () => {
          if (Array.isArray(data.patients)) {
            for (const p of data.patients) {
              await this.db.patients.put(p);
            }
          }

          if (Array.isArray(data.procedures)) {
            for (const pr of data.procedures) {
              await this.db.procedures.put(pr);
            }
          }

          if (Array.isArray(data.appointments)) {
            for (const a of data.appointments) {
              const { items, ...appData } = a;
              await this.db.appointments.put(appData);
              if (Array.isArray(items)) {
                for (const item of items) {
                  await this.db.appointment_items.put(item);
                }
              }
            }
          }

          // Atualiza o cursor de sincronização
          await this.db.sync_metadata.put({
            key: 'last_server_sync_timestamp',
            value: serverTimestamp,
          });
        }
      );

      return {
        pulledPatientsCount: data.patients?.length || 0,
        pulledAppointmentsCount: data.appointments?.length || 0,
        serverTimestamp,
        success: true,
      };
    } catch (err: any) {
      return {
        pulledPatientsCount: 0,
        pulledAppointmentsCount: 0,
        serverTimestamp: '',
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Ciclo completo de sincronização bidirecional: Push -> Pull
   */
  async sync(): Promise<{ push: SyncPushResult; pull: SyncPullResult }> {
    if (this.isSyncing) {
      return {
        push: { pushedCount: 0, success: false, error: 'Sincronização já em andamento.' },
        pull: { pulledPatientsCount: 0, pulledAppointmentsCount: 0, serverTimestamp: '', success: false },
      };
    }

    this.isSyncing = true;
    try {
      const pushRes = await this.push();
      const pullRes = await this.pull();
      return { push: pushRes, pull: pullRes };
    } finally {
      this.isSyncing = false;
    }
  }
}
