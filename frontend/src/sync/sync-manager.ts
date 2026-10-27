import { CliniAssistLocalDB, localDb } from '../db/local-db.js';
import type { SyncOutboxItem } from '../db/types.js';

export interface SyncManagerConfig {
  baseUrl?: string;
  tenantId: string;
  token?: string;
  db?: CliniAssistLocalDB;
  onUnauthorized?: () => void;
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
  private onUnauthorized?: () => void;
  private isSyncing = false;

  constructor(config: SyncManagerConfig) {
    this.baseUrl = config.baseUrl || '';
    this.tenantId = config.tenantId;
    this.token = config.token;
    this.db = config.db || localDb;
    this.onUnauthorized = config.onUnauthorized;
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

      if (res.status === 401) {
        this.onUnauthorized?.();
        throw new Error('Sessão expirada ou não autorizada (HTTP 401).');
      }

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

      if (res.status === 401) {
        this.onUnauthorized?.();
        throw new Error('Sessão expirada ou não autorizada (HTTP 401).');
      }

      if (!res.ok) {
        throw new Error(`Falha no servidor ao puxar deltas: HTTP ${res.status}`);
      }

      const data = await res.json();
      const serverTimestamp = data.server_timestamp || new Date().toISOString();

      // Grava deltas nas tabelas locais com proteção contra sobrescrita de mutações pendentes
      await this.db.transaction(
        'rw',
        [
          this.db.patients,
          this.db.procedures,
          this.db.appointments,
          this.db.appointment_items,
          this.db.financial_transactions,
          this.db.sync_metadata,
          this.db.sync_outbox,
        ],
        async () => {
          // Identifica IDs que possuem mutações pendentes na outbox
          const pendingMutations = await this.db.sync_outbox.toArray();
          const pendingRecordIds = new Set(pendingMutations.map((m) => m.record_id));

          if (Array.isArray(data.patients)) {
            for (const p of data.patients) {
              if (pendingRecordIds.has(p.id)) continue;
              const local = await this.db.patients.get(p.id);
              if (local && local.updated_at && local.updated_at > p.updated_at) continue;
              await this.db.patients.put(p);
            }
          }

          if (Array.isArray(data.procedures)) {
            for (const pr of data.procedures) {
              if (pendingRecordIds.has(pr.id)) continue;
              const local = await this.db.procedures.get(pr.id);
              if (local && local.updated_at && local.updated_at > pr.updated_at) continue;
              await this.db.procedures.put(pr);
            }
          }

          if (Array.isArray(data.appointments)) {
            for (const a of data.appointments) {
              const { items, ...appData } = a;
              // Se há mutação pendente local (ex: NO_SHOW recente), não sobrescreve com delta antigo
              if (!pendingRecordIds.has(appData.id)) {
                const local = await this.db.appointments.get(appData.id);
                if (!local || !local.updated_at || local.updated_at <= appData.updated_at) {
                  await this.db.appointments.put(appData);
                }
              }
              if (Array.isArray(items)) {
                for (const item of items) {
                  if (!pendingRecordIds.has(item.id)) {
                    await this.db.appointment_items.put(item);
                  }
                }
              }
            }
          }

          if (Array.isArray(data.financial_transactions)) {
            for (const tx of data.financial_transactions) {
              if (pendingRecordIds.has(tx.id)) continue;
              const local = await this.db.financial_transactions.get(tx.id);
              if (local && local.updated_at && local.updated_at > tx.updated_at) continue;
              await this.db.financial_transactions.put(tx);
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
