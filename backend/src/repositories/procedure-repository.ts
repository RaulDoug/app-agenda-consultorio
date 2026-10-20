import type { Procedure, CreateProcedureDTO, UpdateProcedureDTO } from '@cliniassist/shared';
import { getDatabase, type IDatabase } from '../db/connection.js';

export class ProcedureRepository {
  private customDb?: IDatabase;

  constructor(db?: IDatabase) {
    this.customDb = db;
  }

  private get db(): IDatabase {
    return this.customDb || getDatabase();
  }

  async create(tenantId: string, data: CreateProcedureDTO, customId?: string): Promise<Procedure> {
    const id = customId || crypto.randomUUID();
    const costCents = data.cost_cents !== undefined ? data.cost_cents : 0;
    const query = `
      INSERT INTO procedures (id, tenant_id, name, default_duration_minutes, default_price_cents, cost_cents, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const res = await this.db.query<Procedure>(query, [
      id,
      tenantId,
      data.name,
      data.default_duration_minutes,
      data.default_price_cents,
      costCents,
    ]);
    return res.rows[0];
  }

  async findById(tenantId: string, id: string): Promise<Procedure | null> {
    const query = `
      SELECT * FROM procedures
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const res = await this.db.query<Procedure>(query, [id, tenantId]);
    return res.rows[0] || null;
  }

  async findAll(tenantId: string, options?: { search?: string; includeInactive?: boolean }): Promise<Procedure[]> {
    let sql = `
      SELECT * FROM procedures
      WHERE tenant_id = $1 AND deleted_at IS NULL
    `;
    const params: any[] = [tenantId];

    if (!options?.includeInactive) {
      sql += ` AND is_active = true`;
    }

    if (options?.search && options.search.trim()) {
      params.push(`%${options.search.trim()}%`);
      sql += ` AND name ILIKE $${params.length}`;
    }

    sql += ` ORDER BY name ASC`;

    const res = await this.db.query<Procedure>(sql, params);
    return res.rows;
  }

  async update(tenantId: string, id: string, data: UpdateProcedureDTO): Promise<Procedure | null> {
    const updates: string[] = [];
    const params: any[] = [id, tenantId];

    if (data.name !== undefined) {
      params.push(data.name);
      updates.push(`name = $${params.length}`);
    }
    if (data.default_duration_minutes !== undefined) {
      params.push(data.default_duration_minutes);
      updates.push(`default_duration_minutes = $${params.length}`);
    }
    if (data.default_price_cents !== undefined) {
      params.push(data.default_price_cents);
      updates.push(`default_price_cents = $${params.length}`);
    }
    if (data.cost_cents !== undefined) {
      params.push(data.cost_cents);
      updates.push(`cost_cents = $${params.length}`);
    }
    if (data.is_active !== undefined) {
      params.push(data.is_active);
      updates.push(`is_active = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.findById(tenantId, id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `
      UPDATE procedures
      SET ${updates.join(', ')}
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      RETURNING *
    `;

    const res = await this.db.query<Procedure>(sql, params);
    return res.rows[0] || null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const sql = `
      UPDATE procedures
      SET is_active = false, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const res = await this.db.query(sql, [id, tenantId]);
    return (res.rowCount ?? 0) > 0;
  }
}
