/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { CliniAssistLocalDB } from '../../local-db.js';
import { ProcedureLocalRepository } from '../procedure-local-repository.js';

describe('ProcedureLocalRepository — Catálogo, Custos, Edição e Soft-Delete', () => {
  let db: CliniAssistLocalDB;
  let repo: ProcedureLocalRepository;
  const tenantId = 'tenant-proc-test-1';

  beforeEach(async () => {
    db = new CliniAssistLocalDB(`test_proc_${Date.now()}_${Math.random()}`);
    await db.open();
    repo = new ProcedureLocalRepository(db);
  });

  it('deve criar procedimento com duração, preço e custo operacional, enfileirando mutação INSERT', async () => {
    const proc = await repo.createProcedure({
      tenant_id: tenantId,
      name: 'Restauração em Resina',
      default_duration_minutes: 45,
      default_price_cents: 18000,
      cost_cents: 3500,
    });

    expect(proc.id).toBeDefined();
    expect(proc.name).toBe('Restauração em Resina');
    expect(proc.default_duration_minutes).toBe(45);
    expect(proc.default_price_cents).toBe(18000);
    expect(proc.cost_cents).toBe(3500);
    expect(proc.is_active).toBe(true);
    expect(proc.deleted_at).toBeNull();

    // Verifica persistência no Dexie
    const inDb = await db.procedures.get(proc.id);
    expect(inDb).toBeDefined();
    expect(inDb?.cost_cents).toBe(3500);

    // Verifica mutação na outbox
    const mutations = await db.sync_outbox.where('record_id').equals(proc.id).toArray();
    expect(mutations).toHaveLength(1);
    expect(mutations[0].operation).toBe('INSERT');
    expect(mutations[0].entity).toBe('procedures');
  });

  it('deve validar limites de duração, preço e custo na criação', async () => {
    // Duração zerada
    await expect(
      repo.createProcedure({
        tenant_id: tenantId,
        name: 'Duração Inválida',
        default_duration_minutes: 0,
        default_price_cents: 10000,
      })
    ).rejects.toThrow('A duração padrão deve ser maior que zero minutos.');

    // Preço negativo
    await expect(
      repo.createProcedure({
        tenant_id: tenantId,
        name: 'Preço Negativo',
        default_duration_minutes: 30,
        default_price_cents: -500,
      })
    ).rejects.toThrow('O preço padrão não pode ser negativo.');

    // Custo negativo
    await expect(
      repo.createProcedure({
        tenant_id: tenantId,
        name: 'Custo Negativo',
        default_duration_minutes: 30,
        default_price_cents: 10000,
        cost_cents: -100,
      })
    ).rejects.toThrow('O custo operacional não pode ser negativo.');
  });

  it('AC-243: Métodos de update e soft-delete com outbox no repositório de procedimentos @spec:AC-243', async () => {
    // 1. Cria procedimento inicial
    const proc = await repo.createProcedure({
      tenant_id: tenantId,
      name: 'Profilaxia e Limpeza',
      default_duration_minutes: 30,
      default_price_cents: 15000,
      cost_cents: 2000,
    });

    // 2. Atualiza valores (novo preço, novo custo, nova duração)
    const updated = await repo.updateProcedure(proc.id, {
      name: 'Profilaxia com Ultrassom',
      default_duration_minutes: 40,
      default_price_cents: 19000,
      cost_cents: 2500,
    });

    expect(updated.name).toBe('Profilaxia com Ultrassom');
    expect(updated.default_duration_minutes).toBe(40);
    expect(updated.default_price_cents).toBe(19000);
    expect(updated.cost_cents).toBe(2500);

    // Verifica mutação UPDATE na outbox
    const updateMutations = await db.sync_outbox
      .where('record_id')
      .equals(proc.id)
      .filter((m) => m.operation === 'UPDATE')
      .toArray();
    expect(updateMutations).toHaveLength(1);
    expect(updateMutations[0].payload.name).toBe('Profilaxia com Ultrassom');
    expect(updateMutations[0].payload.cost_cents).toBe(2500);

    // 3. Executa exclusão lógica (soft-delete)
    await repo.deleteProcedure(proc.id);

    const softDeleted = await db.procedures.get(proc.id);
    expect(softDeleted?.is_active).toBe(false);
    expect(softDeleted?.deleted_at).toBeDefined();
    expect(typeof softDeleted?.deleted_at).toBe('string');

    // Verifica mutação DELETE na outbox
    const deleteMutations = await db.sync_outbox
      .where('record_id')
      .equals(proc.id)
      .filter((m) => m.operation === 'DELETE')
      .toArray();
    expect(deleteMutations).toHaveLength(1);
    expect(deleteMutations[0].payload.is_active).toBe(false);
    expect(deleteMutations[0].payload.deleted_at).toBeDefined();

    // 4. listProcedures não deve retornar o procedimento excluído
    const list = await repo.listProcedures(tenantId);
    const found = list.find((p) => p.id === proc.id);
    expect(found).toBeUndefined();

    // 5. Reativação do procedimento: restaura is_active e limpa deleted_at, enfileira UPDATE
    const reactivated = await repo.reactivateProcedure(proc.id);
    expect(reactivated.is_active).toBe(true);
    expect(reactivated.deleted_at).toBeNull();

    const inDbAfterReactivate = await db.procedures.get(proc.id);
    expect(inDbAfterReactivate?.is_active).toBe(true);
    expect(inDbAfterReactivate?.deleted_at).toBeNull();

    const reactivateMutations = await db.sync_outbox
      .where('record_id')
      .equals(proc.id)
      .filter((m) => m.operation === 'UPDATE')
      .toArray();
    // 2 UPDATE mutations: a anterior de alteração e a de reativação
    expect(reactivateMutations.length).toBeGreaterThanOrEqual(2);
    const lastUpdate = reactivateMutations[reactivateMutations.length - 1];
    expect(lastUpdate.payload.is_active).toBe(true);
    expect(lastUpdate.payload.deleted_at).toBeNull();
  });
});

