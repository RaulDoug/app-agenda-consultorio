/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { CliniAssistLocalDB } from '../../local-db.js';
import { AuthSessionLocalRepository } from '../auth-session-local-repository.js';
import type { AuthTenantProfile } from '@cliniassist/shared';

describe('AuthSessionLocalRepository — Persistência e Limpeza de Sessão', () => {
  let db: CliniAssistLocalDB;
  let repo: AuthSessionLocalRepository;

  const mockTenant: AuthTenantProfile = {
    id: 'tenant-uuid-1234',
    name: 'Clínica Odonto Teste',
    email: 'dr.teste@odonto.com',
    must_change_password: false,
    whatsapp_instance_name: 'instancia_teste',
    whatsapp_connected: true,
  };

  beforeEach(async () => {
    db = new CliniAssistLocalDB(`test_auth_${Date.now()}_${Math.random()}`);
    await db.open();
    repo = new AuthSessionLocalRepository(db);
  });

  it('AC-151: Retorna nulo quando não há sessão ativa salva no Dexie @spec:AC-151', async () => {
    const session = await repo.getSession();
    expect(session).toBeNull();
  });

  it('AC-158: Persiste e recupera sessão instantaneamente no Dexie em modo Local-First @spec:AC-158', async () => {
    await repo.saveSession('jwt_token_exemplo_123', mockTenant);

    const session = await repo.getSession();
    expect(session).not.toBeNull();
    expect(session?.token).toBe('jwt_token_exemplo_123');
    expect(session?.tenant.id).toBe('tenant-uuid-1234');
    expect(session?.tenant.name).toBe('Clínica Odonto Teste');
    expect(session?.tenant.email).toBe('dr.teste@odonto.com');
  });

  it('AC-157: Grava e recupera o último e-mail utilizado mesmo após logout da sessão @spec:AC-157', async () => {
    await repo.setSavedEmail('dentista@clinica.com');
    const savedEmail = await repo.getSavedEmail();
    expect(savedEmail).toBe('dentista@clinica.com');

    // Ao salvar a sessão com mockTenant, o e-mail lembrado é atualizado para o e-mail do consultório
    await repo.saveSession('token_1', mockTenant);
    await repo.clearSession();

    const sessionAfterClear = await repo.getSession();
    expect(sessionAfterClear).toBeNull();

    // O e-mail do consultório que deslogou permanece lembrado
    const emailAfterLogout = await repo.getSavedEmail();
    expect(emailAfterLogout).toBe(mockTenant.email);
  });

  it('AC-165: Contabiliza pendências na outbox e limpa todo o banco local no logout confirmado @spec:AC-165', async () => {
    // 1. Simula mutação pendente na outbox
    await db.sync_outbox.add({
      id: 'mutation-1',
      client_mutation_id: 'cmd-1',
      entity: 'patients',
      record_id: 'p-1',
      operation: 'INSERT',
      payload: { name: 'Paciente Offline' },
      status: 'PENDING',
      retry_count: 0,
      created_at: new Date().toISOString(),
    });

    const pendingCount = await repo.countPendingMutations();
    expect(pendingCount).toBe(1);

    // 2. Salva sessão e dados de paciente
    await repo.saveSession('token_temp', mockTenant);
    await db.patients.add({
      id: 'p-1',
      tenant_id: mockTenant.id,
      name: 'Paciente Offline',
      whatsapp: '11999999999',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 3. Executa a limpeza total de logout
    await repo.clearAllData();

    expect(await repo.getSession()).toBeNull();
    expect(await db.patients.count()).toBe(0);
    expect(await db.sync_outbox.count()).toBe(0);
    expect(await repo.countPendingMutations()).toBe(0);
  });
});
