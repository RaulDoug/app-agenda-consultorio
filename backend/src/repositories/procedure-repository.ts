import type { Procedure, CreateProcedureDTO, UpdateProcedureDTO } from '@cliniassist/shared';
import { getDatabase, type IDatabase } from '../db/connection.js';

export const DEFAULT_PROCEDURES_SEEDS: {
  name: string;
  default_duration_minutes: number;
  default_price_cents: number;
  cost_cents: number;
}[] = [
  {
    name: 'Consulta Inicial / Avaliação',
    default_duration_minutes: 30,
    default_price_cents: 15000, // R$ 150,00
    cost_cents: 0,
  },
  {
    name: 'Atendimento Padrão',
    default_duration_minutes: 30,
    default_price_cents: 20000, // R$ 200,00
    cost_cents: 2000,
  },
  {
    name: 'Retorno / Revisão',
    default_duration_minutes: 30,
    default_price_cents: 0, // Cortesia / Retorno
    cost_cents: 0,
  },
  {
    name: 'Procedimento Especializado',
    default_duration_minutes: 60,
    default_price_cents: 35000, // R$ 350,00
    cost_cents: 5000,
  },
];

export class ProcedureRepository {
  private customDb?: IDatabase;

  constructor(db?: IDatabase) {
    this.customDb = db;
  }

  private get db(): IDatabase {
    return this.customDb || getDatabase();
  }

  async ensureDefaultProcedures(tenantId: string): Promise<Procedure[]> {
    const checkSql = `SELECT count(*) as count FROM procedures WHERE tenant_id = $1`;
    const checkRes = await this.db.query(checkSql, [tenantId]);
    const count = parseInt(checkRes.rows[0]?.count || '0', 10);

    if (count === 0) {
      const results: Procedure[] = [];
      for (const seed of DEFAULT_PROCEDURES_SEEDS) {
        const id = crypto.randomUUID();
        const query = `
          INSERT INTO procedures (id, tenant_id, name, default_duration_minutes, default_price_cents, cost_cents, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `;
        const res = await this.db.query<Procedure>(query, [
          id,
          tenantId,
          seed.name,
          seed.default_duration_minutes,
          seed.default_price_cents,
          seed.cost_cents,
        ]);
        results.push(res.rows[0]);
      }
      return results;
    }

    return [];
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
    await this.ensureDefaultProcedures(tenantId);

    let sql = `
      SELECT * FROM procedures
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (!options?.includeInactive) {
      sql += ` AND is_active = true AND deleted_at IS NULL`;
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
      if (data.is_active === true) {
        updates.push(`deleted_at = NULL`);
      }
    }
    if ((data as any).deleted_at !== undefined) {
      if ((data as any).deleted_at === null) {
        updates.push(`deleted_at = NULL`);
      } else {
        params.push((data as any).deleted_at);
        updates.push(`deleted_at = $${params.length}`);
      }
    }

    if (updates.length === 0) {
      return this.findById(tenantId, id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `
      UPDATE procedures
      SET ${updates.join(', ')}
      WHERE id = $1 AND tenant_id = $2
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
