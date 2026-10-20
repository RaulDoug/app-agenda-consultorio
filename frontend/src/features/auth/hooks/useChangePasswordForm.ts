import { useState, useCallback } from 'react';
import { validatePasswordPolicy } from '@cliniassist/shared';
import { AuthApiError, NetworkError } from '../../../services/auth-api.js';

export interface UseChangePasswordFormOptions {
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export function useChangePasswordForm({ onChangePassword }: UseChangePasswordFormOptions) {
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const toggleShowPasswords = useCallback(() => {
    setShowPasswords((prev) => !prev);
  }, []);

  const validate = useCallback((): boolean => {
    const errors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!currentPassword) {
      errors.currentPassword = 'A senha atual é obrigatória.';
    }

    const policyRes = validatePasswordPolicy(newPassword, currentPassword);
    if (!policyRes.isValid) {
      errors.newPassword = policyRes.error;
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentPassword, newPassword, confirmPassword]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onChangePassword(currentPassword, newPassword);
    } catch (err: any) {
      if (err instanceof AuthApiError || err instanceof NetworkError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err?.message || 'Falha ao alterar senha. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [currentPassword, newPassword, validate, onChangePassword]);

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPasswords,
    toggleShowPasswords,
    isSubmitting,
    errorMessage,
    fieldErrors,
    handleSubmit,
  };
}
