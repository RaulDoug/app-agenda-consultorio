import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthApiService, AuthApiError, NetworkError } from '../auth-api.js';

describe('AuthApiService — Comunicação com Endpoints de Autenticação', () => {
  let authApi: AuthApiService;

  beforeEach(() => {
    vi.restoreAllMocks();
    authApi = new AuthApiService();
  });

  it('AC-152: Submete login com e-mail normalizado e retorna token e perfil do tenant @spec:AC-152', async () => {
    const mockSuccessResponse = {
      token: 'jwt_novo_123',
      tenant: {
        id: 't-1',
        name: 'Clínica Odonto',
        email: 'dentista@clinica.com',
        must_change_password: false,
        whatsapp_instance_name: null,
        whatsapp_connected: false,
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSuccessResponse,
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await authApi.login('  DENTISTA@Clinica.COM  ', 'SenhaSecreta123');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/auth/login');
    const sentBody = JSON.parse(options.body);
    expect(sentBody.email).toBe('dentista@clinica.com');
    expect(sentBody.password).toBe('SenhaSecreta123');
    expect(result.token).toBe('jwt_novo_123');
  });

  it('AC-153: Normaliza erro 401 como AuthApiError de credenciais inválidas @spec:AC-153', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Credenciais inválidas ou acesso não autorizado.' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(authApi.login('dentista@clinica.com', 'senha_errada')).rejects.toThrow(
      'Credenciais inválidas ou acesso não autorizado.'
    );
  });

  it('AC-154: Trata HTTP 429 exibindo erro de bloqueio por tentativas com retryAfterMinutes @spec:AC-154', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        error: 'Muitas tentativas de login incorretas. Tente novamente em 15 minutos.',
        code: 'TOO_MANY_REQUESTS',
        retryAfterMinutes: 15,
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    try {
      await authApi.login('dentista@clinica.com', 'senha_errada');
      expect.unreachable('Deveria ter lançado AuthApiError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AuthApiError);
      expect(err.statusCode).toBe(429);
      expect(err.code).toBe('TOO_MANY_REQUESTS');
      expect(err.retryAfterMinutes).toBe(15);
      expect(err.message).toContain('15 minutos');
    }
  });

  it('AC-155: Identifica ausência de internet e converte em NetworkError amigável @spec:AC-155', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', mockFetch);

    try {
      await authApi.login('dentista@clinica.com', 'senha123');
      expect.unreachable('Deveria ter lançado NetworkError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(NetworkError);
      expect(err.message).toContain('Sem conexão com a internet');
    }
  });
});
