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
});
