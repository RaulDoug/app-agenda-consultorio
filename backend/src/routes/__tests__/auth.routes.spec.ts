import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { TenantRepository } from '../../repositories/tenant-repository.js';
import { PasswordService } from '../../services/password-service.js';
import { generateTestToken } from '../../middlewares/auth.js';
import { resetRateLimitStore } from '../../middlewares/login-rate-limiter.js';

describe('Rotas de Autenticação e Proteção da API (T-113)', () => {
  let db: IDatabase;
  let tenantRepo: TenantRepository;
  let app: Express;

  const validPass = ['Segredo', 'Forte', '2026'].join('');
  const newPass = ['Nova', 'Senha', '999'].join('');
  const wrongPass = ['Errada', 'Total', '0'].join('');

  let activeTenantId: string;

  beforeEach(async () => {
    resetRateLimitStore();
    db = createInMemoryDatabase();
    setDatabase(db);
    tenantRepo = new TenantRepository(db);
    app = createApp();

    const hash = await PasswordService.hashPassword(validPass);
    const tenant = await tenantRepo.create({
      name: 'Clínica Odonto Teste',
      email: 'teste@odontoteste.com',
      password_hash: hash,
      must_change_password: true,
    });
    activeTenantId = tenant.id;
  });

  describe('POST /api/auth/login', () => {
    it('deve logar com credenciais corretas e retornar token JWT e dados do tenant', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'TESTE@odontoteste.com', password: validPass });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.tenant.id).toBe(activeTenantId);
      expect(res.body.tenant.must_change_password).toBe(true);
    });

    it('deve retornar 401 para credenciais incorretas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'teste@odontoteste.com', password: wrongPass });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Credenciais inválidas ou acesso não autorizado');
    });

    it('deve retornar 401 se e-mail ou senha forem omitidos', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(401);
    });

    it('deve aplicar rate limit e retornar 429 após 5 falhas consecutivas', async () => {
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'teste@odontoteste.com', password: wrongPass });
      }

      const resBlocked = await request(app)
        .post('/api/auth/login')
        .send({ email: 'teste@odontoteste.com', password: validPass });

      expect(resBlocked.status).toBe(429);
      expect(resBlocked.body.code).toBe('TOO_MANY_REQUESTS');
      expect(resBlocked.body.error).toContain('Muitas tentativas de login');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('deve alterar a senha com sucesso, limpar must_change_password e invalidar token antigo', async () => {
      const tokenAntigo = generateTestToken({ tenant_id: activeTenantId, tv: 0 });

      const resChange = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${tokenAntigo}`)
        .send({ current_password: validPass, new_password: newPass });

      expect(resChange.status).toBe(200);
      expect(resChange.body.token).toBeDefined();
      expect(resChange.body.message).toBe('Senha alterada com sucesso.');

      // O token antigo (tv=0) agora deve ser rejeitado com 401 em qualquer rota
      const resOldToken = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenAntigo}`);

      expect(resOldToken.status).toBe(401);
      expect(resOldToken.body.code).toBe('SESSION_REVOKED');

      // O novo token (tv=1) deve ser aceito
      const resNewToken = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${resChange.body.token}`);

      expect(resNewToken.status).toBe(200);
      expect(resNewToken.body.tenant.must_change_password).toBe(false);
    });

    it('deve retornar 401 se a senha atual informada for incorreta', async () => {
      const token = generateTestToken({ tenant_id: activeTenantId, tv: 0 });

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ current_password: wrongPass, new_password: newPass });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Senha atual incorreta');
    });

    it('deve retornar 400 se a nova senha violar a política de segurança', async () => {
      const token = generateTestToken({ tenant_id: activeTenantId, tv: 0 });

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ current_password: validPass, new_password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('mínimo 8 caracteres');
    });
  });

  describe('GET /api/auth/me', () => {
    it('deve retornar os dados cadastrais do consultório autenticado', async () => {
      const token = generateTestToken({ tenant_id: activeTenantId, tv: 0 });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.tenant.id).toBe(activeTenantId);
      expect(res.body.tenant.name).toBe('Clínica Odonto Teste');
      expect(res.body.tenant.must_change_password).toBe(true);
    });

    it('deve retornar 401 se a requisição não tiver token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('Rejeição de Cadastro Público (AC-118)', () => {
    const dummyPass = ['dummy', 'Pass', '123'].join('');

    it('POST /api/auth/register deve retornar 404 Not Found', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Nova Clínica', email: 'nova@clinica.com', password: dummyPass });

      expect(res.status).toBe(404);
    });

    it('POST /api/auth/signup deve retornar 404 Not Found', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Nova Clínica', email: 'nova@clinica.com', password: dummyPass });

      expect(res.status).toBe(404);
    });
  });

  describe('Proteção da Rota /api/analytics (AC-127)', () => {
    it('deve rejeitar acesso com 401 se enviado apenas o header x-tenant-id', async () => {
      const res = await request(app)
        .get('/api/analytics/no-show')
        .set('x-tenant-id', activeTenantId);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Token de autenticação não fornecido');
    });

    it('deve permitir acesso à rota de analytics quando fornecido token Bearer válido', async () => {
      // Usuário com must_change_password = false para não tomar 403
      await tenantRepo.updatePassword(activeTenantId, 'dummyHash', false);
      const token = generateTestToken({ tenant_id: activeTenantId, tv: 1 });

      const res = await request(app)
        .get('/api/analytics/no-show')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total_appointments');
    });
  });
});
