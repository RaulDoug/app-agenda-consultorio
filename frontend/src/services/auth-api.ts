import type {
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  MeResponse,
  AuthTenantProfile,
  AuthErrorCode,
} from '@cliniassist/shared';

export class AuthApiError extends Error {
  statusCode: number;
  code?: AuthErrorCode;
  retryAfterMinutes?: number;

  constructor(message: string, statusCode = 400, code?: AuthErrorCode, retryAfterMinutes?: number) {
    super(message);
    this.name = 'AuthApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.retryAfterMinutes = retryAfterMinutes;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Sem conexão com a internet. Verifique sua rede e tente novamente.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthApiService {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  private handleError(err: any): never {
    if (err instanceof AuthApiError || err instanceof NetworkError) {
      throw err;
    }

    if (err instanceof TypeError || (err && err.message && err.message.includes('fetch'))) {
      throw new NetworkError('Sem conexão com a internet. Verifique sua rede para entrar pela primeira vez.');
    }

    throw new AuthApiError(err?.message || 'Erro inesperado ao comunicar com o servidor.');
  }

  /**
   * Realiza login autenticando e-mail e senha no backend.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const normalizedEmail = (email || '').trim().toLowerCase();

    try {
      const payload: LoginRequest = {
        email: normalizedEmail,
        password,
      };

      const res = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errData: any = {};
        try {
          errData = await res.json();
        } catch {
          // Fallback se corpo não for JSON
        }

        if (res.status === 429) {
          throw new AuthApiError(
            errData.error || 'Muitas tentativas de login incorretas. Tente novamente em 15 minutos.',
            429,
            'TOO_MANY_REQUESTS',
            errData.retryAfterMinutes || 15
          );
        }

        if (res.status === 401) {
          throw new AuthApiError(
            errData.error || 'Credenciais inválidas ou acesso não autorizado.',
            401,
            'UNAUTHORIZED'
          );
        }

        throw new AuthApiError(
          errData.error || `Erro de autenticação: HTTP ${res.status}`,
          res.status
        );
      }

      return (await res.json()) as LoginResponse;
    } catch (err: any) {
      this.handleError(err);
    }
  }

  /**
   * Realiza a alteração de senha obrigatória ou voluntária do usuário autenticado.
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
    token: string
  ): Promise<ChangePasswordResponse> {
    try {
      const payload: ChangePasswordRequest = {
        current_password: currentPassword,
        new_password: newPassword,
      };

      const res = await fetch(`${this.baseUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errData: any = {};
        try {
          errData = await res.json();
        } catch {
          // Ignora
        }

        throw new AuthApiError(
          errData.error || 'Falha ao alterar senha.',
          res.status,
          res.status === 401 ? 'UNAUTHORIZED' : 'VALIDATION_ERROR'
        );
      }

      return (await res.json()) as ChangePasswordResponse;
    } catch (err: any) {
      this.handleError(err);
    }
  }

  /**
   * Consulta o perfil atualizado do consultório no backend.
   */
  async getProfile(token: string): Promise<AuthTenantProfile> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        let errData: any = {};
        try {
          errData = await res.json();
        } catch {
          // Ignora
        }

        throw new AuthApiError(
          errData.error || 'Sessão inválida ou expirada.',
          res.status,
          'SESSION_REVOKED'
        );
      }

      const data = (await res.json()) as MeResponse;
      return data.tenant;
    } catch (err: any) {
      this.handleError(err);
    }
  }
}

export const authApiService = new AuthApiService();
