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

  // Testes a serem implementados nas tarefas T-028 a T-031
  describe('US-022 a US-025 (Tarefas T-028 a T-031)', () => {
    it.skip('AC-043: Retorno delta incremental de mutações do servidor @spec:AC-043', () => {});
    it.skip('AC-044: Consulta de status da sessão WhatsApp e obtenção de QR Code @spec:AC-044', () => {});
    it.skip('AC-045: Consulta e atualização do expediente semanal de trabalho @spec:AC-045', () => {});
    it.skip('AC-046: Cadastro, listagem e remoção de bloqueios de agenda @spec:AC-046', () => {});
    it.skip('AC-047: Listagem filtrada de movimentações de receitas e despesas @spec:AC-047', () => {});
  });
});
