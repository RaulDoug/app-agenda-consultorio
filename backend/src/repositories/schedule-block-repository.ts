import type { ScheduleBlock } from '@cliniassist/shared';
import { getDatabase, type IDatabase } from '../db/connection.js';

export interface CreateScheduleBlockDTO {
  title: string;
  start_time: string; // ISO 8601
  end_time: string;   // ISO 8601
}

export interface UpdateScheduleBlockDTO {
  title?: string;
  start_time?: string;
  end_time?: string;
}

export class ScheduleBlockRepository {
  private customDb?: IDatabase;

  constructor(db?: IDatabase) {
    this.customDb = db;
  }

  private get db(): IDatabase {
    return this.customDb || getDatabase();
  }

  async create(tenantId: string, data: CreateScheduleBlockDTO, customId?: string): Promise<ScheduleBlock> {
    const id = customId || crypto.randomUUID();
    const sql = `
      INSERT INTO schedule_blocks (id, tenant_id, title, start_time, end_time, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, tenant_id, title, start_time, end_time, created_at, updated_at
    `;
    const res = await this.db.query<ScheduleBlock>(sql, [
      id,
      tenantId,
      data.title,
      data.start_time,
      data.end_time,
    ]);
    return res.rows[0];
  }

  async findById(tenantId: string, id: string): Promise<ScheduleBlock | null> {
    const sql = `
      SELECT id, tenant_id, title, start_time, end_time, created_at, updated_at
      FROM schedule_blocks
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const res = await this.db.query<ScheduleBlock>(sql, [id, tenantId]);
    return res.rows[0] || null;
  }

  async findAll(
    tenantId: string,
    options?: { startDate?: string; endDate?: string }
  ): Promise<ScheduleBlock[]> {
    let sql = `
      SELECT id, tenant_id, title, start_time, end_time, created_at, updated_at
      FROM schedule_blocks
      WHERE tenant_id = $1 AND deleted_at IS NULL
    `;
    const params: any[] = [tenantId];

    if (options?.startDate) {
      params.push(options.startDate);
      sql += ` AND end_time >= $${params.length}`;
    }

    if (options?.endDate) {
      params.push(options.endDate);
      sql += ` AND start_time <= $${params.length}`;
    }

    sql += ` ORDER BY start_time ASC`;

    const res = await this.db.query<ScheduleBlock>(sql, params);
    return res.rows;
  }

  async update(tenantId: string, id: string, data: UpdateScheduleBlockDTO): Promise<ScheduleBlock | null> {
    const updates: string[] = [];
    const params: any[] = [id, tenantId];

    if (data.title !== undefined) {
      params.push(data.title);
      updates.push(`title = $${params.length}`);
    }

    if (data.start_time !== undefined) {
      params.push(data.start_time);
      updates.push(`start_time = $${params.length}`);
    }

    if (data.end_time !== undefined) {
      params.push(data.end_time);
      updates.push(`end_time = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.findById(tenantId, id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `
      UPDATE schedule_blocks
      SET ${updates.join(', ')}
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      RETURNING id, tenant_id, title, start_time, end_time, created_at, updated_at
    `;

    const res = await this.db.query<ScheduleBlock>(sql, params);
    return res.rows[0] || null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const sql = `
      UPDATE schedule_blocks
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const res = await this.db.query(sql, [id, tenantId]);
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Encontra bloqueios ativos que coincidem ou se sobrepõem ao intervalo especificado.
   * Regra de sobreposição: (block.start_time < slot_end) AND (block.end_time > slot_start)
   */
  async findOverlapping(
    tenantId: string,
    startTimeIso: string,
    endTimeIso: string
  ): Promise<ScheduleBlock[]> {
    const sql = `
      SELECT id, tenant_id, title, start_time, end_time, created_at, updated_at
      FROM schedule_blocks
      WHERE tenant_id = $1
        AND deleted_at IS NULL
        AND (start_time < $3 AND end_time > $2)
      ORDER BY start_time ASC
    `;
    const res = await this.db.query<ScheduleBlock>(sql, [tenantId, startTimeIso, endTimeIso]);
    return res.rows;
  }
}
