import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authMiddleware, generateTestToken } from '../../middlewares/auth.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';

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

    testApp = express();
    testApp.use(express.json());

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
    it('AC-013: Proteção contra injeção SQL em buscas @spec:AC-013', () => {
      throw new Error('AC-013 pendente de implementação (T-010)');
    });

    it('AC-014: Soft Delete em remoção de pacientes @spec:AC-014', () => {
      throw new Error('AC-014 pendente de implementação (T-010)');
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
