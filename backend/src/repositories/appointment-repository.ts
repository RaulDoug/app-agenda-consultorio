import type { Appointment, AppointmentItem, CreateAppointmentDTO, UpdateAppointmentDTO } from '@cliniassist/shared';
import { getDatabase, type IDatabase } from '../db/connection.js';

export class DoubleBookingConflictError extends Error {
  readonly statusCode = 409;
  readonly code = 'DOUBLE_BOOKING';
  constructor(message: string = 'Já existe um agendamento conflitante neste intervalo de horário (Double Booking).') {
    super(message);
    this.name = 'DoubleBookingConflictError';
  }
}

export interface PreparedAppointmentItem {
  procedure_id: string;
  effective_price_cents: number;
  cost_cents: number;
  duration_minutes: number;
}

export class AppointmentRepository {
  private customDb?: IDatabase;

  constructor(db?: IDatabase) {
    this.customDb = db;
  }

  private get db(): IDatabase {
    return this.customDb || getDatabase();
  }

  async findConflictingAppointments(
    tenantId: string,
    startTimeIso: string,
    endTimeIso: string,
    excludeId?: string
  ): Promise<Appointment[]> {
    let sql = `
      SELECT * FROM appointments
      WHERE tenant_id = $1
        AND deleted_at IS NULL
        AND status != 'CANCELLED'
        AND (start_time < $3 AND end_time > $2)
    `;
    const params: any[] = [tenantId, startTimeIso, endTimeIso];

    if (excludeId) {
      params.push(excludeId);
      sql += ` AND id != $${params.length}`;
    }

    sql += ` ORDER BY start_time ASC`;

    const res = await this.db.query<Appointment>(sql, params);
    return res.rows;
  }

  async createWithItems(
    tenantId: string,
    data: CreateAppointmentDTO,
    customId?: string,
    preparedItems?: PreparedAppointmentItem[],
    totalCharged?: number
  ): Promise<Appointment> {
    const client = await this.db.getClient();
    await client.query('BEGIN');

    try {
      // 1. Valida existência do paciente
      const patientCheck = await client.query(
        `SELECT id FROM patients WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [data.patient_id, tenantId]
      );
      if (patientCheck.rows.length === 0) {
        throw new Error('Paciente não encontrado ou desativado.');
      }

      // 2. Busca e valida procedimentos
      if (!data.procedure_ids || data.procedure_ids.length === 0) {
        throw new Error('Pelo menos um procedimento é obrigatório para o agendamento.');
      }

      const placeholders = data.procedure_ids.map((_, idx) => `$${idx + 1}`).join(', ');
      const proceduresQuery = `
        SELECT id, default_duration_minutes, default_price_cents, cost_cents
        FROM procedures
        WHERE id IN (${placeholders}) AND tenant_id = $${data.procedure_ids.length + 1} AND deleted_at IS NULL AND is_active = true
      `;
      const proceduresRes = await client.query(proceduresQuery, [...data.procedure_ids, tenantId]);

      if (proceduresRes.rows.length !== data.procedure_ids.length) {
        throw new Error('Um ou mais procedimentos selecionados são inválidos ou pertencem a outro consultório.');
      }

      // Mapeia procedimentos
      const procMap = new Map(proceduresRes.rows.map((p) => [p.id, p]));

      // Duração total somando todos os procedimentos
      const totalDurationMinutes = data.procedure_ids.reduce((sum, pid) => {
        const proc = procMap.get(pid);
        return sum + Number(proc?.default_duration_minutes || 30);
      }, 0);

      const startDate = new Date(data.start_time);
      if (isNaN(startDate.getTime())) {
        throw new Error('Data de início do agendamento é inválida.');
      }
      const endDate = new Date(startDate.getTime() + totalDurationMinutes * 60 * 1000);
      const startTimeIso = startDate.toISOString();
      const endTimeIso = endDate.toISOString();

      // Se não for encaixe extraordinário, verifica conflito de agendamento (Double Booking)
      if (!data.confirm_overtime) {
        const overlapQuery = `
          SELECT id FROM appointments
          WHERE tenant_id = $1
            AND deleted_at IS NULL
            AND status != 'CANCELLED'
            AND (start_time < $3 AND end_time > $2)
          LIMIT 1
        `;
        const overlapRes = await client.query(overlapQuery, [tenantId, startTimeIso, endTimeIso]);
        if (overlapRes.rows.length > 0) {
          throw new DoubleBookingConflictError(
            'Já existe um agendamento conflitante neste intervalo de horário (Double Booking).'
          );
        }
      }

      // Preço total cobrado (respeita desconto se fornecido)
      const computedTotal = totalCharged !== undefined
        ? totalCharged
        : proceduresRes.rows.reduce((sum, p) => sum + Number(p.default_price_cents), 0);

      // 4. Inserção do agendamento principal
      const appointmentId = customId || crypto.randomUUID();
      const insertAppointmentSql = `
        INSERT INTO appointments (
          id, tenant_id, patient_id, start_time, end_time,
          status, is_overtime, total_charged_cents, notes,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          'PENDING', $6, $7, $8,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
      `;

      const appointmentRes = await client.query<Appointment>(insertAppointmentSql, [
        appointmentId,
        tenantId,
        data.patient_id,
        startTimeIso,
        endTimeIso,
        Boolean(data.confirm_overtime),
        computedTotal,
        data.notes || null,
      ]);

      const appointment = appointmentRes.rows[0];

      // 5. Inserção dos itens do agendamento (Appointment Items)
      const items: AppointmentItem[] = [];

      if (preparedItems && preparedItems.length > 0) {
        for (const item of preparedItems) {
          const itemId = crypto.randomUUID();
          const insertItemSql = `
            INSERT INTO appointment_items (
              id, appointment_id, procedure_id, effective_price_cents, cost_cents, duration_minutes
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
          `;
          const itemRes = await client.query<AppointmentItem>(insertItemSql, [
            itemId,
            appointmentId,
            item.procedure_id,
            item.effective_price_cents,
            item.cost_cents || 0,
            item.duration_minutes,
          ]);
          items.push(itemRes.rows[0]);
        }
      } else {
        for (const pid of data.procedure_ids) {
          const proc = procMap.get(pid)!;
          const itemId = crypto.randomUUID();
          const insertItemSql = `
            INSERT INTO appointment_items (
              id, appointment_id, procedure_id, effective_price_cents, cost_cents, duration_minutes
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
          `;
          const itemRes = await client.query<AppointmentItem>(insertItemSql, [
            itemId,
            appointmentId,
            proc.id,
            proc.default_price_cents,
            proc.cost_cents || 0,
            proc.default_duration_minutes,
          ]);
          items.push(itemRes.rows[0]);
        }
      }

      await client.query('COMMIT');

      return {
        ...appointment,
        items,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findById(tenantId: string, id: string): Promise<Appointment | null> {
    const appQuery = `
      SELECT * FROM appointments
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const appRes = await this.db.query<Appointment>(appQuery, [id, tenantId]);
    if (appRes.rows.length === 0) {
      return null;
    }

    const appointment = appRes.rows[0];

    const itemsQuery = `
      SELECT * FROM appointment_items
      WHERE appointment_id = $1
    `;
    const itemsRes = await this.db.query<AppointmentItem>(itemsQuery, [id]);
    appointment.items = itemsRes.rows;

    return appointment;
  }

  async findAll(
    tenantId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      patientId?: string;
      status?: string;
    }
  ): Promise<Appointment[]> {
    let sql = `
      SELECT * FROM appointments
      WHERE tenant_id = $1 AND deleted_at IS NULL
    `;
    const params: any[] = [tenantId];

    if (options?.startDate) {
      params.push(options.startDate);
      sql += ` AND start_time >= $${params.length}`;
    }

    if (options?.endDate) {
      params.push(options.endDate);
      sql += ` AND end_time <= $${params.length}`;
    }

    if (options?.patientId) {
      params.push(options.patientId);
      sql += ` AND patient_id = $${params.length}`;
    }

    if (options?.status) {
      params.push(options.status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ` ORDER BY start_time ASC`;

    const res = await this.db.query<Appointment>(sql, params);
    const appointments = res.rows;

    if (appointments.length > 0) {
      const appIds = appointments.map((a) => a.id);
      const placeholders = appIds.map((_, i) => `$${i + 1}`).join(', ');
      const itemsRes = await this.db.query<AppointmentItem>(
        `SELECT * FROM appointment_items WHERE appointment_id IN (${placeholders})`,
        appIds
      );

      const itemsMap = new Map<string, AppointmentItem[]>();
      for (const item of itemsRes.rows) {
        if (!itemsMap.has(item.appointment_id)) {
          itemsMap.set(item.appointment_id, []);
        }
        itemsMap.get(item.appointment_id)!.push(item);
      }

      for (const app of appointments) {
        app.items = itemsMap.get(app.id) || [];
      }
    }

    return appointments;
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateAppointmentDTO
  ): Promise<Appointment | null> {
    const updates: string[] = [];
    const params: any[] = [id, tenantId];

    if (data.start_time !== undefined) {
      params.push(data.start_time);
      updates.push(`start_time = $${params.length}`);
    }
    if (data.status !== undefined) {
      params.push(data.status);
      updates.push(`status = $${params.length}`);
    }
    if (data.confirm_overtime !== undefined) {
      params.push(data.confirm_overtime);
      updates.push(`is_overtime = $${params.length}`);
    }
    if (data.total_charged_cents !== undefined) {
      params.push(data.total_charged_cents);
      updates.push(`total_charged_cents = $${params.length}`);
    }
    if (data.notes !== undefined) {
      params.push(data.notes);
      updates.push(`notes = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.findById(tenantId, id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `
      UPDATE appointments
      SET ${updates.join(', ')}
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      RETURNING *
    `;

    const res = await this.db.query<Appointment>(sql, params);
    if (res.rows.length === 0) {
      return null;
    }
    return this.findById(tenantId, id);
  }

  async updateWithItems(
    tenantId: string,
    id: string,
    data: UpdateAppointmentDTO,
    items?: PreparedAppointmentItem[],
    endTimeIso?: string
  ): Promise<Appointment | null> {
    const client = await this.db.getClient();
    await client.query('BEGIN');

    try {
      const updates: string[] = [];
      const params: any[] = [id, tenantId];

      if (data.start_time !== undefined) {
        params.push(data.start_time);
        updates.push(`start_time = $${params.length}`);
      }
      if (endTimeIso) {
        params.push(endTimeIso);
        updates.push(`end_time = $${params.length}`);
      }
      if (data.status !== undefined) {
        params.push(data.status);
        updates.push(`status = $${params.length}`);
      }
      if (data.confirm_overtime !== undefined) {
        params.push(data.confirm_overtime);
        updates.push(`is_overtime = $${params.length}`);
      }
      if (data.total_charged_cents !== undefined) {
        params.push(data.total_charged_cents);
        updates.push(`total_charged_cents = $${params.length}`);
      }
      if (data.notes !== undefined) {
        params.push(data.notes);
        updates.push(`notes = $${params.length}`);
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);

      const updateSql = `
        UPDATE appointments
        SET ${updates.join(', ')}
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
        RETURNING *
      `;
      const appRes = await client.query<Appointment>(updateSql, params);
      if (appRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      if (items && items.length > 0) {
        await client.query(`DELETE FROM appointment_items WHERE appointment_id = $1`, [id]);
        for (const item of items) {
          const itemId = crypto.randomUUID();
          await client.query(
            `INSERT INTO appointment_items (id, appointment_id, procedure_id, effective_price_cents, cost_cents, duration_minutes)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              itemId,
              id,
              item.procedure_id,
              item.effective_price_cents,
              item.cost_cents,
              item.duration_minutes,
            ]
          );
        }
      }

      await client.query('COMMIT');
      return this.findById(tenantId, id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Executa cancelamento ou exclusão via soft-delete com estorno contábil automático (D-09).
   */
  async cancelOrDeleteWithFinancialReversal(
    tenantId: string,
    id: string,
    isDelete: boolean
  ): Promise<boolean> {
    const client = await this.db.getClient();
    await client.query('BEGIN');

    try {
      // 1. Busca status atual do agendamento
      const checkRes = await client.query<{ id: string; status: string }>(
        `SELECT id, status FROM appointments WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [id, tenantId]
      );
      if (checkRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const currentStatus = checkRes.rows[0].status;

      // 2. Atualiza o agendamento
      if (isDelete) {
        await client.query(
          `UPDATE appointments
           SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
          [id, tenantId]
        );
      } else {
        await client.query(
          `UPDATE appointments
           SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
          [id, tenantId]
        );
      }

      // 3. Estorno contábil automático: se o agendamento estava concluído ou possui transações vinculadas, desativa todas elas
      if (currentStatus === 'COMPLETED' || isDelete || !isDelete) {
        await client.query(
          `UPDATE financial_transactions
           SET is_active = false, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE tenant_id = $1 AND appointment_id = $2 AND deleted_at IS NULL`,
          [tenantId, id]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    return this.cancelOrDeleteWithFinancialReversal(tenantId, id, true);
  }
}
