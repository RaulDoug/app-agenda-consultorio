import { describe, it, expect } from 'vitest';
import { PasswordService } from '../password-service.js';

describe('PasswordService — Hashing, Comparação e Política de Senhas (T-107)', () => {
  const samplePwd = ['Minha', 'Senha', '99'].join('');
  const wrongPwd = ['Outra', 'Coisa', '00'].join('');

  describe('hashPassword', () => {
    it('deve gerar um hash bcrypt válido com salt rounds padrão', async () => {
      const hash = await PasswordService.hashPassword(samplePwd);
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[ab]\$10\$/);
    });

    it('deve gerar hashes distintos para a mesma senha devido ao salt randômico', async () => {
      const hash1 = await PasswordService.hashPassword(samplePwd);
      const hash2 = await PasswordService.hashPassword(samplePwd);
      expect(hash1).not.toBe(hash2);
    });

    it('deve lançar erro se a senha for vazia', async () => {
      await expect(PasswordService.hashPassword('')).rejects.toThrow();
    });
  });

  describe('verifyPassword', () => {
    it('deve retornar true quando a senha corresponder ao hash', async () => {
      const hash = await PasswordService.hashPassword(samplePwd);
      const isValid = await PasswordService.verifyPassword(samplePwd, hash);
      expect(isValid).toBe(true);
    });

    it('deve retornar false quando a senha estiver incorreta', async () => {
      const hash = await PasswordService.hashPassword(samplePwd);
      const isValid = await PasswordService.verifyPassword(wrongPwd, hash);
      expect(isValid).toBe(false);
    });

    it('deve retornar false se o hash for passado como senha (prevenção de login com hash vazado)', async () => {
      const hash = await PasswordService.hashPassword(samplePwd);
      const isValid = await PasswordService.verifyPassword(hash, hash);
      expect(isValid).toBe(false);
    });

    it('deve retornar false para entradas nulas ou vazias', async () => {
      const isValid1 = await PasswordService.verifyPassword('', 'somehash');
      const isValid2 = await PasswordService.verifyPassword(samplePwd, '');
      expect(isValid1).toBe(false);
      expect(isValid2).toBe(false);
    });
  });

  describe('validatePasswordPolicy', () => {
    it('deve aprovar senha válida com mais de 8 caracteres contendo letras e números', () => {
      const res = PasswordService.validatePasswordPolicy(['Valida', '2026'].join(''));
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('deve rejeitar senha com menos de 8 caracteres', () => {
      const res = PasswordService.validatePasswordPolicy(['Ab1', 'c'].join(''));
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('mínimo 8 caracteres');
    });

    it('deve rejeitar senha sem letras', () => {
      const res = PasswordService.validatePasswordPolicy('1234567890');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('pelo menos uma letra');
    });

    it('deve rejeitar senha sem números', () => {
      const res = PasswordService.validatePasswordPolicy('abcdefghijk');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('pelo menos um número');
    });

    it('deve rejeitar se a nova senha for idêntica à senha atual', () => {
      const current = ['Senha', 'Antiga', '1'].join('');
      const res = PasswordService.validatePasswordPolicy(current, current);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('diferente da senha atual');
    });
  });

  describe('generateTemporaryPassword', () => {
    it('deve gerar senha temporária de 16 caracteres por padrão que atenda à política', () => {
      const tempPass = PasswordService.generateTemporaryPassword();
      expect(tempPass).toHaveLength(16);

      const policyRes = PasswordService.validatePasswordPolicy(tempPass);
      expect(policyRes.isValid).toBe(true);
    });

    it('deve gerar senhas temporárias com alta entropia (diferentes em cada chamada)', () => {
      const p1 = PasswordService.generateTemporaryPassword();
      const p2 = PasswordService.generateTemporaryPassword();
      expect(p1).not.toBe(p2);
    });

    it('deve permitir comprimento customizado', () => {
      const tempPass = PasswordService.generateTemporaryPassword(20);
      expect(tempPass).toHaveLength(20);
    });

    it('deve rejeitar comprimento menor que 8', () => {
      expect(() => PasswordService.generateTemporaryPassword(6)).toThrow();
    });
  });
});
