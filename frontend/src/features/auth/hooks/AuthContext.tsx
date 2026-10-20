import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { LocalAuthSession } from '../../../db/types.js';
import type { AuthTenantProfile } from '@cliniassist/shared';
import { AuthSessionLocalRepository } from '../../../db/repositories/auth-session-local-repository.js';
import { authApiService, type AuthApiService } from '../../../services/auth-api.js';
import { ApiClient } from '../../../services/api-client.js';
import { SyncManager } from '../../../sync/sync-manager.js';

export type AuthStatus = 'loading' | 'unauthenticated' | 'must_change_password' | 'authenticated';

export interface AuthContextValue {
  status: AuthStatus;
  session: LocalAuthSession | null;
  apiClient: ApiClient;
  login: (email: string, password: string) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  logout: () => Promise<void>;
  cancelMustChangePassword: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  repo?: AuthSessionLocalRepository;
  authApi?: AuthApiService;
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  repo: customRepo,
  authApi = authApiService,
  children,
}) => {
  const repo = useMemo(() => customRepo || new AuthSessionLocalRepository(), [customRepo]);

  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<LocalAuthSession | null>(null);

  // ApiClient instanciado para o contexto
  const apiClient = useMemo(() => {
    return new ApiClient({
      getToken: () => session?.token,
      onSessionExpired: async () => {
        await repo.clearSession();
        setSession(null);
        setStatus('unauthenticated');
      },
      onPasswordChangeRequired: () => {
        setStatus('must_change_password');
      },
    });
  }, [repo, session?.token]);

  // Checagem inicial de sessão local (Local-First instantâneo)
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const localSession = await repo.getSession();
        if (!isMounted) return;

        if (!localSession) {
          setSession(null);
          setStatus('unauthenticated');
          return;
        }

        setSession(localSession);

        if (localSession.tenant.must_change_password) {
          setStatus('must_change_password');
        } else {
          setStatus('authenticated');

          // Revalidação leve em segundo plano (background)
          authApi
            .getProfile(localSession.token)
            .then(async (updatedTenant) => {
              if (!isMounted) return;
              await repo.updateTenant(updatedTenant);
              setSession((prev) => (prev ? { ...prev, tenant: updatedTenant } : null));
              if (updatedTenant.must_change_password) {
                setStatus('must_change_password');
              }
            })
            .catch(async (err) => {
              if (!isMounted) return;
              // Se foi 401/revogado, desloga gracioso
              if (err?.statusCode === 401 || err?.code === 'SESSION_REVOKED') {
                await repo.clearSession();
                setSession(null);
                setStatus('unauthenticated');
              }
            });
        }
      } catch {
        if (isMounted) {
          setStatus('unauthenticated');
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, [repo, authApi]);

  /**
   * Executa login, trata alternância de consultórios e atualiza estado.
   */
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const response = await authApi.login(email, password);

      // Se houver sessão anterior e o tenant ID for diferente, limpa dados locais (isolamento multi-tenant)
      const current = await repo.getSession();
      if (current && current.tenant.id !== response.tenant.id) {
        await repo.clearAllData();
      }

      await repo.saveSession(response.token, response.tenant);
      const newSession: LocalAuthSession = {
        key: 'current',
        token: response.token,
        tenant: response.tenant,
        authenticated_at: new Date().toISOString(),
      };

      setSession(newSession);

      if (response.tenant.must_change_password) {
        setStatus('must_change_password');
      } else {
        setStatus('authenticated');
      }
    },
    [authApi, repo]
  );

  /**
   * Executa a troca obrigatória de senha e atualiza o token da sessão.
   */
  const changePassword = useCallback(
    async (current: string, next: string): Promise<void> => {
      if (!session) {
        throw new Error('Nenhuma sessão ativa para alteração de senha.');
      }

      const res = await authApi.changePassword(current, next, session.token);

      const updatedTenant: AuthTenantProfile = {
        ...session.tenant,
        must_change_password: false,
      };

      await repo.saveSession(res.token, updatedTenant);

      setSession({
        ...session,
        token: res.token,
        tenant: updatedTenant,
      });

      setStatus('authenticated');
    },
    [authApi, repo, session]
  );

  /**
   * Cancela o fluxo de troca de senha obrigatória e retorna para o login.
   */
  const cancelMustChangePassword = useCallback(async (): Promise<void> => {
    await repo.clearSession();
    setSession(null);
    setStatus('unauthenticated');
  }, [repo]);

  /**
   * Realiza logout total da conta e limpa os dados locais.
   * Tenta flush prévio da sync_outbox se houver sessão ativa.
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      if (session?.token && session?.tenant?.id) {
        const syncMgr = new SyncManager({
          tenantId: session.tenant.id,
          token: session.token,
          db: repo.database,
        });
        await syncMgr.push();
      }
    } catch {
      // Ignora falha de rede para permitir logout offline
    }

    await repo.clearAllData();
    setSession(null);
    setStatus('unauthenticated');
  }, [repo, session]);

  const value: AuthContextValue = useMemo(
    () => ({
      status,
      session,
      apiClient,
      login,
      changePassword,
      logout,
      cancelMustChangePassword,
    }),
    [status, session, apiClient, login, changePassword, logout, cancelMustChangePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
