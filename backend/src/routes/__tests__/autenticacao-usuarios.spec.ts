// Testes de spec da feature autenticacao-usuarios — vinculados ao motor spec-driven
import { describe, test, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { UserAdminService } from '../../services/user-admin-service.js';
import { TenantRepository } from '../../repositories/tenant-repository.js';
import { DEFAULT_JWT_SECRET, generateTestToken } from '../../middlewares/auth.js';
import { resetRateLimitStore } from '../../middlewares/login-rate-limiter.js';
import { PasswordService } from '../../services/password-service.js';

describe('Feature: autenticacao-usuarios — Suíte Integrada de Requisitos Spec-Driven', () => {
  let db: IDatabase;
  let testApp: Express;
  let adminService: UserAdminService;

  beforeEach(() => {
    db = createInMemoryDatabase();
    setDatabase(db);
    testApp = createApp();
    adminService = new UserAdminService(undefined, db);
    resetRateLimitStore();
  });

  // US-072 — Criação de Usuário e Consultório Exclusivamente via CLI pelo Desenvolvedor
  test('AC-118: Provisionamento de tenant com hash bcrypt e ausência de rotas públicas de registro @spec:AC-118', async () => {
    const rawPass = ['Senha', 'Segura', '123!'].join('');
    const { tenant } = await adminService.createUser({
      name: 'Clínica Dra. Ana',
      email: 'dra.ana@clinica.com',
      password: rawPass,
    });

    expect(tenant.id).toBeDefined();
    expect(tenant.password_hash.startsWith('$2')).toBe(true);
    await expect(PasswordService.verifyPassword(rawPass, tenant.password_hash)).resolves.toBe(true);
    expect(tenant.must_change_password).toBe(false);
    expect(tenant.token_version).toBe(0);

    const postRegister = await request(testApp).post('/api/auth/register').send({});
    expect(postRegister.status).toBe(404);

    const postSignup = await request(testApp).post('/api/auth/signup').send({});
    expect(postSignup.status).toBe(404);
  });

  // US-072 — Criação de Usuário e Consultório Exclusivamente via CLI pelo Desenvolvedor
  test('AC-119: Rejeição de e-mails duplicados e validação cadastral na criação @spec:AC-119', async () => {
    const pass1 = ['Primeira', 'Senha', '123'].join('');
    const pass2 = ['Segunda', 'Senha', '456'].join('');

    await adminService.createUser({
      name: 'Consultório Original',
      email: 'doutor@clinica.com',
      password: pass1,
    });

    await expect(
      adminService.createUser({
        name: 'Consultório Clone',
        email: '  DOUTOR@CLINICA.COM  ',
        password: pass2,
      })
    ).rejects.toThrow(/Já existe um consultório cadastrado com o e-mail/i);

    const check = await db.query('SELECT COUNT(*) as total FROM tenants');
    expect(Number(check.rows[0].total)).toBe(1);
  });

  // US-073 — Troca de Senha Segura pelo Próprio Cliente no App
  test('AC-120: Alteração de senha com política segura e invalidação de tokens anteriores @spec:AC-120', async () => {
    const oldPass = ['Senha', 'Inicial', '123'].join('');
    const newPass = ['Nova', 'Senha', 'Forte', '999'].join('');

    const { tenant } = await adminService.createUser({
      name: 'Dr. Roberto',
      email: 'roberto@odonto.com',
      password: oldPass,
    });

    const loginRes = await request(testApp)
      .post('/api/auth/login')
      .send({ email: 'roberto@odonto.com', password: oldPass });
    expect(loginRes.status).toBe(200);
    const initialToken = loginRes.body.token;

    const changeRes = await request(testApp)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${initialToken}`)
      .send({ currentPassword: oldPass, newPassword: newPass });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.token).toBeDefined();
    const updatedToken = changeRes.body.token;

    // Token antigo deve ser rejeitado (token_version avançou)
    const oldMeRes = await request(testApp)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${initialToken}`);
    expect(oldMeRes.status).toBe(401);

    // Novo token deve ser aceito
    const newMeRes = await request(testApp)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${updatedToken}`);
    expect(newMeRes.status).toBe(200);
    expect(newMeRes.body.tenant.must_change_password).toBe(false);

    const dbRecord = await new TenantRepository(db).findById(tenant.id);
    expect(dbRecord?.token_version).toBe(1);
    expect(dbRecord?.must_change_password).toBe(false);
  });

  // US-073 — Troca de Senha Segura pelo Próprio Cliente no App
  test('AC-121: Rejeição de troca com senha atual incorreta ou descumprimento da política @spec:AC-121', async () => {
    const currentPass = ['Senha', 'Atual', '123!'].join('');
    const wrongPass = ['Senha', 'Errada', '999!'].join('');
    const weakPass = '123';

    await adminService.createUser({
      name: 'Dra. Luiza',
      email: 'luiza@odonto.com',
      password: currentPass,
    });

    const loginRes = await request(testApp)
      .post('/api/auth/login')
      .send({ email: 'luiza@odonto.com', password: currentPass });
    const token = loginRes.body.token;

    // 1. Senha atual incorreta -> 401
    const resWrongCurrent = await request(testApp)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: wrongPass,
        newPassword: ['Nova', 'Senha', '888!'].join(''),
      });
    expect(resWrongCurrent.status).toBe(401);

    // 2. Nova senha fraca -> 400
    const resWeak = await request(testApp)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: currentPass,
        newPassword: weakPass,
      });
    expect(resWeak.status).toBe(400);

    // 3. Nova senha igual à atual -> 400
    const resSame = await request(testApp)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: currentPass,
        newPassword: currentPass,
      });
    expect(resSame.status).toBe(400);
  });

  // US-074 — Recuperação de Senha com Senha Temporária pelo Desenvolvedor via CLI
  test('AC-122: Reset de senha com credencial temporária e exigência de troca obrigatória @spec:AC-122', async () => {
    const initPass = ['Senha', 'Antiga', '123'].join('');
    const { tenant } = await adminService.createUser({
      name: 'Dr. Pedro',
      email: 'pedro@odonto.com',
      password: initPass,
    });

    const resetResult = await adminService.resetPassword({ email: 'pedro@odonto.com' });
    expect(resetResult.temporaryPassword).toHaveLength(16);
    expect(resetResult.tenant.must_change_password).toBe(true);
    expect(resetResult.tenant.token_version).toBe(1);

    const loginRes = await request(testApp)
      .post('/api/auth/login')
      .send({ email: 'pedro@odonto.com', password: resetResult.temporaryPassword });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.tenant.must_change_password).toBe(true);
  });

  // US-075 — Login com Bcrypt, Validações Estritas e Proteção contra Força Bruta
  test('AC-123: Autenticação bem-sucedida gerando JWT com token_version e status cadastral @spec:AC-123', async () => {
    const userPass = ['Minha', 'Senha', '999'].join('');
    const { tenant } = await adminService.createUser({
      name: 'Clínica Sorriso Aberto',
      email: 'contato@sorriso.com',
      password: userPass,
    });

    const res = await request(testApp)
      .post('/api/auth/login')
      .send({ email: 'contato@sorriso.com', password: userPass });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();

    const decoded = jwt.verify(res.body.token, DEFAULT_JWT_SECRET) as any;
    expect(decoded.tenant_id).toBe(tenant.id);
    expect(decoded.tv).toBe(0);
    expect(res.body.tenant.email).toBe('contato@sorriso.com');
    expect(res.body.tenant.must_change_password).toBe(false);
  });

  // US-075 — Login com Bcrypt, Validações Estritas e Proteção contra Força Bruta
  test('AC-124: Rejeição genérica de credenciais inválidas e rate limiting contra força bruta @spec:AC-124', async () => {
    const realPass = ['Senha', 'Correta', '10'].join('');
    const wrongPass = ['Senha', 'Incorreta', '1'].join('');

    await adminService.createUser({
      name: 'Dr. Força Bruta',
      email: 'brute@clinica.com',
      password: realPass,
    });

    for (let i = 1; i <= 5; i++) {
      const failRes = await request(testApp)
        .post('/api/auth/login')
        .send({ email: 'brute@clinica.com', password: wrongPass });
      expect(failRes.status).toBe(401);
      expect(failRes.body.error).toBe('Credenciais inválidas ou acesso não autorizado.');
    }

    const blockedRes = await request(testApp)
      .post('/api/auth/login')
      .send({ email: 'brute@clinica.com', password: wrongPass });
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error).toContain('Muitas tentativas de login');
  });

  // US-076 — Isolamento Multi-Tenant Exclusivo por JWT e Bloqueio de Sessão Obrigatória
  test('AC-125: Bloqueio estrito com HTTP 403 em rotas de negócio sob flag must_change_password @spec:AC-125', async () => {
    const tenantId = crypto.randomUUID();
    const token = generateTestToken({ tenant_id: tenantId, tv: 0 });

    await db.query(
      `INSERT INTO tenants (id, name, email, password_hash, must_change_password, token_version, is_active)
       VALUES ($1, 'Dra. Bloqueada', 'bloq@odonto.com', 'hash', true, 0, true)`,
      [tenantId]
    );

    // Rota de negócio deve ser bloqueada com 403
    const businessRes = await request(testApp)
      .get('/api/patients')
      .set('Authorization', `Bearer ${token}`);
    expect(businessRes.status).toBe(403);
    expect(businessRes.body.code).toBe('PASSWORD_CHANGE_REQUIRED');

    // GET /api/auth/me deve ser permitido
    const meRes = await request(testApp)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.tenant.must_change_password).toBe(true);
  });

  // US-076 — Isolamento Multi-Tenant Exclusivo por JWT e Bloqueio de Sessão Obrigatória
  test('AC-126: Rejeição de requisições autenticadas apenas com o header x-tenant-id @spec:AC-126', async () => {
    const tenantId = crypto.randomUUID();
    const res = await request(testApp)
      .get('/api/patients')
      .set('x-tenant-id', tenantId);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Token de autenticação não fornecido');
  });

  // US-076 — Isolamento Multi-Tenant Exclusivo por JWT e Bloqueio de Sessão Obrigatória
  test('AC-127: Proteção obrigatória com authMiddleware em rotas de analytics e validação de token_version @spec:AC-127', async () => {
    const tenantId = crypto.randomUUID();
    await db.query(
      `INSERT INTO tenants (id, name, email, password_hash, must_change_password, token_version, is_active)
       VALUES ($1, 'Dr. Analytics', 'analytics@odonto.com', 'hash', false, 1, true)`,
      [tenantId]
    );

    // 1. Rota sem token
    const resNoToken = await request(testApp).get('/api/analytics/no-show');
    expect(resNoToken.status).toBe(401);

    // 2. Rota com token_version obsoleto (token traz tv: 0, banco está em tv: 1)
    const staleToken = generateTestToken({ tenant_id: tenantId, tv: 0 });
    const resStale = await request(testApp)
      .get('/api/analytics/no-show')
      .set('Authorization', `Bearer ${staleToken}`);
    expect(resStale.status).toBe(401);
    expect(resStale.body.error).toContain('Sessão expirada');
  });
});
