import bcrypt from 'bcrypt';
import crypto from 'crypto';

export const BCRYPT_SALT_ROUNDS = 10;

export class PasswordService {
  /**
   * Gera o hash da senha utilizando bcrypt com 10 salt rounds.
   */
  static async hashPassword(password: string): Promise<string> {
    if (!password) {
      throw new Error('A senha não pode ser vazia para geração de hash.');
    }
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  /**
   * Versão síncrona do hash com bcrypt para compatibilidade em seeds e fixtures de teste.
   */
  static hashSync(password: string): string {
    if (!password) {
      throw new Error('A senha não pode ser vazia para geração de hash.');
    }
    return bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS);
  }

  /**
   * Verifica se a senha em texto puro corresponde ao hash bcrypt armazenado.
   * Não aceita senhas em texto puro iguais ao próprio hash (prevenção contra vazamento de hash).
   */
  static async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    if (!password || !storedHash) {
      return false;
    }
    try {
      return await bcrypt.compare(password, storedHash);
    } catch {
      return false;
    }
  }

  /**
   * Valida se a senha informada atende à política mínima de segurança:
   * - Mínimo de 8 caracteres
   * - Pelo menos uma letra
   * - Pelo menos um número
   * - Diferente da senha atual (se fornecida)
   */
  static validatePasswordPolicy(
    newPassword: string,
    currentPassword?: string
  ): { isValid: boolean; error?: string } {
    if (!newPassword || typeof newPassword !== 'string') {
      return { isValid: false, error: 'A nova senha é obrigatória.' };
    }

    if (newPassword.length < 8) {
      return { isValid: false, error: 'A senha deve conter no mínimo 8 caracteres.' };
    }

    if (!/[a-zA-Z]/.test(newPassword)) {
      return { isValid: false, error: 'A senha deve conter pelo menos uma letra.' };
    }

    if (!/[0-9]/.test(newPassword)) {
      return { isValid: false, error: 'A senha deve conter pelo menos um número.' };
    }

    if (currentPassword && newPassword === currentPassword) {
      return { isValid: false, error: 'A nova senha deve ser diferente da senha atual.' };
    }

    return { isValid: true };
  }

  /**
   * Gera uma senha temporária segura de alta entropia.
   * Utiliza crypto.randomInt e conjunto de caracteres sem ambiguidades (ex.: 0/O, 1/l/I).
   */
  static generateTemporaryPassword(length = 16): string {
    const lettersLower = 'abcdefghijkmnpqrstuvwxyz';
    const lettersUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const digits = '23456789';
    const allChars = lettersLower + lettersUpper + digits;

    if (length < 8) {
      throw new Error('O comprimento da senha temporária deve ser de no mínimo 8 caracteres.');
    }

    // Garante ao menos um caractere de cada grupo
    const guaranteed = [
      lettersLower[crypto.randomInt(lettersLower.length)],
      lettersUpper[crypto.randomInt(lettersUpper.length)],
      digits[crypto.randomInt(digits.length)],
    ];

    const remainingLength = length - guaranteed.length;
    const remaining: string[] = [];

    for (let i = 0; i < remainingLength; i++) {
      const idx = crypto.randomInt(allChars.length);
      remaining.push(allChars[idx]);
    }

    // Embaralha com algoritmo Fisher-Yates usando randomInt
    const combined = [...guaranteed, ...remaining];
    for (let i = combined.length - 1; i > 0; i--) {
      const j = crypto.randomInt(i + 1);
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    return combined.join('');
  }
}
