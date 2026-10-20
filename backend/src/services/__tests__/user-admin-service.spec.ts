import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryDatabase, type IDatabase } from '../../db/connection.js';
import { TenantRepository } from '../../repositories/tenant-repository.js';
import { UserAdminService, NotFoundError } from '../user-admin-service.js';
import { PasswordService } from '../password-service.js';
import { ValidationError } from '../auth-service.js';

describe('UserAdminService — Provisionamento e Recuperação de Credenciais (T-110)', () => {
  let db: IDatabase;
  let tenantRepo: TenantRepository;
  let adminService: UserAdminService;

  const validManualPass = ['Admin', 'Pass', '2026!'].join('');

  beforeEach(() => {
    db = createInMemoryDatabase();
    tenantRepo = new TenantRepository(db);
    adminService = new UserAdminService(tenantRepo);
  });

  describe('createUser', () => {
    it('deve provisionar usuário com senha temporária gerada automaticamente e flag must_change_password', async () => {
      const res = await adminService.createUser({
        name: 'Clínica Odonto Vida',
        email: '  vida@odontovida.com  ',
      });

      expect(res.tenant).toBeDefined();
      expect(res.tenant.name).toBe('Clínica Odonto Vida');
      expect(res.tenant.email).toBe('vida@odontovida.com');
      expect(res.tenant.must_change_password).toBe(true);
      expect(res.tenant.token_version).toBe(0);

      expect(res.temporaryPassword).toBeDefined();
      expect(res.temporaryPassword).toHaveLength(16);

      // Valida que a senha temporária gerada valida com o hash no banco
      const isMatch = await PasswordService.verifyPassword(
        res.temporaryPassword!,
        res.tenant.password_hash!
      );
      expect(isMatch).toBe(true);
    });

    it('deve provisionar usuário com senha manual válida sem exigir troca obrigatória', async () => {
      const res = await adminService.createUser({
        name: 'Consultório Dr. Pedro',
        email: 'pedro@consultorio.com',
        password: validManualPass,
      });

      expect(res.tenant.must_change_password).toBe(false);
      expect(res.temporaryPassword).toBeUndefined();

      const isMatch = await PasswordService.verifyPassword(
        validManualPass,
        res.tenant.password_hash!
      );
      expect(isMatch).toBe(true);
    });

    it('deve rejeitar e-mail duplicado independentemente de maiúsculas e espaços', async () => {
      await adminService.createUser({
        name: 'Primeira Clínica',
        email: 'duplicado@clinica.com',
      });

      await expect(
        adminService.createUser({
          name: 'Segunda Clínica',
          email: '  DUPLICADO@Clinica.com ',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('deve rejeitar formato de e-mail inválido ou nome muito curto', async () => {
      await expect(
        adminService.createUser({ name: 'A', email: 'email@valido.com' })
      ).rejects.toThrow(ValidationError);

      await expect(
        adminService.createUser({ name: 'Nome Válido', email: 'emailinvalido' })
      ).rejects.toThrow(ValidationError);
    });

    it('deve rejeitar senha manual que não atenda à política de senhas', async () => {
      await expect(
        adminService.createUser({
          name: 'Clínica Fraca',
          email: 'fraca@clinica.com',
          password: '123',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('resetPassword', () => {
    it('deve resetar a senha, gerar senha temporária, marcar must_change_password e incrementar token_version', async () => {
      const createRes = await adminService.createUser({
        name: 'Clínica Recupera',
        email: 'recupera@clinica.com',
        password: validManualPass,
      });
      expect(createRes.tenant.token_version).toBe(0);
      expect(createRes.tenant.must_change_password).toBe(false);

      const resetRes = await adminService.resetPassword(' RECUPERA@Clinica.com ');
      expect(resetRes.tenant.must_change_password).toBe(true);
      expect(resetRes.tenant.token_version).toBe(1); // Incrementou versão para derrubar sessões
      expect(resetRes.temporaryPassword).toBeDefined();
      expect(resetRes.temporaryPassword).toHaveLength(16);

      // Valida que a nova senha temporária bate com o novo hash
      const isMatch = await PasswordService.verifyPassword(
        resetRes.temporaryPassword,
        resetRes.tenant.password_hash!
      );
      expect(isMatch).toBe(true);

      // Valida que a senha antiga anterior NÃO bate mais
      const oldMatch = await PasswordService.verifyPassword(
        validManualPass,
        resetRes.tenant.password_hash!
      );
      expect(oldMatch).toBe(false);
    });

    it('deve lançar NotFoundError ao tentar resetar senha de e-mail inexistente', async () => {
      await expect(
        adminService.resetPassword('inexistente@clinica.com')
      ).rejects.toThrow(NotFoundError);
    });
  });
});
