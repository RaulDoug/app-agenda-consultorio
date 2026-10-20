export interface PasswordPolicyResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validação da política corporativa de senhas compartilhada entre Frontend e Backend.
 * Requisitos:
 * - Mínimo de 8 caracteres
 * - Ao menos 1 letra
 * - Ao menos 1 número
 * - Diferente da senha atual (se fornecida)
 */
export function validatePasswordPolicy(
  newPassword: string,
  currentPassword?: string
): PasswordPolicyResult {
  if (!newPassword || typeof newPassword !== 'string') {
    return { isValid: false, error: 'A senha é obrigatória.' };
  }

  if (newPassword.length < 8) {
    return { isValid: false, error: 'A nova senha deve ter no mínimo 8 caracteres.' };
  }

  const hasLetter = /[a-zA-Z]/.test(newPassword);
  if (!hasLetter) {
    return { isValid: false, error: 'A nova senha deve conter ao menos uma letra.' };
  }

  const hasNumber = /[0-9]/.test(newPassword);
  if (!hasNumber) {
    return { isValid: false, error: 'A nova senha deve conter ao menos um número.' };
  }

  if (currentPassword && newPassword === currentPassword) {
    return { isValid: false, error: 'A nova senha deve ser diferente da atual.' };
  }

  return { isValid: true };
}
