import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryDatabase, type IDatabase } from '../../db/connection.js';
import { TenantRepository } from '../../repositories/tenant-repository.js';
import { AuthService, verifyToken, UnauthorizedError, ValidationError } from '../auth-service.js';
import { PasswordService } from '../password-service.js';

describe('AuthService — Regras de Negócio de Autenticação e Sessão (T-109)', () => {
  let db: IDatabase;
  let tenantRepo: TenantRepository;
  let authService: AuthService;

  const initialPass = ['Senha', 'Inicial', '1'].join('');
  const newPass = ['Nova', 'Senha', '2026'].join('');
  const wrongPass = ['Errada', 'Total', '9'].join('');

  beforeEach(async () => {
    db = createInMemoryDatabase();
    tenantRepo = new TenantRepository(db);
    authService = new AuthService(tenantRepo);
  });

  describe('login', () => {
    it('deve realizar login com sucesso, gerando JWT com token_version e dados do consultório', async () => {
      const hash = await PasswordService.hashPassword(initialPass);
      const tenant = await tenantRepo.create({
        name: 'Clínica Sorriso Aberto',
        email: 'sorriso@clinica.com',
        password_hash: hash,
        must_change_password: true,
      });

      const res = await authService.login('SORRISO@CLINICA.COM', initialPass);
      expect(res).toBeDefined();
      expect(res.token).toBeDefined();
      expect(res.tenant.id).toBe(tenant.id);
      expect(res.tenant.email).toBe('sorriso@clinica.com');
      expect(res.tenant.must_change_password).toBe(true);

      const payload = verifyToken(res.token);
      expect(payload).not.toBeNull();
      expect(payload?.tenant_id).toBe(tenant.id);
      expect(payload?.tv).toBe(0);
    });

    it('deve rejeitar e-mail inexistente com mensagem genérica de não autorizado', async () => {
      await expect(
        authService.login('fantasma@clinica.com', initialPass)
      ).rejects.toThrow(UnauthorizedError);
    });

    it('deve rejeitar senha incorreta com mensagem genérica de não autorizado', async () => {
      const hash = await PasswordService.hashPassword(initialPass);
      await tenantRepo.create({
        name: 'Clínica Beta',
        email: 'beta@clinica.com',
        password_hash: hash,
      });

      await expect(
        authService.login('beta@clinica.com', wrongPass)
      ).rejects.toThrow(UnauthorizedError);
    });

    it('deve rejeitar login de consultório inativo', async () => {
      const hash = await PasswordService.hashPassword(initialPass);
      const tenant = await tenantRepo.create({
        name: 'Clínica Desativada',
        email: 'inativa@clinica.com',
        password_hash: hash,
      });

      await db.query('UPDATE tenants SET is_active = false WHERE id = $1', [tenant.id]);

      await expect(
        authService.login('inativa@clinica.com', initialPass)
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('changePassword', () => {
    it('deve alterar a senha com sucesso, limpar must_change_password e emitir novo token com tv incrementado', async () => {
      const hash = await PasswordService.hashPassword(initialPass);
      const tenant = await tenantRepo.create({
        name: 'Clínica Gamma',
        email: 'gamma@clinica.com',
        password_hash: hash,
        must_change_password: true,
      });

      const result = await authService.changePassword(tenant.id, initialPass, newPass);
      expect(result.token).toBeDefined();
      expect(result.message).toBe('Senha alterada com sucesso.');

      // Valida que o token emitido traz tv = 1
      const payload = verifyToken(result.token);
      expect(payload?.tv).toBe(1);

      // Valida no banco se o hash mudou e a flag foi limpa
      const updatedInDb = await tenantRepo.findById(tenant.id);
      expect(updatedInDb?.token_version).toBe(1);
      expect(updatedInDb?.must_change_password).toBe(false);

      // Valida que o login com a nova senha funciona
      const loginRes = await authService.login('gamma@clinica.com', newPass);
      expect(loginRes.token).toBeDefined();

      // Valida que o login com a senha antiga falha
      await expect(
        authService.login('gamma@clinica.com', initialPass)
      ).rejects.toThrow(UnauthorizedError);
    });

    it('deve rejeitar alteração se a senha atual informada estiver incorreta', async () => {
      const hash = await PasswordService.hashPassword(initialPass);
      const tenant = await tenantRepo.create({
        name: 'Clínica Delta',
        email: 'delta@clinica.com',
        password_hash: hash,
      });

      await expect(
        authService.changePassword(tenant.id, wrongPass, newPass)
      ).rejects.toThrow(UnauthorizedError);
    });

    it('deve rejeitar se a nova senha violar a política de segurança', async () => {
      const hash = await PasswordService.hashPassword(initialPass);
      const tenant = await tenantRepo.create({
        name: 'Clínica Epsilon',
        email: 'epsilon@clinica.com',
        password_hash: hash,
      });

      // Senha curta
      await expect(
        authService.changePassword(tenant.id, initialPass, 'Curta1')
      ).rejects.toThrow(ValidationError);

      // Nova senha igual à atual
      await expect(
        authService.changePassword(tenant.id, initialPass, initialPass)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getProfile', () => {
    it('deve retornar dados públicos do perfil do consultório autenticado', async () => {
      const hash = await PasswordService.hashPassword(initialPass);
      const tenant = await tenantRepo.create({
        name: 'Clínica Zeta',
        email: 'zeta@clinica.com',
        password_hash: hash,
        must_change_password: true,
      });

      const profile = await authService.getProfile(tenant.id);
      expect(profile.id).toBe(tenant.id);
      expect(profile.name).toBe('Clínica Zeta');
      expect(profile.email).toBe('zeta@clinica.com');
      expect(profile.must_change_password).toBe(true);
    });
  });
});
