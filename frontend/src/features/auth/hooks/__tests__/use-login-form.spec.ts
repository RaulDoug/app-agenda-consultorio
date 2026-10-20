/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoginForm } from '../useLoginForm.js';
import { useChangePasswordForm } from '../useChangePasswordForm.js';
import { AuthApiError, NetworkError } from '../../../../services/auth-api.js';

describe('useLoginForm & useChangePasswordForm — Validações e Estado de Formulário', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('useLoginForm', () => {
    it('AC-156: Alterna visibilidade da senha entre texto e password @spec:AC-156', () => {
      const mockLogin = vi.fn();
      const { result } = renderHook(() =>
        useLoginForm({
          onLogin: mockLogin,
          initialEmail: 'dentista@odonto.com',
        })
      );

      expect(result.current.showPassword).toBe(false);

      act(() => {
        result.current.toggleShowPassword();
      });
      expect(result.current.showPassword).toBe(true);

      act(() => {
        result.current.toggleShowPassword();
      });
      expect(result.current.showPassword).toBe(false);
    });

    it('Carrega e-mail inicial pré-preenchido e valida campos obrigatórios sem chamar login', async () => {
      const mockLogin = vi.fn();
      const { result } = renderHook(() =>
        useLoginForm({
          onLogin: mockLogin,
          initialEmail: 'dentista@odonto.com',
        })
      );

      expect(result.current.email).toBe('dentista@odonto.com');
      expect(result.current.password).toBe('');

      // Submete sem preencher senha
      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.fieldErrors.password).toContain('obrigatória');
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('Previne duplo clique desabilitando com isSubmitting durante envio', async () => {
      let resolveLogin: () => void = () => {};
      const pendingPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });

      const mockLogin = vi.fn().mockReturnValue(pendingPromise);

      const { result } = renderHook(() =>
        useLoginForm({
          onLogin: mockLogin,
          initialEmail: 'dentista@odonto.com',
        })
      );

      act(() => {
        result.current.setPassword('Senha1234');
      });

      let submitPromise: Promise<void>;
      act(() => {
        submitPromise = result.current.handleSubmit();
      });

      expect(result.current.isSubmitting).toBe(true);

      await act(async () => {
        resolveLogin();
        await submitPromise;
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it('Limpa campo de senha ao receber erro 401 e preserva o e-mail digitado', async () => {
      const mockLogin = vi.fn().mockRejectedValue(
        new AuthApiError('Credenciais inválidas ou acesso não autorizado.', 401, 'UNAUTHORIZED')
      );

      const { result } = renderHook(() =>
        useLoginForm({
          onLogin: mockLogin,
          initialEmail: 'dentista@odonto.com',
        })
      );

      act(() => {
        result.current.setPassword('SenhaErrada1');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errorMessage).toBe('Credenciais inválidas ou acesso não autorizado.');
      expect(result.current.email).toBe('dentista@odonto.com');
      expect(result.current.password).toBe('');
    });

    it('Captura falha de rede e ativa flag isOfflineError com mensagem amigável', async () => {
      const mockLogin = vi.fn().mockRejectedValue(
        new NetworkError('Sem conexão com a internet. Verifique sua rede para entrar pela primeira vez.')
      );

      const { result } = renderHook(() =>
        useLoginForm({
          onLogin: mockLogin,
          initialEmail: 'dentista@odonto.com',
        })
      );

      act(() => {
        result.current.setPassword('Senha1234');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.isOfflineError).toBe(true);
      expect(result.current.errorMessage).toContain('Sem conexão');
    });
  });

  describe('useChangePasswordForm', () => {
    it('Valida confirmação de senha divergente antes de enviar', async () => {
      const mockChange = vi.fn();
      const { result } = renderHook(() =>
        useChangePasswordForm({
          onChangePassword: mockChange,
        })
      );

      act(() => {
        result.current.setCurrentPassword('SenhaAtual123');
        result.current.setNewPassword('NovaSenhaValida2026');
        result.current.setConfirmPassword('OutraSenha123');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.fieldErrors.confirmPassword).toContain('não coincidem');
      expect(mockChange).not.toHaveBeenCalled();
    });

    it('Submete com sucesso quando todos os critérios de senha são satisfeitos', async () => {
      const mockChange = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useChangePasswordForm({
          onChangePassword: mockChange,
        })
      );

      act(() => {
        result.current.setCurrentPassword('SenhaAtual123');
        result.current.setNewPassword('NovaSenhaValida2026');
        result.current.setConfirmPassword('NovaSenhaValida2026');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockChange).toHaveBeenCalledWith('SenhaAtual123', 'NovaSenhaValida2026');
      expect(result.current.errorMessage).toBeNull();
    });
  });
});
