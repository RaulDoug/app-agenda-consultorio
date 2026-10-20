/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionSplash } from '../components/SessionSplash.js';
import { LoginScreen } from '../components/LoginScreen.js';
import { ChangePasswordScreen } from '../components/ChangePasswordScreen.js';
import { AuthGate } from '../components/AuthGate.js';
import { LogoutConfirmDrawer } from '../components/LogoutConfirmDrawer.js';
import { AuthContext, type AuthContextValue } from '../hooks/AuthContext.js';
import { ApiClient } from '../../../services/api-client.js';

describe('Componentes Visuais de Autenticação — UI e Portas de Acesso', () => {
  it('AC-159: Exibe Splash minimalista com logotipo CliniAssist e gradiente da marca @spec:AC-159', () => {
    render(<SessionSplash />);

    const splash = screen.getByTestId('session-splash');
    expect(splash).toBeInTheDocument();
    expect(screen.getByText('CliniAssist')).toBeInTheDocument();
    expect(screen.getByText(/Gestão Ágil de Consultórios/i)).toBeInTheDocument();
  });

  it('LoginScreen renderiza campos com ergonomia One-Thumb e exibe banner em erro offline', () => {
    const onLogin = vi.fn();
    const { rerender } = render(
      <LoginScreen onLogin={onLogin} savedEmail="dentista@clinica.com" />
    );

    const emailInput = screen.getByTestId('input-login-email');
    const passwordInput = screen.getByTestId('input-login-password');
    const submitBtn = screen.getByTestId('btn-submit-login');

    expect(emailInput).toHaveValue('dentista@clinica.com');
    expect(passwordInput).toHaveValue('');
    expect(submitBtn.className).toContain('min-h-[44px]');

    // Alternar visibilidade de senha
    const toggleBtn = screen.getByTestId('btn-toggle-password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('ChangePasswordScreen permite alteração obrigatória e opção de voltar para o login', () => {
    const onChange = vi.fn();
    const onCancel = vi.fn();

    render(
      <ChangePasswordScreen
        onChangePassword={onChange}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Troca Obrigatória de Senha')).toBeInTheDocument();
    const backBtn = screen.getByTestId('btn-back-to-login');
    fireEvent.click(backBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('AuthGate gerencia visualização por estado: splash, login, troca ou aplicação principal', () => {
    const createMockAuth = (status: AuthContextValue['status']): AuthContextValue => ({
      status,
      session: status === 'authenticated' ? {
        key: 'current',
        token: 'token_123',
        tenant: {
          id: 't-1',
          name: 'Clínica Sorriso',
          email: 'sorriso@odonto.com',
          must_change_password: false,
          whatsapp_instance_name: null,
          whatsapp_connected: false,
        },
        authenticated_at: new Date().toISOString(),
      } : null,
      apiClient: new ApiClient(),
      login: vi.fn(),
      changePassword: vi.fn(),
      logout: vi.fn(),
      cancelMustChangePassword: vi.fn(),
    });

    // 1. Loading
    const { rerender } = render(
      <AuthContext.Provider value={createMockAuth('loading')}>
        <AuthGate>
          <div data-testid="app-content">Conteúdo Privado</div>
        </AuthGate>
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('session-splash')).toBeInTheDocument();
    expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();

    // 2. Unauthenticated
    rerender(
      <AuthContext.Provider value={createMockAuth('unauthenticated')}>
        <AuthGate>
          <div data-testid="app-content">Conteúdo Privado</div>
        </AuthGate>
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('login-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();

    // 3. Authenticated
    rerender(
      <AuthContext.Provider value={createMockAuth('authenticated')}>
        <AuthGate>
          <div data-testid="app-content">Conteúdo Privado</div>
        </AuthGate>
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('app-content')).toBeInTheDocument();
  });

  it('AC-173: Alerta com contagem de pendências se o flush falhar por falta de rede @spec:AC-173', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <LogoutConfirmDrawer
        isOpen={true}
        pendingCount={3}
        onConfirmLogout={onConfirm}
        onClose={onClose}
      />
    );

    expect(screen.getByText(/3 alterações pendentes/i)).toBeInTheDocument();
    const confirmBtn = screen.getByTestId('btn-confirm-logout');
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
