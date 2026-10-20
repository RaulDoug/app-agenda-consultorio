import { describe, it, expect } from 'vitest';
import { validatePasswordPolicy } from '../domain/password-policy.js';

describe('Política de Senhas Compartilhada — US-093', () => {
  it('AC-162: Validação da política de senha (mínimo 8 caracteres, letra, número e diferente da atual) @spec:AC-162', () => {
    // 1. Senha muito curta (< 8 chars)
    const shortRes = validatePasswordPolicy('Abc1', 'SenhaAntiga123');
    expect(shortRes.isValid).toBe(false);
    expect(shortRes.error).toContain('mínimo 8 caracteres');

    // 2. Sem número
    const noNumberRes = validatePasswordPolicy('Abcdefghijk', 'SenhaAntiga123');
    expect(noNumberRes.isValid).toBe(false);
    expect(noNumberRes.error).toContain('número');

    // 3. Sem letra
    const noLetterRes = validatePasswordPolicy('1234567890', 'SenhaAntiga123');
    expect(noLetterRes.isValid).toBe(false);
    expect(noLetterRes.error).toContain('letra');

    // 4. Nova senha idêntica à atual
    const sameRes = validatePasswordPolicy('SenhaAntiga123', 'SenhaAntiga123');
    expect(sameRes.isValid).toBe(false);
    expect(sameRes.error).toContain('diferente da atual');

    // 5. Senha válida atendendo a todos os critérios
    const validRes = validatePasswordPolicy('NovaSenhaForte2026', 'SenhaAntiga123');
    expect(validRes.isValid).toBe(true);
    expect(validRes.error).toBeUndefined();
  });
});
