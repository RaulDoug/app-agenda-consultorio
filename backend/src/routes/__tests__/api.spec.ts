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
    it('AC-015: Inserção transacional com rollback automático @spec:AC-015', () => {
      throw new Error('AC-015 pendente de implementação (T-011)');
    });

    it('AC-016: Prevenção de conflito de horário (Double Booking) @spec:AC-016', () => {
      throw new Error('AC-016 pendente de implementação (T-011)');
    });
  });

  describe('US-010 — Sincronização em Lote Offline-First', () => {
    it('AC-017: Processamento idempotente de lote de sincronização @spec:AC-017', () => {
      throw new Error('AC-017 pendente de implementação (T-012)');
    });

    it('AC-018: Resolução de conflito Last-Write-Wins @spec:AC-018', () => {
      throw new Error('AC-018 pendente de implementação (T-012)');
    });
  });
});
