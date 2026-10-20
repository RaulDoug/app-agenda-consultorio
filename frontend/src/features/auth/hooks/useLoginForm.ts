import { useState, useCallback, useEffect } from 'react';
import { AuthApiError, NetworkError } from '../../../services/auth-api.js';

export interface UseLoginFormOptions {
  onLogin: (email: string, password: string) => Promise<void>;
  initialEmail?: string | null;
}

export function useLoginForm({ onLogin, initialEmail = '' }: UseLoginFormOptions) {
  const [email, setEmail] = useState<string>(initialEmail || '');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOfflineError, setIsOfflineError] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // Atualiza se o initialEmail mudar
  useEffect(() => {
    if (initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [initialEmail, email]);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const validate = useCallback((): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email || !email.trim()) {
      errors.email = 'E-mail é obrigatório.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Informe um endereço de e-mail válido.';
    }

    if (!password) {
      errors['password'] = 'A senha é obrigatória.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [email, password]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    setErrorMessage(null);
    setIsOfflineError(false);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      if (err instanceof NetworkError) {
        setIsOfflineError(true);
        setErrorMessage(err.message);
      } else if (err instanceof AuthApiError) {
        setErrorMessage(err.message);
        if (err.statusCode === 401) {
          // Mantém e-mail e zera senha
          setPassword('');
        }
      } else {
        setErrorMessage(err?.message || 'Ocorreu um erro ao entrar. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, onLogin, validate]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    isSubmitting,
    errorMessage,
    isOfflineError,
    fieldErrors,
    handleSubmit,
  };
}
