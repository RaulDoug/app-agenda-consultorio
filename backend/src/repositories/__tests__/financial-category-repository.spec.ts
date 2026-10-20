import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryDatabase, type IDatabase } from '../../db/connection.js';
import { FinancialCategoryRepository } from '../financial-category-repository.js';
import { seedTestTenant } from '../../test-utils/auth.js';

describe('FinancialCategoryRepository — Persistência, Auto-Seed e Soft-Delete', () => {
  let db: IDatabase;
  let repo: FinancialCategoryRepository;
  let tenantId: string;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    repo = new FinancialCategoryRepository(db);

    const s = await seedTestTenant(db);
    tenantId = s.id;
  });

  it('deve realizar auto-seed de categorias padrão quando o tenant não possuir categorias cadastradas', async () => {
    const categories = await repo.findAll(tenantId);
    expect(categories.length).toBeGreaterThan(0);
    const hasAluguel = categories.some((c) => c.name === 'Aluguel');
    expect(hasAluguel).toBe(true);
  });

  it('deve criar uma nova categoria customizada para o tenant', async () => {
    const created = await repo.create(tenantId, {
      name: 'Equipamentos Odontológicos',
      type: 'EXPENSE',
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Equipamentos Odontológicos');
    expect(created.is_default).toBe(false);

    const found = await repo.findById(tenantId, created.id);
    expect(found?.name).toBe('Equipamentos Odontológicos');
  });

  it('deve atualizar o nome e tipo de uma categoria existente', async () => {
    const created = await repo.create(tenantId, {
      name: 'Categoria Temporária',
      type: 'EXPENSE',
    });

    const updated = await repo.update(tenantId, created.id, {
      name: 'Categoria Corrigida',
    });

    expect(updated?.name).toBe('Categoria Corrigida');
  });

  it('deve realizar soft-delete na categoria sem exclusão física', async () => {
    const created = await repo.create(tenantId, {
      name: 'Categoria para Deletar',
      type: 'EXPENSE',
    });

    const success = await repo.softDelete(tenantId, created.id);
    expect(success).toBe(true);

    const found = await repo.findById(tenantId, created.id);
    expect(found).toBeNull();

    // Verificação no banco: registro permanece com is_active = false
    const raw = await db.query(
      `SELECT is_active, deleted_at FROM financial_categories WHERE id = $1`,
      [created.id]
    );
    expect(raw.rows[0].is_active).toBe(false);
    expect(raw.rows[0].deleted_at).not.toBeNull();
  });
});
