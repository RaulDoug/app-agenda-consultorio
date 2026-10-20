import { getDatabase, type IDatabase } from '../db/connection.js';
import type { FinancialCategory, CreateFinancialCategoryDTO } from '@cliniassist/shared';

export const DEFAULT_FINANCIAL_CATEGORIES = [
  { name: 'Aluguel', type: 'EXPENSE' },
  { name: 'Materiais e Insumos', type: 'EXPENSE' },
  { name: 'Salários e Encargos', type: 'EXPENSE' },
  { name: 'Marketing', type: 'EXPENSE' },
  { name: 'Água, Luz e Internet', type: 'EXPENSE' },
  { name: 'Softwares e Assinaturas', type: 'EXPENSE' },
  { name: 'Outras Despesas', type: 'EXPENSE' },
  { name: 'Tratamento Odontológico', type: 'INCOME' },
  { name: 'Consulta e Avaliação', type: 'INCOME' },
  { name: 'Procedimento Estético', type: 'INCOME' },
  { name: 'Outras Receitas', type: 'INCOME' },
];

export class FinancialCategoryRepository {
  private customDb?: IDatabase;

  constructor(db?: IDatabase) {
    this.customDb = db;
  }

  private get db(): IDatabase {
    return this.customDb || getDatabase();
  }

  async findAll(tenantId: string, type?: string): Promise<FinancialCategory[]> {
    let sql = `
      SELECT * FROM financial_categories
      WHERE tenant_id = $1 AND is_active = true AND deleted_at IS NULL
    `;
    const params: any[] = [tenantId];

    if (type) {
      params.push(type);
      sql += ` AND type = $2`;
    }

    sql += ` ORDER BY is_default DESC, name ASC`;

    const res = await this.db.query<FinancialCategory>(sql, params);

    // Se o tenant ainda não tiver categorias, auto-seed categorias padrão sob demanda (D-05)
    if (res.rows.length === 0 && !type) {
      return this.seedDefaults(tenantId);
    }

    return res.rows;
  }

  async findById(tenantId: string, id: string): Promise<FinancialCategory | null> {
    const sql = `
      SELECT * FROM financial_categories
      WHERE id = $1 AND tenant_id = $2 AND is_active = true AND deleted_at IS NULL
    `;
    const res = await this.db.query<FinancialCategory>(sql, [id, tenantId]);
    return res.rows[0] || null;
  }

  async create(tenantId: string, data: CreateFinancialCategoryDTO): Promise<FinancialCategory> {
    const id = crypto.randomUUID();
    const type = data.type || 'EXPENSE';
    const sql = `
      INSERT INTO financial_categories (
        id, tenant_id, name, type, is_default, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const res = await this.db.query<FinancialCategory>(sql, [id, tenantId, data.name, type]);
    return res.rows[0];
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<CreateFinancialCategoryDTO>
  ): Promise<FinancialCategory | null> {
    const existing = await this.findById(tenantId, id);
    if (!existing) return null;

    const name = data.name !== undefined ? data.name : existing.name;
    const type = data.type !== undefined ? data.type : (existing.type || 'EXPENSE');

    const sql = `
      UPDATE financial_categories
      SET name = $1, type = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND tenant_id = $4 AND is_active = true AND deleted_at IS NULL
      RETURNING *
    `;
    const res = await this.db.query<FinancialCategory>(sql, [name, type, id, tenantId]);
    return res.rows[0] || null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const sql = `
      UPDATE financial_categories
      SET is_active = false, deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2 AND is_active = true AND deleted_at IS NULL
    `;
    const res = await this.db.query(sql, [id, tenantId]);
    return (res.rowCount || 0) > 0;
  }

  async seedDefaults(tenantId: string): Promise<FinancialCategory[]> {
    const results: FinancialCategory[] = [];
    for (const cat of DEFAULT_FINANCIAL_CATEGORIES) {
      const id = crypto.randomUUID();
      const sql = `
        INSERT INTO financial_categories (
          id, tenant_id, name, type, is_default, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const res = await this.db.query<FinancialCategory>(sql, [id, tenantId, cat.name, cat.type]);
      results.push(res.rows[0]);
    }
    return results;
  }
}
