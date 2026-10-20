import type { BusinessHours } from '@cliniassist/shared';
import { getDatabase, type IDatabase } from '../db/connection.js';

export interface UpsertBusinessHoursDTO {
  day_of_week: number;
  is_open: boolean;
  start_time?: string;
  end_time?: string;
  break_start_time?: string | null;
  break_end_time?: string | null;
}

export class BusinessHoursRepository {
  private customDb?: IDatabase;

  constructor(db?: IDatabase) {
    this.customDb = db;
  }

  private get db(): IDatabase {
    return this.customDb || getDatabase();
  }

  async ensureDefaultHours(tenantId: string): Promise<void> {
    const checkSql = `SELECT count(*) as count FROM business_hours WHERE tenant_id = $1`;
    const checkRes = await this.db.query(checkSql, [tenantId]);
    const count = parseInt(checkRes.rows[0]?.count || '0', 10);

    if (count === 0) {
      const defaultDays: UpsertBusinessHoursDTO[] = [
        { day_of_week: 0, is_open: false, start_time: '08:00', end_time: '18:00', break_start_time: null, break_end_time: null },
        { day_of_week: 1, is_open: true, start_time: '08:00', end_time: '18:00', break_start_time: '12:00', break_end_time: '13:30' },
        { day_of_week: 2, is_open: true, start_time: '08:00', end_time: '18:00', break_start_time: '12:00', break_end_time: '13:30' },
        { day_of_week: 3, is_open: true, start_time: '08:00', end_time: '18:00', break_start_time: '12:00', break_end_time: '13:30' },
        { day_of_week: 4, is_open: true, start_time: '08:00', end_time: '18:00', break_start_time: '12:00', break_end_time: '13:30' },
        { day_of_week: 5, is_open: true, start_time: '08:00', end_time: '18:00', break_start_time: '12:00', break_end_time: '13:30' },
        { day_of_week: 6, is_open: false, start_time: '08:00', end_time: '18:00', break_start_time: null, break_end_time: null },
      ];

      for (const day of defaultDays) {
        await this.db.query(
          `INSERT INTO business_hours (
            id, tenant_id, day_of_week, is_open, start_time, end_time, break_start_time, break_end_time, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (tenant_id, day_of_week) DO NOTHING`,
          [
            crypto.randomUUID(),
            tenantId,
            day.day_of_week,
            day.is_open,
            day.start_time,
            day.end_time,
            day.break_start_time,
            day.break_end_time,
          ]
        );
      }
    }
  }

  async findByTenant(tenantId: string): Promise<BusinessHours[]> {
    const sql = `
      SELECT id, tenant_id, day_of_week, is_open, start_time, end_time, break_start_time, break_end_time, created_at
      FROM business_hours
      WHERE tenant_id = $1
      ORDER BY day_of_week ASC
    `;
    const res = await this.db.query<BusinessHours>(sql, [tenantId]);
    return res.rows;
  }

  async findByDay(tenantId: string, dayOfWeek: number): Promise<BusinessHours | null> {
    const sql = `
      SELECT id, tenant_id, day_of_week, is_open, start_time, end_time, break_start_time, break_end_time, created_at
      FROM business_hours
      WHERE tenant_id = $1 AND day_of_week = $2
    `;
    const res = await this.db.query<BusinessHours>(sql, [tenantId, dayOfWeek]);
    return res.rows[0] || null;
  }

  async upsertDay(tenantId: string, data: UpsertBusinessHoursDTO): Promise<BusinessHours> {
    const existing = await this.db.query(
      `SELECT id FROM business_hours WHERE tenant_id = $1 AND day_of_week = $2`,
      [tenantId, data.day_of_week]
    );

    if (existing.rows.length === 0) {
      const id = crypto.randomUUID();
      const insertSql = `
        INSERT INTO business_hours (
          id, tenant_id, day_of_week, is_open, start_time, end_time, break_start_time, break_end_time, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, tenant_id, day_of_week, is_open, start_time, end_time, break_start_time, break_end_time, created_at
      `;
      const res = await this.db.query<BusinessHours>(insertSql, [
        id,
        tenantId,
        data.day_of_week,
        Boolean(data.is_open),
        data.start_time || '08:00',
        data.end_time || '18:00',
        data.break_start_time || null,
        data.break_end_time || null,
      ]);
      return res.rows[0];
    } else {
      const updateSql = `
        UPDATE business_hours
        SET is_open = $3,
            start_time = $4,
            end_time = $5,
            break_start_time = $6,
            break_end_time = $7,
            updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $1 AND day_of_week = $2
        RETURNING id, tenant_id, day_of_week, is_open, start_time, end_time, break_start_time, break_end_time, created_at
      `;
      const res = await this.db.query<BusinessHours>(updateSql, [
        tenantId,
        data.day_of_week,
        Boolean(data.is_open),
        data.start_time || '08:00',
        data.end_time || '18:00',
        data.break_start_time || null,
        data.break_end_time || null,
      ]);
      return res.rows[0];
    }
  }

  async upsertBatch(tenantId: string, list: UpsertBusinessHoursDTO[]): Promise<BusinessHours[]> {
    for (const item of list) {
      await this.upsertDay(tenantId, item);
    }
    return this.findByTenant(tenantId);
  }
}
