/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { CliniAssistLocalDB } from '../db/local-db.js';
import { SettingsView } from '../features/settings/components/SettingsView.js';
import { ClinicProfileCard } from '../features/settings/components/ClinicProfileCard.js';
import { AuthProvider } from '../features/auth/hooks/AuthContext.js';
import { AuthSessionLocalRepository } from '../db/repositories/auth-session-local-repository.js';
import type { AuthTenantProfile } from '@cliniassist/shared';

describe('Integração de Autenticação — Perfil e Logout em Ajustes', () => {
  let db: CliniAssistLocalDB;
  let repo: AuthSessionLocalRepository;

  const mockTenant: AuthTenantProfile = {
    id: 'tenant-clinica-1',
    name: 'Consultório Odonto Prime',
    email: 'prime@odonto.com',
    must_change_password: false,
    whatsapp_instance_name: null,
    whatsapp_connected: true,
  };

  beforeEach(async () => {
    db = new CliniAssistLocalDB(`test_integ_${Date.now()}_${Math.random()}`);
    await db.open();
    repo = new AuthSessionLocalRepository(db);
    vi.restoreAllMocks();
  });

  it('AC-164: Renderiza card de Perfil do Consultório no topo de Ajustes com botão Sair da Conta @spec:AC-164', () => {
    const onRequestLogout = vi.fn();

    render(
      <ClinicProfileCard
        tenantName="Consultório Odonto Prime"
        tenantEmail="prime@odonto.com"
        onRequestLogout={onRequestLogout}
      />
    );

    const profileCard = screen.getByTestId('clinic-profile-card');
    expect(profileCard).toBeInTheDocument();
    expect(screen.getByText('Consultório Odonto Prime')).toBeInTheDocument();
    expect(screen.getByText('prime@odonto.com')).toBeInTheDocument();

    const logoutBtn = screen.getByTestId('btn-request-logout');
    expect(logoutBtn).toBeInTheDocument();
    expect(logoutBtn.className).toContain('min-h-[44px]');

    fireEvent.click(logoutBtn);
    expect(onRequestLogout).toHaveBeenCalledTimes(1);
  });

  it('SettingsView integra o ClinicProfileCard quando os dados da sessão são fornecidos', () => {
    const onRequestLogout = vi.fn();

    render(
      <SettingsView
        tenantId={mockTenant.id}
        tenantName={mockTenant.name}
        tenantEmail={mockTenant.email}
        onRequestLogout={onRequestLogout}
      />
    );

    expect(screen.getByTestId('clinic-profile-card')).toBeInTheDocument();
    expect(screen.getByText('Consultório Odonto Prime')).toBeInTheDocument();

    const logoutBtn = screen.getByTestId('btn-request-logout');
    fireEvent.click(logoutBtn);
    expect(onRequestLogout).toHaveBeenCalledTimes(1);
  });
});
