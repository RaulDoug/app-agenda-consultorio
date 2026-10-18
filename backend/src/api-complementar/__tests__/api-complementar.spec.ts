import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { hashPassword } from '../../services/auth-service.js';
import {
  calculateDiscountDistribution,
  generateInstallmentSchedule,
  validateInstallmentPlan,
  validateBusinessHours,
  suggestSmartReturnSlots,
} from '@cliniassist/shared';

describe('API Complementar — CliniAssist (Sprint BE-6)', () => {
  let db: IDatabase;
  let testApp: Express;

  const activeTenantId = '11111111-1111-1111-1111-111111111111';
  const inactiveTenantId = '22222222-2222-2222-2222-222222222222';

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    testApp = createApp();

    // Inserção dos tenants para teste de autenticação
    const pwdHash = hashPassword('senhaSegura123');
    await db.query(
      `INSERT INTO tenants (id, name, email, password_hash, whatsapp_instance_name, whatsapp_connected, is_active)
       VALUES 
       ($1, 'Clínica Sorriso & Saúde', 'contato@sorrisosaude.com', $3, 'instancia_sorriso', true, true),
       ($2, 'Clínica Desativada', 'inativa@cliniassist.com', $3, 'instancia_inativa', false, false)`,
      [activeTenantId, inactiveTenantId, pwdHash]
    );
  });

  describe('US-021 — Autenticação e Sessão Multi-Tenant', () => {
    it('AC-041: Login com sucesso gerando token JWT e dados do tenant @spec:AC-041', async () => {
      const res = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'contato@sorrisosaude.com',
          password: 'senhaSegura123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      expect(res.body.token.length).toBeGreaterThan(20);

      expect(res.body.tenant).toBeDefined();
      expect(res.body.tenant.id).toBe(activeTenantId);
      expect(res.body.tenant.name).toBe('Clínica Sorriso & Saúde');
      expect(res.body.tenant.email).toBe('contato@sorrisosaude.com');
      expect(res.body.tenant.whatsapp_instance_name).toBe('instancia_sorriso');
      expect(res.body.tenant.whatsapp_connected).toBe(true);
    });

    it('AC-042: Rejeição de login com credenciais incorretas ou tenant inativo @spec:AC-042', async () => {
      // 1. Senha incorreta
      const resWrongPassword = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'contato@sorrisosaude.com',
          password: 'senhaErrada999',
        });
      expect(resWrongPassword.status).toBe(401);
      expect(resWrongPassword.body.error).toBe('Credenciais inválidas ou acesso não autorizado.');

      // 2. Usuário inexistente
      const resNotFound = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'naoexiste@clinica.com',
          password: 'senhaSegura123',
        });
      expect(resNotFound.status).toBe(401);
      expect(resNotFound.body.error).toBe('Credenciais inválidas ou acesso não autorizado.');

      // 3. Tenant inativo
      const resInactive = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'inativa@cliniassist.com',
          password: 'senhaSegura123',
        });
      expect(resInactive.status).toBe(401);
      expect(resInactive.body.error).toBe('Credenciais inválidas ou acesso não autorizado.');

      // 4. Campos vazios
      const resEmpty = await request(testApp)
        .post('/api/auth/login')
        .send({});
      expect(resEmpty.status).toBe(401);
    });
  });

  describe('US-026 — Domínio Compartilhado em @cliniassist/shared para Execução Offline', () => {
    it('AC-048: Disponibilização e validação das regras de negócio em @cliniassist/shared @spec:AC-048', () => {
      // Valida que o backend importa diretamente de @cliniassist/shared e executa as regras puras com sucesso
      const discountRes = calculateDiscountDistribution(
        [{ procedureId: 'p1', priceCents: 5000 }],
        { discountCents: 1000 }
      );
      expect(discountRes.totalEffectiveCents).toBe(4000);

      const schedule = generateInstallmentSchedule({
        totalAmountCents: 10000,
        installmentsCount: 2,
      });
      expect(schedule).toHaveLength(2);

      expect(() => validateInstallmentPlan({ totalAmountCents: 0, installmentsCount: 1 })).toThrow();
    });
  });

  describe('US-022 — Sincronização Delta (Pull Sync) para Dispositivos Offline-First', () => {
    it('AC-043: Retorno delta incremental de mutações do servidor @spec:AC-043', async () => {
      const patientRecentId = '33333333-3333-3333-3333-333333333331';
      const patientOldId = '33333333-3333-3333-3333-333333333332';
      const patientTenantBId = '33333333-3333-3333-3333-333333333333';

      // 1. Paciente recente (atualizado em 12:00)
      await db.query(
        `INSERT INTO patients (id, tenant_id, name, whatsapp, created_at, updated_at)
         VALUES ($1, $2, 'Maria Recente', '5511999990001', '2026-10-18 10:00:00+00', '2026-10-18 12:00:00+00')`,
        [patientRecentId, activeTenantId]
      );

      // 2. Paciente antigo (atualizado em 09:00, anterior ao since)
      await db.query(
        `INSERT INTO patients (id, tenant_id, name, whatsapp, created_at, updated_at)
         VALUES ($1, $2, 'José Antigo', '5511999990002', '2026-10-18 09:00:00+00', '2026-10-18 09:00:00+00')`,
        [patientOldId, activeTenantId]
      );

      // 3. Paciente de outro tenant
      await db.query(
        `INSERT INTO patients (id, tenant_id, name, whatsapp, created_at, updated_at)
         VALUES ($1, $2, 'Outro Tenant', '5511999990003', '2026-10-18 12:00:00+00', '2026-10-18 12:00:00+00')`,
        [patientTenantBId, inactiveTenantId]
      );

      // 4. Procedimento recente
      const procId = '44444444-4444-4444-4444-444444444441';
      await db.query(
        `INSERT INTO procedures (id, tenant_id, name, default_duration_minutes, default_price_cents, created_at, updated_at)
         VALUES ($1, $2, 'Consulta Odontológica', 30, 15000, '2026-10-18 11:30:00+00', '2026-10-18 11:30:00+00')`,
        [procId, activeTenantId]
      );

      // 5. Agendamento recente com item
      const appId = '55555555-5555-5555-5555-555555555551';
      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status, created_at, updated_at)
         VALUES ($1, $2, $3, '2026-10-19 14:00:00+00', '2026-10-19 14:30:00+00', 'CONFIRMED', '2026-10-18 10:00:00+00', '2026-10-18 12:15:00+00')`,
        [appId, activeTenantId, patientRecentId]
      );
      await db.query(
        `INSERT INTO appointment_items (id, appointment_id, procedure_id, effective_price_cents, duration_minutes)
         VALUES ('66666666-6666-6666-6666-666666666661', $1, $2, 15000, 30)`,
        [appId, procId]
      );

      const res = await request(testApp)
        .get('/api/sync/pull')
        .set('x-tenant-id', activeTenantId)
        .query({ since: '2026-10-18T11:00:00.000Z' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('server_timestamp');

      // Verifica isolamento e delta de pacientes
      const patientIds = res.body.patients.map((p: any) => p.id);
      expect(patientIds).toContain(patientRecentId);
      expect(patientIds).not.toContain(patientOldId);
      expect(patientIds).not.toContain(patientTenantBId);

      // Verifica appointments e itens acoplados
      expect(res.body.appointments).toHaveLength(1);
      expect(res.body.appointments[0].id).toBe(appId);
      expect(res.body.appointments[0].items).toHaveLength(1);
      expect(res.body.appointments[0].items[0].procedure_id).toBe(procId);

      // Verifica procedures delta
      const procIds = res.body.procedures.map((p: any) => p.id);
      expect(procIds).toContain(procId);
    });
  });

  describe('US-023 — Gerenciamento da Sessão e Status do WhatsApp', () => {
    it('AC-044: Consulta de status da sessão WhatsApp e obtenção de QR Code @spec:AC-044', async () => {
      // 1. Instância conectada
      const resConnected = await request(testApp)
        .get('/api/whatsapp/session')
        .set('x-tenant-id', activeTenantId);

      expect(resConnected.status).toBe(200);
      expect(resConnected.body.connected).toBe(true);
      expect(resConnected.body.instanceName).toBe('instancia_sorriso');
      expect(resConnected.body.state).toBe('open');

      // 2. Instância desconectada (deve emitir QR Code)
      const resDisconnected = await request(testApp)
        .get('/api/whatsapp/session')
        .set('x-tenant-id', inactiveTenantId);

      expect(resDisconnected.status).toBe(200);
      expect(resDisconnected.body.connected).toBe(false);
      expect(resDisconnected.body.state).toBe('close');
      expect(resDisconnected.body.qrcode).toMatch(/^data:image\/png;base64,/);

      // 3. Solicitação de nova conexão / QR Code
      const resConnect = await request(testApp)
        .post('/api/whatsapp/connect')
        .set('x-tenant-id', inactiveTenantId);

      expect(resConnect.status).toBe(200);
      expect(resConnect.body.state).toBe('connecting');
      expect(resConnect.body.qrcode).toBeDefined();
    });
  });

  // Testes a serem implementados nas tarefas T-030 a T-031
  describe('US-024 — Gestão de Expediente e Bloqueios de Agenda', () => {
    it('AC-045: Consulta e atualização do expediente semanal de trabalho @spec:AC-045', async () => {
      // 1. Configuração inicial de expediente (Segunda a Sexta aberto, Sábado meio período, Domingo fechado)
      const businessDays = [
        { day_of_week: 0, is_open: false },
        { day_of_week: 1, is_open: true, start_time: '08:00', end_time: '18:00', break_start_time: '12:00', break_end_time: '13:00' },
        { day_of_week: 2, is_open: true, start_time: '08:00', end_time: '18:00', break_start_time: '12:00', break_end_time: '13:00' },
      ];

      const putRes = await request(testApp)
        .put('/api/business-hours')
        .set('x-tenant-id', activeTenantId)
        .send(businessDays);

      expect(putRes.status).toBe(200);
      expect(putRes.body).toHaveLength(3);
      expect(putRes.body[0].day_of_week).toBe(0);
      expect(putRes.body[0].is_open).toBe(false);
      expect(putRes.body[1].day_of_week).toBe(1);
      expect(putRes.body[1].is_open).toBe(true);
      expect(putRes.body[1].start_time).toMatch(/^08:00/);
      expect(putRes.body[1].end_time).toMatch(/^18:00/);

      // 2. Consulta via GET
      const getRes = await request(testApp)
        .get('/api/business-hours')
        .set('x-tenant-id', activeTenantId);

      expect(getRes.status).toBe(200);
      expect(getRes.body).toHaveLength(3);

      // 3. Validação de consistência: horário de término anterior ou igual ao início
      const invalidTimeRes = await request(testApp)
        .put('/api/business-hours')
        .set('x-tenant-id', activeTenantId)
        .send([
          { day_of_week: 3, is_open: true, start_time: '18:00', end_time: '08:00' }
        ]);
      expect(invalidTimeRes.status).toBe(400);
      expect(invalidTimeRes.body.error).toContain('término deve ser posterior');

      // 4. Validação de intervalo de almoço fora da jornada
      const invalidBreakRes = await request(testApp)
        .put('/api/business-hours')
        .set('x-tenant-id', activeTenantId)
        .send([
          { day_of_week: 3, is_open: true, start_time: '08:00', end_time: '18:00', break_start_time: '12:00', break_end_time: '19:00' }
        ]);
      expect(invalidBreakRes.status).toBe(400);
      expect(invalidBreakRes.body.error).toContain('intervalo de almoço deve estar contido');

      // 5. Isolamento multi-tenant
      const tenantBRes = await request(testApp)
        .get('/api/business-hours')
        .set('x-tenant-id', inactiveTenantId);
      expect(tenantBRes.status).toBe(200);
      expect(tenantBRes.body).toHaveLength(0);
    });

    it('AC-046: Cadastro, listagem e remoção de bloqueios de agenda @spec:AC-046', async () => {
      // 1. Criação de novo bloqueio
      const postRes = await request(testApp)
        .post('/api/schedule-blocks')
        .set('x-tenant-id', activeTenantId)
        .send({
          title: 'Congresso de Saúde Integrada',
          start_time: '2026-11-10T08:00:00.000Z',
          end_time: '2026-11-12T18:00:00.000Z',
        });

      expect(postRes.status).toBe(201);
      expect(postRes.body).toHaveProperty('id');
      expect(postRes.body.title).toBe('Congresso de Saúde Integrada');
      expect(new Date(postRes.body.start_time).toISOString()).toBe('2026-11-10T08:00:00.000Z');
      expect(new Date(postRes.body.end_time).toISOString()).toBe('2026-11-12T18:00:00.000Z');

      const blockId = postRes.body.id;

      // 2. Validação: datas inconsistentes (término anterior ao início)
      const invalidBlockRes = await request(testApp)
        .post('/api/schedule-blocks')
        .set('x-tenant-id', activeTenantId)
        .send({
          title: 'Bloqueio Inválido',
          start_time: '2026-11-12T18:00:00.000Z',
          end_time: '2026-11-10T08:00:00.000Z',
        });
      expect(invalidBlockRes.status).toBe(400);
      expect(invalidBlockRes.body.error).toContain('término do bloqueio deve ser posterior');

      // 3. Listagem de bloqueios ativos
      const listRes = await request(testApp)
        .get('/api/schedule-blocks')
        .set('x-tenant-id', activeTenantId);
      expect(listRes.status).toBe(200);
      expect(listRes.body).toHaveLength(1);
      expect(listRes.body[0].id).toBe(blockId);

      // 4. Soft delete do bloqueio
      const deleteRes = await request(testApp)
        .delete(`/api/schedule-blocks/${blockId}`)
        .set('x-tenant-id', activeTenantId);
      expect(deleteRes.status).toBe(200);

      // 5. Listagem não deve mais exibir o bloqueio
      const listAfterDelete = await request(testApp)
        .get('/api/schedule-blocks')
        .set('x-tenant-id', activeTenantId);
      expect(listAfterDelete.status).toBe(200);
      expect(listAfterDelete.body).toHaveLength(0);

      // 6. Verificação de soft delete no banco
      const rawDbRes = await db.query(
        `SELECT id, deleted_at FROM schedule_blocks WHERE id = $1`,
        [blockId]
      );
      expect(rawDbRes.rows[0].deleted_at).not.toBeNull();
    });
  });

  describe('US-025 — Listagem e Filtro de Transações Financeiras (Tarefa T-031)', () => {
    it.skip('AC-047: Listagem filtrada de movimentações de receitas e despesas @spec:AC-047', () => {});
  });
});
