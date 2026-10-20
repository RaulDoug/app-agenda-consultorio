import { describe, it, expect, beforeEach, vi } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { TenantRepository } from '../../repositories/tenant-repository.js';
import {
  authMiddleware,
  authAllowPasswordChange,
  generateTestToken,
  getJwtSecret,
} from '../auth.js';

describe('authMiddleware — Autenticação Estrita, Sessão e Bloqueio 403 (T-111)', () => {
  let db: IDatabase;
  let tenantRepo: TenantRepository;
  let testApp: Express;

  const tenantActiveId = '11111111-1111-1111-1111-111111111111';
  const tenantMustChangeId = '22222222-2222-2222-2222-222222222222';
  const tenantInactiveId = '33333333-3333-3333-3333-333333333333';

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    tenantRepo = new TenantRepository(db);

    // Cria tenants para teste
    await tenantRepo.create({
      id: tenantActiveId,
      name: 'Clínica Ativa',
      email: 'ativa@clinica.com',
      password_hash: '$2b$10$hashAtivo123456789012345678901234567890',
      must_change_password: false,
    });

    await tenantRepo.create({
      id: tenantMustChangeId,
      name: 'Clínica Troca Obrigatória',
      email: 'troca@clinica.com',
      password_hash: '$2b$10$hashTroca123456789012345678901234567890',
      must_change_password: true,
    });

    await tenantRepo.create({
      id: tenantInactiveId,
      name: 'Clínica Inativa',
      email: 'inativa@clinica.com',
      password_hash: '$2b$10$hashInativa1234567890123456789012345678',
      must_change_password: false,
    });
    await db.query('UPDATE tenants SET is_active = false WHERE id = $1', [tenantInactiveId]);

    // Configura app Express de teste
    testApp = express();
    testApp.use(express.json());

    // Rota de negócio protegida pelo middleware padrão
    testApp.get('/api/protected/business', authMiddleware, (req, res) => {
      res.json({ success: true, tenantId: req.tenantId, userId: req.userId });
    });

    // Rota de troca de senha protegida pelo middleware permissivo
    testApp.post('/api/protected/change-password', authAllowPasswordChange, (req, res) => {
      res.json({ success: true, tenantId: req.tenantId, mustChange: req.mustChangePassword });
    });
  });

  it('deve rejeitar requisição sem cabeçalho Authorization com 401', async () => {
    const res = await request(testApp).get('/api/protected/business');
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Token de autenticação não fornecido');
  });

  it('deve rejeitar terminantemente requisição enviada APENAS com header x-tenant-id (fim do bypass)', async () => {
    const res = await request(testApp)
      .get('/api/protected/business')
      .set('x-tenant-id', tenantActiveId);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Token de autenticação não fornecido');
  });

  it('deve autenticar com sucesso requisição com token JWT válido e tv correspondente', async () => {
    const token = generateTestToken({ tenant_id: tenantActiveId, tv: 0, user_id: 'user-01' });

    const res = await request(testApp)
      .get('/api/protected/business')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tenantId).toBe(tenantActiveId);
    expect(res.body.userId).toBe('user-01');
  });

  it('deve rejeitar token com assinatura inválida ou malformado com 401', async () => {
    const res = await request(testApp)
      .get('/api/protected/business')
      .set('Authorization', 'Bearer token_completamente_invalido');

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Token de autenticação inválido ou expirado');
  });

  it('deve rejeitar requisição se o consultório estiver desativado no banco', async () => {
    const token = generateTestToken({ tenant_id: tenantInactiveId, tv: 0 });

    const res = await request(testApp)
      .get('/api/protected/business')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Consultório inativo ou não encontrado');
  });

  it('deve rejeitar com SESSION_REVOKED se o tv do token for diferente do token_version no banco', async () => {
    // Tenant no banco está com token_version = 0, enviamos token com tv = 99
    const tokenAntigo = generateTestToken({ tenant_id: tenantActiveId, tv: 99 });

    const res = await request(testApp)
      .get('/api/protected/business')
      .set('Authorization', `Bearer ${tokenAntigo}`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('SESSION_REVOKED');
  });

  it('deve bloquear com 403 (PASSWORD_CHANGE_REQUIRED) rota de negócio para usuário com must_change_password', async () => {
    const token = generateTestToken({ tenant_id: tenantMustChangeId, tv: 0 });

    const res = await request(testApp)
      .get('/api/protected/business')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('PASSWORD_CHANGE_REQUIRED');
    expect(res.body.error).toContain('Troca de senha obrigatória');
  });

  it('deve autorizar rota com authAllowPasswordChange mesmo quando must_change_password for true', async () => {
    const token = generateTestToken({ tenant_id: tenantMustChangeId, tv: 0 });

    const res = await request(testApp)
      .post('/api/protected/change-password')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tenantId).toBe(tenantMustChangeId);
    expect(res.body.mustChange).toBe(true);
  });

  it('deve exigir JWT_SECRET em ambiente de produção', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.JWT_SECRET;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      expect(() => getJwtSecret()).toThrow('CONFIGURAÇÃO CRÍTICA');
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalSecret) process.env.JWT_SECRET = originalSecret;
    }
  });
});
