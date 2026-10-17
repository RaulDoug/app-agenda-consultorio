import type { Patient, CreatePatientDTO, UpdatePatientDTO } from '@odontoflow/shared';
import { getDatabase, type IDatabase } from '../db/connection.js';

export class PatientRepository {
  private customDb?: IDatabase;

  constructor(db?: IDatabase) {
    this.customDb = db;
  }

  private get db(): IDatabase {
    return this.customDb || getDatabase();
  }

  async create(tenantId: string, data: CreatePatientDTO, customId?: string): Promise<Patient> {
    const id = customId || crypto.randomUUID();
    const query = `
      INSERT INTO patients (id, tenant_id, name, whatsapp, notes, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const res = await this.db.query<Patient>(query, [
      id,
      tenantId,
      data.name,
      data.whatsapp,
      data.notes || null,
    ]);
    return res.rows[0];
  }

  async findById(tenantId: string, id: string): Promise<Patient | null> {
    const query = `
      SELECT * FROM patients
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const res = await this.db.query<Patient>(query, [id, tenantId]);
    return res.rows[0] || null;
  }

  async findAll(tenantId: string, options?: { search?: string; includeInactive?: boolean }): Promise<Patient[]> {
    let sql = `
      SELECT * FROM patients
      WHERE tenant_id = $1 AND deleted_at IS NULL
    `;
    const params: any[] = [tenantId];

    if (!options?.includeInactive) {
      sql += ` AND is_active = true`;
    }

    if (options?.search && options.search.trim()) {
      params.push(`%${options.search.trim()}%`);
      sql += ` AND (name ILIKE $${params.length} OR whatsapp ILIKE $${params.length})`;
    }

    sql += ` ORDER BY name ASC`;

    const res = await this.db.query<Patient>(sql, params);
    return res.rows;
  }

  async update(tenantId: string, id: string, data: UpdatePatientDTO): Promise<Patient | null> {
    const updates: string[] = [];
    const params: any[] = [id, tenantId];

    if (data.name !== undefined) {
      params.push(data.name);
      updates.push(`name = $${params.length}`);
    }
    if (data.whatsapp !== undefined) {
      params.push(data.whatsapp);
      updates.push(`whatsapp = $${params.length}`);
    }
    if (data.notes !== undefined) {
      params.push(data.notes);
      updates.push(`notes = $${params.length}`);
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
      UPDATE patients
      SET ${updates.join(', ')}
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      RETURNING *
    `;

    const res = await this.db.query<Patient>(sql, params);
    return res.rows[0] || null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const sql = `
      UPDATE patients
      SET is_active = false, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const res = await this.db.query(sql, [id, tenantId]);
    return (res.rowCount ?? 0) > 0;
  }
}
