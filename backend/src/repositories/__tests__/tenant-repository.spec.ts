import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryDatabase, type IDatabase } from '../../db/connection.js';
import { TenantRepository } from '../tenant-repository.js';

describe('TenantRepository — Persistência, Controle de Sessão e Incremento de Token (T-108)', () => {
  let db: IDatabase;
  let repo: TenantRepository;

  beforeEach(() => {
    db = createInMemoryDatabase();
    repo = new TenantRepository(db);
  });

  it('deve criar um tenant com email normalizado e token_version inicial igual a zero', async () => {
    const tenant = await repo.create({
      name: 'Clínica Sorriso Total',
      email: '  Contato@SorrisoTotal.COM  ',
      password_hash: '$2b$10$hashSimuladoParaTeste12345678901234567890',
      must_change_password: true,
    });

    expect(tenant).toBeDefined();
    expect(tenant.name).toBe('Clínica Sorriso Total');
    expect(tenant.email).toBe('contato@sorrisototal.com');
    expect(tenant.must_change_password).toBe(true);
    expect(tenant.token_version).toBe(0);
    expect(tenant.is_active).toBe(true);
  });

  it('deve buscar tenant por e-mail de forma case-insensitive e com trim', async () => {
    await repo.create({
      name: 'Consultório Dr. Silva',
      email: 'silva@consultorio.com',
      password_hash: '$2b$10$hashExemplo123456789012345678901234567890',
    });

    const found = await repo.findByEmail('  SILVA@Consultorio.COM ');
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Consultório Dr. Silva');
  });

  it('deve retornar null ao buscar e-mail inexistente ou vazio', async () => {
    const res1 = await repo.findByEmail('nao_existe@clinica.com');
    const res2 = await repo.findByEmail('');
    expect(res1).toBeNull();
    expect(res2).toBeNull();
  });

  it('deve buscar tenant por ID com sucesso', async () => {
    const created = await repo.create({
      name: 'Clínica Norte',
      email: 'norte@clinica.com',
      password_hash: '$2b$10$hashExemplo123456789012345678901234567890',
    });

    const found = await repo.findById(created.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
  });

  it('deve atualizar senha e incrementar atomicamente o token_version a cada alteração', async () => {
    const created = await repo.create({
      name: 'Clínica Sul',
      email: 'sul@clinica.com',
      password_hash: '$2b$10$hashOriginal1234567890123456789012345678',
      must_change_password: true,
    });
    expect(created.token_version).toBe(0);

    // Primeiro update de senha: limpa must_change_password e incrementa token_version para 1
    const updated1 = await repo.updatePassword(
      created.id,
      '$2b$10$novoHashNumeroDois12345678901234567890123456',
      false
    );
    expect(updated1?.token_version).toBe(1);
    expect(updated1?.must_change_password).toBe(false);
    expect(updated1?.password_changed_at).not.toBeNull();

    // Segundo update (ex: reset): token_version deve ir para 2
    const updated2 = await repo.updatePassword(
      created.id,
      '$2b$10$novoHashNumeroTres12345678901234567890123456',
      true
    );
    expect(updated2?.token_version).toBe(2);
    expect(updated2?.must_change_password).toBe(true);
  });

  it('deve consultar o estado de sessão leve para o authMiddleware com getSessionState', async () => {
    const created = await repo.create({
      name: 'Clínica Centro',
      email: 'centro@clinica.com',
      password_hash: '$2b$10$hashCentro123456789012345678901234567890',
      must_change_password: true,
    });

    const state = await repo.getSessionState(created.id);
    expect(state).not.toBeNull();
    expect(state?.id).toBe(created.id);
    expect(state?.is_active).toBe(true);
    expect(state?.token_version).toBe(0);
    expect(state?.must_change_password).toBe(true);
  });
});
