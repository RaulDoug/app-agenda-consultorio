/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { CliniAssistLocalDB } from '../../../../db/local-db.js';
import { AuthSessionLocalRepository } from '../../../../db/repositories/auth-session-local-repository.js';
import { AuthProvider } from '../AuthContext.js';
import { useAuth } from '../useAuth.js';
import type { AuthTenantProfile } from '@cliniassist/shared';
import type { AuthApiService } from '../../../../services/auth-api.js';

describe('AuthProvider & useAuth — Gerenciamento do Ciclo de Vida da Sessão', () => {
  let db: CliniAssistLocalDB;
  let repo: AuthSessionLocalRepository;
  let mockAuthApi: Partial<AuthApiService>;

  const mockTenant: AuthTenantProfile = {
    id: 'tenant-1',
    name: 'Consultório Dr. Silva',
    email: 'silva@odonto.com',
    must_change_password: false,
    whatsapp_instance_name: null,
    whatsapp_connected: false,
  };

  beforeEach(async () => {
    db = new CliniAssistLocalDB(`test_ctx_${Date.now()}_${Math.random()}`);
    await db.open();
    repo = new AuthSessionLocalRepository(db);

    mockAuthApi = {
      login: vi.fn(),
      changePassword: vi.fn(),
      getProfile: vi.fn().mockResolvedValue(mockTenant),
    };
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <AuthProvider repo={repo} authApi={mockAuthApi as AuthApiService}>
        {children}
      </AuthProvider>
    );
  };

  it('AC-151: Inicia em status unauthenticated se não houver sessão no Dexie @spec:AC-151', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });
    expect(result.current.session).toBeNull();
  });

  it('AC-158: Carrega diretamente como authenticated se houver sessão prévia no Dexie @spec:AC-158', async () => {
    await repo.saveSession('token_salvo_123', mockTenant);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });
    expect(result.current.session?.token).toBe('token_salvo_123');
    expect(result.current.session?.tenant.name).toBe('Consultório Dr. Silva');
  });

  it('AC-161: Transiciona para must_change_password se o consultório tiver troca pendente @spec:AC-161', async () => {
    const tenantMustChange: AuthTenantProfile = {
      ...mockTenant,
      must_change_password: true,
    };
    await repo.saveSession('token_temp', tenantMustChange);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe('must_change_password');
    });
  });

  it('AC-160: Revalida perfil em segundo plano e encerra sessão caso o backend retorne 401 @spec:AC-160', async () => {
    await repo.saveSession('token_expirado', mockTenant);
    mockAuthApi.getProfile = vi.fn().mockRejectedValue({
      statusCode: 401,
      message: 'Sessão expirada.',
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });
    expect(result.current.session).toBeNull();
  });

  it('AC-165: Logout encerra a sessão e limpa todas as tabelas locais do consultório @spec:AC-165', async () => {
    await repo.saveSession('token_valido', mockTenant);
    await db.patients.add({
      id: 'p-1',
      tenant_id: mockTenant.id,
      name: 'Paciente Teste',
      whatsapp: '11999999999',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.session).toBeNull();
    expect(await db.patients.count()).toBe(0);
  });

  it('AC-172: Flush automático da fila outbox antes de efetuar logout @spec:AC-172', async () => {
    await repo.saveSession('token_com_flush', mockTenant);

    // Insere mutação pendente na outbox
    await db.sync_outbox.add({
      id: 'mut-flush-1',
      client_mutation_id: 'cmd-flush-1',
      entity: 'appointments',
      record_id: 'app-flush-1',
      operation: 'INSERT',
      payload: { id: 'app-flush-1', notes: 'Antes do logout' },
      status: 'PENDING',
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/sync/batch')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, applied: 1 }),
        });
      }
      return Promise.reject(new Error('URL inesperada'));
    });
    vi.stubGlobal('fetch', mockFetch);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    // Ao chamar logout(), deve tentar disparar push para o backend
    await act(async () => {
      await result.current.logout();
    });

    expect(mockFetch).toHaveBeenCalled();
    const batchCall = mockFetch.mock.calls.find(([url]: [string]) => url.includes('/api/sync/batch'));
    expect(batchCall).toBeDefined();

    // Após logout, o banco foi limpo
    expect(result.current.status).toBe('unauthenticated');
    expect(await db.sync_outbox.count()).toBe(0);
  });
});
