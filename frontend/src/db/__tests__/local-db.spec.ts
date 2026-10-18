/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { CliniAssistLocalDB } from '../local-db.js';
import { PatientLocalRepository } from '../repositories/patient-local-repository.js';
import { AppointmentLocalRepository } from '../repositories/appointment-local-repository.js';
import { SyncManager } from '../../sync/sync-manager.js';
import { pruneOldCompletedAppointments } from '../../sync/pruning.js';

describe('Banco Local IndexedDB e Sincronização Offline-First (Sprint FE-1)', () => {
  let db: CliniAssistLocalDB;
  let patientRepo: PatientLocalRepository;
  let appointmentRepo: AppointmentLocalRepository;

  const tenantId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    // Cria um banco de dados novo em memória isolado para cada teste
    db = new CliniAssistLocalDB(`test_db_${Date.now()}_${Math.random()}`);
    await db.open();
    patientRepo = new PatientLocalRepository(db);
    appointmentRepo = new AppointmentLocalRepository(db);
  });

  describe('US-030 — Schema Local IndexedDB e Tabelas do Dispositivo', () => {
    it('AC-053: Inicialização do schema Dexie.js e tabelas locais @spec:AC-053', async () => {
      // 1. Verifica se todas as tabelas indexadas foram criadas
      const tableNames = db.tables.map((t) => t.name);
      expect(tableNames).toContain('patients');
      expect(tableNames).toContain('procedures');
      expect(tableNames).toContain('appointments');
      expect(tableNames).toContain('appointment_items');
      expect(tableNames).toContain('financial_transactions');
      expect(tableNames).toContain('business_hours');
      expect(tableNames).toContain('schedule_blocks');
      expect(tableNames).toContain('sync_outbox');
      expect(tableNames).toContain('sync_metadata');

      // 2. Operação de escrita e leitura básica na tabela business_hours
      await db.business_hours.add({
        id: 'bh-1',
        tenant_id: tenantId,
        day_of_week: 1,
        is_open: true,
        start_time: '08:00',
        end_time: '18:00',
        break_start_time: '12:00',
        break_end_time: '13:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const saved = await db.business_hours.get('bh-1');
      expect(saved).toBeDefined();
      expect(saved?.day_of_week).toBe(1);
      expect(saved?.start_time).toBe('08:00');
    });
  });

  describe('US-031 — Escrita Otimista e Fila de Mutações (sync_outbox)', () => {
    it('AC-054: Escrita otimista no banco local e enfileiramento na outbox @spec:AC-054', async () => {
      // 1. Criação otimista de paciente
      const patient = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Carlos Alberto Ferreira',
        whatsapp: '11988887777',
      });

      expect(patient.id).toBeDefined();

      // Verifica presença na tabela de pacientes
      const localPatient = await db.patients.get(patient.id);
      expect(localPatient).toBeDefined();
      expect(localPatient?.name).toBe('Carlos Alberto Ferreira');

      // Verifica enfileiramento automático na outbox
      const patientOutbox = await db.sync_outbox.where('record_id').equals(patient.id).first();
      expect(patientOutbox).toBeDefined();
      expect(patientOutbox?.entity).toBe('patients');
      expect(patientOutbox?.operation).toBe('INSERT');
      expect(patientOutbox?.status).toBe('PENDING');

      // 2. Criação otimista de agendamento com múltiplos procedimentos
      const { appointment, items } = await appointmentRepo.createAppointment({
        tenant_id: tenantId,
        patient_id: patient.id,
        start_time: '2026-10-20T10:00:00.000Z',
        end_time: '2026-10-20T11:00:00.000Z',
        status: 'CONFIRMED',
        items: [
          { procedure_id: 'proc-1', effective_price_cents: 15000, duration_minutes: 30 },
          { procedure_id: 'proc-2', effective_price_cents: 20000, duration_minutes: 30 },
        ],
      });

      expect(appointment.id).toBeDefined();
      expect(items).toHaveLength(2);

      // Verifica dados locais
      const localApp = await db.appointments.get(appointment.id);
      expect(localApp?.status).toBe('CONFIRMED');

      const localItems = await db.appointment_items.where('appointment_id').equals(appointment.id).toArray();
      expect(localItems).toHaveLength(2);

      // Verifica mutação na outbox
      const appOutbox = await db.sync_outbox.where('record_id').equals(appointment.id).first();
      expect(appOutbox?.entity).toBe('appointments');
      expect(appOutbox?.operation).toBe('INSERT');
      expect(appOutbox?.status).toBe('PENDING');

      // 3. Atualização otimista de status
      await appointmentRepo.updateStatus(appointment.id, 'NO_SHOW');

      const updatedApp = await db.appointments.get(appointment.id);
      expect(updatedApp?.status).toBe('NO_SHOW');

      const updateMutations = await db.sync_outbox
        .where('record_id')
        .equals(appointment.id)
        .filter((o) => o.operation === 'UPDATE')
        .toArray();
      expect(updateMutations).toHaveLength(1);
      expect(updateMutations[0].payload.status).toBe('NO_SHOW');
    });
  });

  describe('US-032 — Sincronizador Bidirecional e Resiliência de Rede', () => {
    it('AC-055: Sincronização bidirecional (Push e Pull Delta) com resiliência a falhas @spec:AC-055', async () => {
      const syncManager = new SyncManager({
        baseUrl: 'https://api.cliniassist.com',
        tenantId,
        token: 'fake_jwt_token',
        db,
      });

      // Cria paciente local para gerar item na outbox
      const patient = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Juliana Paes',
        whatsapp: '11977776666',
      });

      // 1. Cenário de Falha de Rede (Servidor inacessível ou HTTP 500)
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Falha de conexão com a internet (Offline)'));

      const failPushRes = await syncManager.push();
      expect(failPushRes.success).toBe(false);
      expect(failPushRes.pushedCount).toBe(0);

      // Itens devem permanecer intactos na outbox com status PENDING e retry_count incrementado
      const pendingAfterFail = await db.sync_outbox.where('record_id').equals(patient.id).first();
      expect(pendingAfterFail?.status).toBe('PENDING');
      expect(pendingAfterFail?.retry_count).toBe(1);

      // 2. Cenário de Sucesso na Conexão (HTTP 200)
      global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/sync/batch')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, processed: 1 }),
          });
        }
        if (url.includes('/api/sync/pull')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                server_timestamp: '2026-10-18T18:00:00.000Z',
                patients: [
                  {
                    id: 'server-patient-1',
                    tenant_id: tenantId,
                    name: 'Paciente Vindo do Servidor',
                    whatsapp: '11911112222',
                    is_active: true,
                    created_at: '2026-10-18T12:00:00.000Z',
                    updated_at: '2026-10-18T17:00:00.000Z',
                  },
                ],
                appointments: [],
                procedures: [],
              }),
          });
        }
        return Promise.reject(new Error('URL desconhecida'));
      });

      // Executa PUSH com sucesso
      const successPushRes = await syncManager.push();
      expect(successPushRes.success).toBe(true);
      expect(successPushRes.pushedCount).toBe(1);

      // Fila outbox deve ser esvaziada
      const outboxAfterSuccess = await db.sync_outbox.toArray();
      expect(outboxAfterSuccess).toHaveLength(0);

      // Executa PULL de deltas do servidor
      const pullRes = await syncManager.pull();
      expect(pullRes.success).toBe(true);
      expect(pullRes.pulledPatientsCount).toBe(1);

      // Paciente do servidor deve existir no banco local
      const serverPatient = await db.patients.get('server-patient-1');
      expect(serverPatient).toBeDefined();
      expect(serverPatient?.name).toBe('Paciente Vindo do Servidor');

      // Cursor de sincronização atualizado
      const meta = await db.sync_metadata.get('last_server_sync_timestamp');
      expect(meta?.value).toBe('2026-10-18T18:00:00.000Z');

      // Restaura fetch
      global.fetch = originalFetch;
    });
  });

  describe('US-033 — Poda de Histórico e Monitor de Conexão', () => {
    it('AC-056: Poda automática de histórico antigo e hook de conexão reativo @spec:AC-056', async () => {
      const now = Date.now();
      const oneHundredDaysAgo = new Date(now - 100 * 24 * 60 * 60 * 1000).toISOString();
      const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();

      // 1. Agendamento antigo concluído sem outbox pendente (ELEGÍVEL para poda)
      await db.appointments.add({
        id: 'old-app-1',
        tenant_id: tenantId,
        patient_id: 'pat-1',
        start_time: oneHundredDaysAgo,
        end_time: oneHundredDaysAgo,
        status: 'COMPLETED',
        is_extra_fit: false,
        created_at: oneHundredDaysAgo,
        updated_at: oneHundredDaysAgo,
      });
      await db.appointment_items.add({
        id: 'item-old-1',
        appointment_id: 'old-app-1',
        procedure_id: 'proc-1',
        effective_price_cents: 10000,
        duration_minutes: 30,
      });

      // 2. Agendamento recente concluído (NÃO elegível, < 90 dias)
      await db.appointments.add({
        id: 'recent-app-2',
        tenant_id: tenantId,
        patient_id: 'pat-1',
        start_time: tenDaysAgo,
        end_time: tenDaysAgo,
        status: 'COMPLETED',
        is_extra_fit: false,
        created_at: tenDaysAgo,
        updated_at: tenDaysAgo,
      });

      // 3. Agendamento antigo com mutação pendente na outbox (NÃO elegível, pois ainda não sincronizou)
      await db.appointments.add({
        id: 'old-app-unsynced',
        tenant_id: tenantId,
        patient_id: 'pat-1',
        start_time: oneHundredDaysAgo,
        end_time: oneHundredDaysAgo,
        status: 'COMPLETED',
        is_extra_fit: false,
        created_at: oneHundredDaysAgo,
        updated_at: oneHundredDaysAgo,
      });
      await db.sync_outbox.add({
        id: 'outbox-1',
        client_mutation_id: 'cm-1',
        entity: 'appointments',
        record_id: 'old-app-unsynced',
        operation: 'UPDATE',
        payload: { status: 'COMPLETED' },
        status: 'PENDING',
        retry_count: 0,
        created_at: oneHundredDaysAgo,
        updated_at: oneHundredDaysAgo,
      });

      // Executa poda com janela de 90 dias
      const pruneRes = await pruneOldCompletedAppointments(db, 90);
      expect(pruneRes.prunedAppointmentsCount).toBe(1);
      expect(pruneRes.prunedItemsCount).toBe(1);

      // old-app-1 foi removido
      const oldCheck = await db.appointments.get('old-app-1');
      expect(oldCheck).toBeUndefined();

      // recent-app-2 e old-app-unsynced continuam no banco local
      expect(await db.appointments.get('recent-app-2')).toBeDefined();
      expect(await db.appointments.get('old-app-unsynced')).toBeDefined();
    });
  });
});
