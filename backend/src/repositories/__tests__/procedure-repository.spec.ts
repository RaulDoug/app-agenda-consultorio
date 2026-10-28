import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryDatabase, type IDatabase } from '../../db/connection.js';
import { ProcedureRepository } from '../procedure-repository.js';
import { seedTestTenant } from '../../test-utils/auth.js';

describe('ProcedureRepository — Persistência, Custo/Preço e Isolamento Multi-Tenant', () => {
  let db: IDatabase;
  let repo: ProcedureRepository;
  let tenantA: string;
  let tenantB: string;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    repo = new ProcedureRepository(db);

    const sA = await seedTestTenant(db);
    tenantA = sA.id;
    const sB = await seedTestTenant(db);
    tenantB = sB.id;
  });

  it('deve criar procedimento com duração, preço e custo definidos', async () => {
    const procedure = await repo.create(tenantA, {
      name: 'Limpeza Dental e Profilaxia',
      default_duration_minutes: 45,
      default_price_cents: 18000,
      cost_cents: 3500,
    });

    expect(procedure).toBeDefined();
    expect(procedure.id).toBeDefined();
    expect(procedure.name).toBe('Limpeza Dental e Profilaxia');
    expect(procedure.default_duration_minutes).toBe(45);
    expect(procedure.default_price_cents).toBe(18000);
    expect(procedure.cost_cents).toBe(3500);
    expect(procedure.is_active).toBe(true);
  });

  it('deve buscar procedimento por ID com proteção contra vazamento multi-tenant', async () => {
    const createdA = await repo.create(tenantA, {
      name: 'Restauração em Resina',
      default_duration_minutes: 60,
      default_price_cents: 25000,
      cost_cents: 5000,
    });

    const foundA = await repo.findById(tenantA, createdA.id);
    expect(foundA).not.toBeNull();
    expect(foundA?.id).toBe(createdA.id);

    // Tenant B não deve acessar
    const foundB = await repo.findById(tenantB, createdA.id);
    expect(foundB).toBeNull();
  });

  it('deve listar procedimentos ativos e suportar busca textual por nome', async () => {
    await repo.create(tenantA, { name: 'Clareamento a Laser', default_duration_minutes: 60, default_price_cents: 80000 });
    await repo.create(tenantA, { name: 'Clareamento Caseiro', default_duration_minutes: 30, default_price_cents: 40000 });
    await repo.create(tenantA, { name: 'Extração de Siso', default_duration_minutes: 90, default_price_cents: 50000 });
    await repo.create(tenantB, { name: 'Clareamento Externo', default_duration_minutes: 60, default_price_cents: 60000 });

    const searchRes = await repo.findAll(tenantA, { search: 'Clareamento' });
    expect(searchRes).toHaveLength(2);
    expect(searchRes.map(p => p.name)).toEqual(['Clareamento Caseiro', 'Clareamento a Laser']);
  });

  it('deve atualizar dados e custo do procedimento', async () => {
    const created = await repo.create(tenantA, {
      name: 'Aplicação de Flúor',
      default_duration_minutes: 20,
      default_price_cents: 10000,
      cost_cents: 1500,
    });

    const updated = await repo.update(tenantA, created.id, {
      name: 'Aplicação Tópica de Flúor Gel',
      default_price_cents: 12000,
      cost_cents: 2000,
    });

    expect(updated).not.toBeNull();
    expect(updated?.name).toBe('Aplicação Tópica de Flúor Gel');
    expect(updated?.default_price_cents).toBe(12000);
    expect(updated?.cost_cents).toBe(2000);
  });

  it('deve realizar soft-delete do procedimento preservando histórico no banco', async () => {
    const created = await repo.create(tenantA, {
      name: 'Procedimento Descontinuado',
      default_duration_minutes: 30,
      default_price_cents: 5000,
    });

    const deleted = await repo.softDelete(tenantA, created.id);
    expect(deleted).toBe(true);

    const found = await repo.findById(tenantA, created.id);
    expect(found).toBeNull();

    const rawRes = await db.query('SELECT is_active, deleted_at FROM procedures WHERE id = $1', [created.id]);
    expect(rawRes.rows[0].is_active).toBe(false);
    expect(rawRes.rows[0].deleted_at).not.toBeNull();
  });

  it('AC-245: Auto-seed de procedimentos padrões no PostgreSQL e suporte a listagem com inativos @spec:AC-245', async () => {
    const sC = await seedTestTenant(db);
    const tenantC = sC.id;

    // 1. Tenant novo sem procedimentos: findAll deve acionar o auto-seed dos 4 procedimentos padrões
    const seededList = await repo.findAll(tenantC);
    expect(seededList).toHaveLength(4);

    const names = seededList.map((p) => p.name);
    expect(names).toContain('Consulta Inicial / Avaliação');
    expect(names).toContain('Atendimento Padrão');
    expect(names).toContain('Retorno / Revisão');
    expect(names).toContain('Procedimento Especializado');

    // Valida propriedades e custos dos procedimentos semeados
    const consulta = seededList.find((p) => p.name === 'Consulta Inicial / Avaliação')!;
    expect(consulta.default_duration_minutes).toBe(30);
    expect(consulta.default_price_cents).toBe(15000);
    expect(consulta.cost_cents).toBe(0);
    expect(consulta.is_active).toBe(true);

    const atendimento = seededList.find((p) => p.name === 'Atendimento Padrão')!;
    expect(atendimento.default_duration_minutes).toBe(30);
    expect(atendimento.default_price_cents).toBe(20000);
    expect(atendimento.cost_cents).toBe(2000);

    const retorno = seededList.find((p) => p.name === 'Retorno / Revisão')!;
    expect(retorno.default_price_cents).toBe(0);
    expect(retorno.cost_cents).toBe(0);

    const especializado = seededList.find((p) => p.name === 'Procedimento Especializado')!;
    expect(especializado.default_duration_minutes).toBe(60);
    expect(especializado.default_price_cents).toBe(35000);
    expect(especializado.cost_cents).toBe(5000);

    // 2. Chamadas subsequentes são idempotentes
    const secondCall = await repo.ensureDefaultProcedures(tenantC);
    expect(secondCall).toHaveLength(0);
    const totalCountRes = await db.query('SELECT count(*) as count FROM procedures WHERE tenant_id = $1', [tenantC]);
    expect(parseInt(totalCountRes.rows[0].count, 10)).toBe(4);

    // 3. Soft-delete de um procedimento
    await repo.softDelete(tenantC, consulta.id);

    // Listagem padrão (apenas ativos) retorna 3
    const activeOnly = await repo.findAll(tenantC);
    expect(activeOnly).toHaveLength(3);
    expect(activeOnly.find((p) => p.id === consulta.id)).toBeUndefined();

    // Listagem com includeInactive: true retorna os 4
    const withInactive = await repo.findAll(tenantC, { includeInactive: true });
    expect(withInactive).toHaveLength(4);
    const softDeleted = withInactive.find((p) => p.id === consulta.id)!;
    expect(softDeleted.is_active).toBe(false);
    expect(softDeleted.deleted_at).toBeDefined();

    // 4. Reativação do procedimento: atualiza is_active = true e limpa deleted_at
    const reactivated = await repo.update(tenantC, consulta.id, { is_active: true });
    expect(reactivated).not.toBeNull();
    expect(reactivated?.is_active).toBe(true);
    expect(reactivated?.deleted_at).toBeNull();

    const activeAfterReactivate = await repo.findAll(tenantC);
    expect(activeAfterReactivate).toHaveLength(4);
    expect(activeAfterReactivate.find((p) => p.id === consulta.id)).toBeDefined();
  });
});
