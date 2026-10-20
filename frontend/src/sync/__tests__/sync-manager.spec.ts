/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { CliniAssistLocalDB } from '../../db/local-db.js';
import { SyncManager } from '../sync-manager.js';

describe('SyncManager — Autenticação via Bearer e Preservação de Outbox', () => {
  let db: CliniAssistLocalDB;
  const tenantId = 'tenant-uuid-1234';
  const token = 'jwt_token_sync_teste';

  beforeEach(async () => {
    db = new CliniAssistLocalDB(`test_sync_${Date.now()}_${Math.random()}`);
    await db.open();
    vi.restoreAllMocks();
  });

  it('AC-163: SyncManager envia cabeçalho Authorization Bearer e nunca envia x-tenant-id @spec:AC-163', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/sync/batch')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });
      }
      if (url.includes('/api/sync/pull')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            patients: [],
            procedures: [],
            appointments: [],
            server_timestamp: new Date().toISOString(),
          }),
        });
      }
      return Promise.reject(new Error('URL não esperada'));
    });
    vi.stubGlobal('fetch', mockFetch);

    // Insere item pendente na outbox para disparar push
    await db.sync_outbox.add({
      id: 'mut-1',
      client_mutation_id: 'cmd-1',
      entity: 'patients',
      record_id: 'rec-1',
      operation: 'INSERT',
      payload: { name: 'Paciente Sync' },
      status: 'PENDING',
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const syncManager = new SyncManager({
      tenantId,
      token,
      db,
    });

    await syncManager.sync();

    expect(mockFetch).toHaveBeenCalled();
    for (const call of mockFetch.mock.calls) {
      const [, options] = call;
      expect(options.headers['Authorization']).toBe(`Bearer ${token}`);
      expect(options.headers['x-tenant-id']).toBeUndefined();
    }
  });

  it('Em caso de HTTP 401 durante push, preserva os itens pendentes na outbox sem descartá-los', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Sessão revogada.' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await db.sync_outbox.add({
      id: 'mut-2',
      client_mutation_id: 'cmd-2',
      entity: 'patients',
      record_id: 'rec-2',
      operation: 'INSERT',
      payload: { name: 'Paciente Não Sincronizado' },
      status: 'PENDING',
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const syncManager = new SyncManager({
      tenantId,
      token,
      db,
    });

    const res = await syncManager.push();
    expect(res.success).toBe(false);

    // Verifica que o item continua na outbox
    const item = await db.sync_outbox.get('mut-2');
    expect(item).toBeDefined();
    expect(item?.status).toBe('PENDING');
  });

  it('AC-168: Confirmação e limpeza segura da fila sync_outbox no frontend @spec:AC-168', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/sync/batch')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, applied: 1 }),
        });
      }
      return Promise.reject(new Error('URL não esperada'));
    });
    vi.stubGlobal('fetch', mockFetch);

    await db.sync_outbox.add({
      id: 'mut-app-1',
      client_mutation_id: 'cmd-app-1',
      entity: 'appointments',
      record_id: 'app-local-1',
      operation: 'INSERT',
      payload: {
        id: 'app-local-1',
        patient_id: 'pat-1',
        start_time: '2026-10-25T14:00:00.000Z',
        end_time: '2026-10-25T14:30:00.000Z',
        status: 'CONFIRMED',
        items: [{ id: 'item-1', procedure_id: 'proc-1', effective_price_cents: 10000, duration_minutes: 30 }],
      },
      status: 'PENDING',
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const syncManager = new SyncManager({
      tenantId,
      token,
      db,
    });

    const pushRes = await syncManager.push();
    expect(pushRes.success).toBe(true);
    expect(pushRes.pushedCount).toBe(1);

    // Item deve ser removido da outbox após confirmação
    const pending = await db.sync_outbox.get('mut-app-1');
    expect(pending).toBeUndefined();
  });

  it('AC-174: Restauração completa de agendamentos e procedimentos pós-login @spec:AC-174', async () => {
    const serverTimestamp = '2026-10-20T18:00:00.000Z';
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/sync/pull')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            server_timestamp: serverTimestamp,
            patients: [{ id: 'pat-pulled-1', name: 'Paciente Restaurado', whatsapp: '5511999998888', is_active: true }],
            procedures: [{ id: 'proc-pulled-1', name: 'Restauração Dentária', default_price_cents: 20000, default_duration_minutes: 45 }],
            appointments: [
              {
                id: 'app-pulled-1',
                tenant_id: tenantId,
                patient_id: 'pat-pulled-1',
                start_time: '2026-10-26T15:00:00.000Z',
                end_time: '2026-10-26T15:45:00.000Z',
                status: 'CONFIRMED',
                is_overtime: false,
                items: [
                  {
                    id: 'item-pulled-1',
                    appointment_id: 'app-pulled-1',
                    procedure_id: 'proc-pulled-1',
                    effective_price_cents: 20000,
                    duration_minutes: 45,
                  },
                ],
              },
            ],
          }),
        });
      }
      return Promise.reject(new Error('URL não esperada'));
    });
    vi.stubGlobal('fetch', mockFetch);

    // Banco local começa totalmente vazio (como após logout e login novo)
    expect(await db.appointments.count()).toBe(0);
    expect(await db.appointment_items.count()).toBe(0);

    const syncManager = new SyncManager({
      tenantId,
      token,
      db,
    });

    const pullRes = await syncManager.pull();
    expect(pullRes.success).toBe(true);
    expect(pullRes.pulledAppointmentsCount).toBe(1);

    // Valida dados populados no banco local
    const savedApp = await db.appointments.get('app-pulled-1');
    expect(savedApp).toBeDefined();
    expect(savedApp?.patient_id).toBe('pat-pulled-1');
    expect(savedApp?.status).toBe('CONFIRMED');

    const savedItem = await db.appointment_items.get('item-pulled-1');
    expect(savedItem).toBeDefined();
    expect(savedItem?.appointment_id).toBe('app-pulled-1');
    expect(savedItem?.procedure_id).toBe('proc-pulled-1');
  });
});
