import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authMiddleware, generateTestToken } from '../../middlewares/auth.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';

import { createApp } from '../../app.js';

describe('API REST e Persistência Multi-Tenant — OdontoFlow', () => {
  let db: IDatabase;
  let testApp: express.Express;

  const tenantA = '11111111-1111-1111-1111-111111111111';
  const tenantB = '22222222-2222-2222-2222-222222222222';

  const tokenTenantA = generateTestToken({ tenant_id: tenantA, user_id: 'user-a' });
  const tokenTenantB = generateTestToken({ tenant_id: tenantB, user_id: 'user-b' });

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);

    // Cria tenants no banco
    await db.query(
      `INSERT INTO tenants (id, name) VALUES ($1, $2), ($3, $4)`,
      [tenantA, 'Consultório Dr. A', tenantB, 'Consultório Dra. B']
    );

    testApp = createApp();

    // Rota protegida de teste de contexto
    testApp.get('/api/protected/profile', authMiddleware, (req, res) => {
      res.json({ tenant_id: req.tenantId, user_id: req.userId });
    });

    // Rota protegida simulando consulta com isolamento estrito
    testApp.get('/api/protected/patients-test', authMiddleware, async (req, res) => {
      const result = await db.query(
        `SELECT * FROM patients WHERE tenant_id = $1 AND is_active = true AND deleted_at IS NULL`,
        [req.tenantId]
      );
      res.json(result.rows);
    });
  });

  describe('US-007 — Isolamento Multi-Tenant e Autenticação JWT', () => {
    it('AC-011: Rejeição de requisições sem token de autenticação @spec:AC-011', async () => {
      // 1. Sem header de autorização
      const resNoHeader = await request(testApp).get('/api/protected/profile');
      expect(resNoHeader.status).toBe(401);
      expect(resNoHeader.body.error).toContain('Token de autenticação não fornecido');

      // 2. Com token inválido
      const resInvalid = await request(testApp)
        .get('/api/protected/profile')
        .set('Authorization', 'Bearer token_invalido_123');
      expect(resInvalid.status).toBe(401);
      expect(resInvalid.body.error).toContain('Token de autenticação inválido');
    });

    it('AC-012: Isolamento estrito entre diferentes consultórios @spec:AC-012', async () => {
      // 1. Insere paciente no Tenant A
      await db.query(
        `INSERT INTO patients (id, tenant_id, name, whatsapp) VALUES ($1, $2, $3, $4)`,
        ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', tenantA, 'Paciente do Consultório A', '5511999991111']
      );

      // 2. Consulta como Tenant A -> deve ver o paciente
      const resA = await request(testApp)
        .get('/api/protected/patients-test')
        .set('Authorization', `Bearer ${tokenTenantA}`);
      expect(resA.status).toBe(200);
      expect(resA.body).toHaveLength(1);
      expect(resA.body[0].name).toBe('Paciente do Consultório A');

      // 3. Consulta como Tenant B -> retorno deve ser estritamente vazio
      const resB = await request(testApp)
        .get('/api/protected/patients-test')
        .set('Authorization', `Bearer ${tokenTenantB}`);
      expect(resB.status).toBe(200);
      expect(resB.body).toEqual([]);
    });
  });

  describe('US-008 — Gestão Rápida de Pacientes e Procedimentos', () => {
    it('AC-013: Proteção contra injeção SQL em buscas @spec:AC-013', async () => {
      // 1. Cadastra pacientes para o Tenant A
      await request(testApp)
        .post('/api/patients')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send({ name: 'Carlos Eduardo', whatsapp: '5511999991111' });

      await request(testApp)
        .post('/api/patients')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send({ name: 'Mariana Silva', whatsapp: '5511988882222' });

      // 2. Executa busca contendo injeção SQL clássica
      const injectionPayload = "' OR '1'='1; --";
      const resInjection = await request(testApp)
        .get(`/api/patients?search=${encodeURIComponent(injectionPayload)}`)
        .set('Authorization', `Bearer ${tokenTenantA}`);

      expect(resInjection.status).toBe(200);
      // O input deve ser tratado literalmente: nenhum paciente coincide com a string da injeção
      expect(resInjection.body).toEqual([]);

      // 3. Busca legítima por prefixo deve funcionar normalmente via query parametrizada
      const resSearch = await request(testApp)
        .get('/api/patients?search=Carlos')
        .set('Authorization', `Bearer ${tokenTenantA}`);

      expect(resSearch.status).toBe(200);
      expect(resSearch.body).toHaveLength(1);
      expect(resSearch.body[0].name).toBe('Carlos Eduardo');
    });

    it('AC-014: Soft Delete em remoção de pacientes @spec:AC-014', async () => {
      const patientId = '33333333-3333-3333-3333-333333333333';
      const appointmentId = '44444444-4444-4444-4444-444444444444';

      // 1. Cadastra paciente
      await request(testApp)
        .post('/api/patients')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send({ id: patientId, name: 'Paciente com Histórico', whatsapp: '5511977773333' });

      // 2. Cria agendamento vinculado diretamente no banco
      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status, total_charged_cents)
         VALUES ($1, $2, $3, '2026-10-20 09:00:00+00', '2026-10-20 09:30:00+00', 'CONFIRMED', 15000)`,
        [appointmentId, tenantA, patientId]
      );

      // 3. Executa Soft Delete pela rota da API
      const resDelete = await request(testApp)
        .delete(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${tokenTenantA}`);

      expect(resDelete.status).toBe(200);
      expect(resDelete.body.message).toContain('Soft Delete');

      // 4. Verificação no banco: registro AINDA existe (NÃO houve DELETE FROM), mas is_active = false e deleted_at preenchido
      const rawPatient = await db.query(
        `SELECT id, name, is_active, deleted_at FROM patients WHERE id = $1`,
        [patientId]
      );
      expect(rawPatient.rows).toHaveLength(1);
      expect(rawPatient.rows[0].is_active).toBe(false);
      expect(rawPatient.rows[0].deleted_at).not.toBeNull();

      // 5. Histórico de agendamento do paciente permanece intacto
      const rawAppointment = await db.query(
        `SELECT id, patient_id, status FROM appointments WHERE id = $1`,
        [appointmentId]
      );
      expect(rawAppointment.rows).toHaveLength(1);
      expect(rawAppointment.rows[0].patient_id).toBe(patientId);

      // 6. Rota GET /api/patients/:id retorna 404 (ignora registros soft-deleted)
      const resGetOne = await request(testApp)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${tokenTenantA}`);
      expect(resGetOne.status).toBe(404);

      // 7. Rota GET /api/patients não traz o paciente na listagem de ativos
      const resList = await request(testApp)
        .get('/api/patients')
        .set('Authorization', `Bearer ${tokenTenantA}`);
      expect(resList.body.some((p: any) => p.id === patientId)).toBe(false);
    });
  });

  describe('US-009 — Criação Atômica de Agendamento com Múltiplos Procedimentos', () => {
    it('AC-015: Inserção transacional com rollback automático @spec:AC-015', async () => {
      // 1. Cadastra paciente válido
      const patientRes = await request(testApp)
        .post('/api/patients')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send({ name: 'Paciente Transação', whatsapp: '5511999998888' });
      const patientId = patientRes.body.id;

      // 2. Cadastra um procedimento válido
      const procRes = await request(testApp)
        .post('/api/procedures')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send({
          name: 'Limpeza Dental',
          default_duration_minutes: 30,
          default_price_cents: 15000,
        });
      const validProcId = procRes.body.id;
      const invalidProcId = '99999999-9999-9999-9999-999999999999';

      // 3. Tenta criar agendamento contendo 1 procedimento válido e 1 inválido (que força falha)
      const resCreate = await request(testApp)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send({
          patient_id: patientId,
          start_time: '2026-10-20T10:00:00.000Z',
          procedure_ids: [validProcId, invalidProcId],
        });

      // Deve falhar com 400
      expect(resCreate.status).toBe(400);

      // 4. Verificação no banco: ROLLBACK executado — nenhum agendamento órfão deve existir
      const rawAppointments = await db.query(
        `SELECT * FROM appointments WHERE tenant_id = $1 AND patient_id = $2`,
        [tenantA, patientId]
      );
      expect(rawAppointments.rows).toHaveLength(0);

      // Nenhum item de agendamento deve ter sido persistido
      const rawItems = await db.query(`SELECT * FROM appointment_items`);
      expect(rawItems.rows).toHaveLength(0);
    });

    it('AC-016: Prevenção de conflito de horário (Double Booking) @spec:AC-016', async () => {
      // 1. Cria paciente e procedimento
      const pRes = await request(testApp)
        .post('/api/patients')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send({ name: 'Paciente Conflito', whatsapp: '5511911112222' });

      const procRes = await request(testApp)
        .post('/api/procedures')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send({
          name: 'Restauração',
          default_duration_minutes: 45,
          default_price_cents: 20000,
        });

      // 2. Primeiro agendamento: 14:00 às 14:45
      const res1 = await request(testApp)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send({
          patient_id: pRes.body.id,
          start_time: '2026-10-21T14:00:00.000Z',
          procedure_ids: [procRes.body.id],
        });
      expect(res1.status).toBe(201);
      expect(res1.body.id).toBeDefined();

      // 3. Segundo agendamento sobreposto (14:30 às 15:15) SEM flag confirm_overtime
      const resConflict = await request(testApp)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send({
          patient_id: pRes.body.id,
          start_time: '2026-10-21T14:30:00.000Z',
          procedure_ids: [procRes.body.id],
          confirm_overtime: false,
        });

      // Deve ser recusado com 409 Conflict
      expect(resConflict.status).toBe(409);
      expect(resConflict.body.error).toContain('Double Booking');

      // 4. Terceiro agendamento no mesmo horário sobreposto COM flag confirm_overtime (encaixe extraordinário)
      const resOvertime = await request(testApp)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send({
          patient_id: pRes.body.id,
          start_time: '2026-10-21T14:30:00.000Z',
          procedure_ids: [procRes.body.id],
          confirm_overtime: true,
        });

      expect(resOvertime.status).toBe(201);
      expect(resOvertime.body.is_overtime).toBe(true);
    });
  });

  describe('US-010 — Sincronização em Lote Offline-First', () => {
    it('AC-017: Processamento idempotente de lote de sincronização @spec:AC-017', async () => {
      // 1. Cadastra paciente e procedimento para os agendamentos do lote
      const pRes = await request(testApp)
        .post('/api/patients')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send({ name: 'Paciente Offline', whatsapp: '5511955556666' });
      const patientId = pRes.body.id;

      const procRes = await request(testApp)
        .post('/api/procedures')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send({
          name: 'Profilaxia',
          default_duration_minutes: 30,
          default_price_cents: 12000,
        });
      const procedureId = procRes.body.id;

      const appSyncId1 = '77777777-7777-7777-7777-777777777771';
      const appSyncId2 = '77777777-7777-7777-7777-777777777772';

      const batchPayload = {
        appointments: [
          {
            id: appSyncId1,
            patient_id: patientId,
            start_time: '2026-10-22T09:00:00.000Z',
            end_time: '2026-10-22T09:30:00.000Z',
            status: 'CONFIRMED',
            is_overtime: false,
            total_charged_cents: 12000,
            notes: 'Criado no celular 1',
            created_at: '2026-10-22T08:00:00.000Z',
            updated_at: '2026-10-22T08:00:00.000Z',
            items: [
              {
                procedure_id: procedureId,
                effective_price_cents: 12000,
                duration_minutes: 30,
              },
            ],
          },
          {
            id: appSyncId2,
            patient_id: patientId,
            start_time: '2026-10-22T10:00:00.000Z',
            end_time: '2026-10-22T10:30:00.000Z',
            status: 'PENDING',
            is_overtime: false,
            total_charged_cents: 12000,
            notes: 'Criado no celular 2',
            created_at: '2026-10-22T08:00:00.000Z',
            updated_at: '2026-10-22T08:00:00.000Z',
          },
        ],
      };

      // 2. Primeira submissão do lote
      const resFirst = await request(testApp)
        .post('/api/sync/batch')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send(batchPayload);

      expect(resFirst.status).toBe(200);
      expect(resFirst.body.success).toBe(true);
      expect(resFirst.body.applied).toBe(2);

      // 3. Segunda submissão idêntica (simulando reenvio de conexão oscilante)
      const resSecond = await request(testApp)
        .post('/api/sync/batch')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send(batchPayload);

      // Não deve gerar erro 500 de chave única nem duplicar registros
      expect(resSecond.status).toBe(200);
      expect(resSecond.body.success).toBe(true);

      // 4. Verificação no banco: exatamente 2 registros no total
      const countRes = await db.query(
        `SELECT COUNT(*) as total FROM appointments WHERE id IN ($1, $2)`,
        [appSyncId1, appSyncId2]
      );
      expect(Number(countRes.rows[0].total)).toBe(2);
    });

    it('AC-018: Resolução de conflito Last-Write-Wins @spec:AC-018', async () => {
      // 1. Cadastra paciente
      const pRes = await request(testApp)
        .post('/api/patients')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send({ name: 'Paciente LWW', whatsapp: '5511944443333' });
      const patientId = pRes.body.id;

      const appointmentId = '88888888-8888-8888-8888-888888888888';

      // 2. Estado inicial no servidor: criado às 10:00
      await db.query(
        `INSERT INTO appointments (
          id, tenant_id, patient_id, start_time, end_time, status,
          is_overtime, total_charged_cents, notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, '2026-10-25 14:00:00+00', '2026-10-25 14:30:00+00', 'PENDING',
          false, 10000, 'Versão Servidor Antiga', '2026-10-20 10:00:00+00', '2026-10-20 10:00:00+00'
        )`,
        [appointmentId, tenantA, patientId]
      );

      // 3. Submete lote offline com updated_at MAIS RECENTE (12:00): status alterado para COMPLETED
      const resNewer = await request(testApp)
        .post('/api/sync/batch')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send({
          appointments: [
            {
              id: appointmentId,
              patient_id: patientId,
              start_time: '2026-10-25T14:00:00.000Z',
              end_time: '2026-10-25T14:30:00.000Z',
              status: 'COMPLETED',
              is_overtime: false,
              total_charged_cents: 10000,
              notes: 'Atualização Recente Offline',
              updated_at: '2026-10-20T12:00:00.000Z',
            },
          ],
        });

      expect(resNewer.status).toBe(200);
      expect(resNewer.body.applied).toBe(1);

      // Verificação: os dados mais recentes prevaleceram no servidor
      const checkNewer = await db.query(
        `SELECT status, notes FROM appointments WHERE id = $1`,
        [appointmentId]
      );
      expect(checkNewer.rows[0].status).toBe('COMPLETED');
      expect(checkNewer.rows[0].notes).toBe('Atualização Recente Offline');

      // 4. Submete lote atrasado com updated_at MAIS ANTIGO (09:00): não deve sobrescrever
      const resOlder = await request(testApp)
        .post('/api/sync/batch')
        .set('Authorization', `Bearer ${tokenTenantA}`)
        .send({
          appointments: [
            {
              id: appointmentId,
              patient_id: patientId,
              start_time: '2026-10-25T14:00:00.000Z',
              end_time: '2026-10-25T14:30:00.000Z',
              status: 'CANCELLED',
              is_overtime: false,
              total_charged_cents: 10000,
              notes: 'Atualização Antiga Atrasada',
              updated_at: '2026-10-20T09:00:00.000Z',
            },
          ],
        });

      expect(resOlder.status).toBe(200);
      expect(resOlder.body.ignored).toBe(1);

      // Verificação: continua com a versão mais recente intacta
      const checkFinal = await db.query(
        `SELECT status, notes FROM appointments WHERE id = $1`,
        [appointmentId]
      );
      expect(checkFinal.rows[0].status).toBe('COMPLETED');
      expect(checkFinal.rows[0].notes).toBe('Atualização Recente Offline');
    });
  });
});
