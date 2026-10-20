import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '../api-client.js';

describe('ApiClient — Injeção de Bearer Token e Interceptores de Sessão', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('AC-163: Anexa cabeçalho Authorization Bearer e não envia x-tenant-id @spec:AC-163', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const client = new ApiClient({
      getToken: () => 'token_jwt_valido_123',
    });

    await client.request('/api/patients');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/patients');
    expect(options.headers['Authorization']).toBe('Bearer token_jwt_valido_123');
    expect(options.headers['x-tenant-id']).toBeUndefined();
  });

  it('AC-160: Dispara callback onSessionExpired ao receber HTTP 401 em rota protegida @spec:AC-160', async () => {
    const onSessionExpired = vi.fn();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Sessão revogada.' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const client = new ApiClient({
      getToken: () => 'token_antigo',
      onSessionExpired,
    });

    const res = await client.request('/api/auth/me');

    expect(res.status).toBe(401);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('Dispara callback onPasswordChangeRequired ao receber HTTP 403 com PASSWORD_CHANGE_REQUIRED', async () => {
    const onPasswordChangeRequired = vi.fn();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      clone: () => ({
        json: async () => ({ code: 'PASSWORD_CHANGE_REQUIRED', error: 'Troca de senha obrigatória.' }),
      }),
      json: async () => ({ code: 'PASSWORD_CHANGE_REQUIRED', error: 'Troca de senha obrigatória.' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const client = new ApiClient({
      getToken: () => 'token_temporario',
      onPasswordChangeRequired,
    });

    await client.request('/api/patients');

    expect(onPasswordChangeRequired).toHaveBeenCalledTimes(1);
  });
});
