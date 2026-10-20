import { getDatabase, type IDatabase } from '../db/connection.js';
import type {
  ProfitableProcedureItem,
  InactivePatientItem,
  PatientAppointmentHistoryItem,
  ReceivablesBreakdown,
} from '@cliniassist/shared';

export interface NoShowStatsRaw {
  total_appointments: number;
  no_show_count: number;
  no_show_rate: number;
  lost_estimated_cents: number;
}

export interface DREStatsRaw {
  total_income_paid_cents: number;
  total_expense_paid_cents: number;
  net_profit_cents: number;
}

export interface ReceivablesStatsRaw {
  reference_date: string;
  pending_next_30_cents: number;
  pending_next_60_cents: number;
  pending_next_90_cents: number;
  breakdown: ReceivablesBreakdown;
}

export class ReportsRepository {
  private customDb?: IDatabase;

  constructor(db?: IDatabase) {
    this.customDb = db;
  }

  private get db(): IDatabase {
    return this.customDb || getDatabase();
  }

  /**
   * Estatísticas de Faltas (No-Show) e Prejuízo Estimado
   */
  async getNoShowStats(
    tenantId: string,
    startDate?: string,
    endDate?: string
  ): Promise<NoShowStatsRaw> {
    let appWhere = `tenant_id = $1 AND deleted_at IS NULL`;
    const params: any[] = [tenantId];

    if (startDate) {
      params.push(startDate);
      appWhere += ` AND start_time >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate + ' 23:59:59+00');
      appWhere += ` AND start_time <= $${params.length}`;
    }

    const countSql = `
      SELECT 
        COUNT(*)::int AS total_appointments,
        COUNT(CASE WHEN status = 'NO_SHOW' THEN 1 END)::int AS no_show_count
      FROM appointments
      WHERE ${appWhere}
    `;
    const countRes = await this.db.query(countSql, params);
    const row = countRes.rows[0] || { total_appointments: 0, no_show_count: 0 };

    const total = Number(row.total_appointments) || 0;
    const noShow = Number(row.no_show_count) || 0;
    const rate = total > 0 ? Number(((noShow / total) * 100).toFixed(2)) : 0;

    let lostSql = `
      SELECT COALESCE(SUM(ai.effective_price_cents), 0)::int AS lost_cents
      FROM appointments a
      JOIN appointment_items ai ON ai.appointment_id = a.id
      WHERE a.status = 'NO_SHOW' AND a.${appWhere}
    `;
    const lostRes = await this.db.query(lostSql, params);
    const lostEstimatedCents = Number(lostRes.rows[0]?.lost_cents) || 0;

    return {
      total_appointments: total,
      no_show_count: noShow,
      no_show_rate: rate,
      lost_estimated_cents: lostEstimatedCents,
    };
  }

  /**
   * Demonstração do Resultado do Exercício (DRE Simplificado)
   */
  async getDREStats(
    tenantId: string,
    startDate?: string,
    endDate?: string
  ): Promise<DREStatsRaw> {
    let where = `tenant_id = $1 AND is_active = true AND deleted_at IS NULL AND status = 'PAID'`;
    const params: any[] = [tenantId];

    if (startDate) {
      params.push(startDate);
      where += ` AND COALESCE(payment_date, due_date) >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      where += ` AND COALESCE(payment_date, due_date) <= $${params.length}`;
    }

    const sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount_cents ELSE 0 END), 0)::int AS total_income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount_cents ELSE 0 END), 0)::int AS total_expense
      FROM financial_transactions
      WHERE ${where}
    `;

    const res = await this.db.query(sql, params);
    const totalIncome = Number(res.rows[0]?.total_income) || 0;
    const totalExpense = Number(res.rows[0]?.total_expense) || 0;

    return {
      total_income_paid_cents: totalIncome,
      total_expense_paid_cents: totalExpense,
      net_profit_cents: totalIncome - totalExpense,
    };
  }

  /**
   * Projeção de Recebíveis Futuros (30, 60 e 90 dias)
   */
  async getReceivablesStats(
    tenantId: string,
    referenceDateInput?: string
  ): Promise<ReceivablesStatsRaw> {
    const refDateStr = referenceDateInput || new Date().toISOString().slice(0, 10);
    const refDate = new Date(refDateStr + 'T00:00:00.000Z');

    const addDays = (d: Date, days: number): string => {
      const copy = new Date(d.getTime());
      copy.setUTCDate(copy.getUTCDate() + days);
      return copy.toISOString().slice(0, 10);
    };

    const date30 = addDays(refDate, 30);
    const date60 = addDays(refDate, 60);
    const date90 = addDays(refDate, 90);

    const sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN due_date >= $2 AND due_date <= $3 THEN amount_cents ELSE 0 END), 0)::int AS next_30,
        COALESCE(SUM(CASE WHEN due_date >= $2 AND due_date <= $4 THEN amount_cents ELSE 0 END), 0)::int AS next_60,
        COALESCE(SUM(CASE WHEN due_date >= $2 AND due_date <= $5 THEN amount_cents ELSE 0 END), 0)::int AS next_90,
        COALESCE(SUM(CASE WHEN due_date > $3 AND due_date <= $4 THEN amount_cents ELSE 0 END), 0)::int AS window_31_60,
        COALESCE(SUM(CASE WHEN due_date > $4 AND due_date <= $5 THEN amount_cents ELSE 0 END), 0)::int AS window_61_90
      FROM financial_transactions
      WHERE tenant_id = $1 
        AND type = 'INCOME' 
        AND status = 'PENDING'
        AND is_active = true 
        AND deleted_at IS NULL
    `;

    const res = await this.db.query(sql, [tenantId, refDateStr, date30, date60, date90]);
    const r = res.rows[0] || {};

    const next30 = Number(r.next_30) || 0;
    const next60 = Number(r.next_60) || 0;
    const next90 = Number(r.next_90) || 0;
    const window31To60 = Number(r.window_31_60) || 0;
    const window61To90 = Number(r.window_61_90) || 0;

    return {
      reference_date: refDateStr,
      pending_next_30_cents: next30,
      pending_next_60_cents: next60,
      pending_next_90_cents: next90,
      breakdown: {
        window_0_30_cents: next30,
        window_31_60_cents: window31To60,
        window_61_90_cents: window61To90,
      },
    };
  }

  /**
   * Ranking de Procedimentos mais Rentáveis (Receita menos Custo)
   */
  async getProfitableProcedures(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 5
  ): Promise<ProfitableProcedureItem[]> {
    let where = `a.tenant_id = $1 AND a.status = 'COMPLETED' AND a.deleted_at IS NULL AND p.deleted_at IS NULL`;
    const params: any[] = [tenantId];

    if (startDate) {
      params.push(startDate);
      where += ` AND a.start_time >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate + ' 23:59:59+00');
      where += ` AND a.start_time <= $${params.length}`;
    }

    const safeLimit = Math.min(Math.max(limit, 3), 10);
    params.push(safeLimit);
    const limitPlaceholder = `$${params.length}`;

    const sql = `
      SELECT 
        p.id AS procedure_id,
        p.name AS procedure_name,
        COUNT(ai.id)::int AS completed_count,
        COALESCE(SUM(ai.effective_price_cents), 0)::int AS total_revenue_cents,
        COALESCE(SUM(COALESCE(ai.cost_cents, p.cost_cents, 0)), 0)::int AS total_cost_cents,
        (COALESCE(SUM(ai.effective_price_cents), 0) - COALESCE(SUM(COALESCE(ai.cost_cents, p.cost_cents, 0)), 0))::int AS total_profit_cents
      FROM appointment_items ai
      JOIN appointments a ON a.id = ai.appointment_id
      JOIN procedures p ON p.id = ai.procedure_id
      WHERE ${where}
      GROUP BY p.id, p.name
      ORDER BY total_profit_cents DESC, total_revenue_cents DESC, completed_count DESC
      LIMIT ${limitPlaceholder}
    `;

    const res = await this.db.query(sql, params);
    return res.rows.map((row) => {
      const revenue = Number(row.total_revenue_cents) || 0;
      const profit = Number(row.total_profit_cents) || 0;
      const margin = revenue > 0 ? Number(((profit / revenue) * 100).toFixed(2)) : 0;

      return {
        procedure_id: row.procedure_id,
        procedure_name: row.procedure_name,
        completed_count: Number(row.completed_count) || 0,
        total_revenue_cents: revenue,
        total_cost_cents: Number(row.total_cost_cents) || 0,
        total_profit_cents: profit,
        margin_percentage: margin,
      };
    });
  }

  /**
   * Pacientes Inativos por janela de dias
   */
  async getInactivePatients(
    tenantId: string,
    referenceDateInput?: string,
    inactiveDays: number = 180
  ): Promise<InactivePatientItem[]> {
    const refDateStr = referenceDateInput || new Date().toISOString().slice(0, 10);
    const refDate = new Date(refDateStr + 'T00:00:00.000Z');

    const cutoffDate = new Date(refDate.getTime());
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - inactiveDays);
    const cutoffDateIso = cutoffDate.toISOString();

    const sql = `
      SELECT * FROM (
        SELECT 
          p.id,
          p.name,
          p.whatsapp,
          p.created_at,
          MAX(a.start_time) AS last_appointment_date
        FROM patients p
        LEFT JOIN appointments a ON a.patient_id = p.id 
          AND a.status = 'COMPLETED' 
          AND a.deleted_at IS NULL
        WHERE p.tenant_id = $1
          AND p.is_active = true
          AND p.deleted_at IS NULL
          AND p.id NOT IN (
            SELECT DISTINCT patient_id FROM appointments 
            WHERE tenant_id = $1 
              AND status IN ('PENDING', 'CONFIRMED') 
              AND start_time > $3 
              AND deleted_at IS NULL
          )
        GROUP BY p.id, p.name, p.whatsapp, p.created_at
      ) sub
      WHERE (sub.last_appointment_date IS NOT NULL AND sub.last_appointment_date < $2)
         OR (sub.last_appointment_date IS NULL AND sub.created_at < $2)
      ORDER BY sub.last_appointment_date ASC, sub.name ASC
    `;

    const res = await this.db.query(sql, [tenantId, cutoffDateIso, refDateStr]);

    return res.rows.map((r) => {
      const lastDate = r.last_appointment_date ? new Date(r.last_appointment_date) : null;
      const refTime = refDate.getTime();
      const lastTime = lastDate ? lastDate.getTime() : new Date(r.created_at).getTime();
      const daysInactive = Math.max(0, Math.floor((refTime - lastTime) / (1000 * 60 * 60 * 24)));

      return {
        id: r.id,
        name: r.name,
        whatsapp: r.whatsapp,
        last_appointment_date: r.last_appointment_date ? String(r.last_appointment_date) : null,
        never_consulted: !r.last_appointment_date,
        days_inactive: daysInactive,
      };
    });
  }

  /**
   * Histórico Completo de Consultas de um Paciente
   */
  async getPatientAppointmentsHistory(
    tenantId: string,
    patientId: string
  ): Promise<PatientAppointmentHistoryItem[]> {
    // 1. Busca consultas do paciente
    const appSql = `
      SELECT 
        a.id,
        a.start_time,
        a.end_time,
        a.status,
        a.notes,
        a.is_overtime,
        a.total_charged_cents
      FROM appointments a
      WHERE a.tenant_id = $1 
        AND a.patient_id = $2 
        AND a.deleted_at IS NULL
      ORDER BY a.start_time DESC
    `;
    const appRes = await this.db.query(appSql, [tenantId, patientId]);
    if (appRes.rows.length === 0) {
      return [];
    }

    const appointmentIds = appRes.rows.map((r) => r.id);

    const placeholders = appointmentIds.map((_, i) => `$${i + 1}`).join(', ');

    // 2. Busca itens de procedimento das consultas
    const itemsSql = `
      SELECT 
        ai.appointment_id,
        p.id AS procedure_id,
        p.name,
        ai.effective_price_cents,
        ai.duration_minutes
      FROM appointment_items ai
      JOIN procedures p ON p.id = ai.procedure_id
      WHERE ai.appointment_id IN (${placeholders})
    `;
    const itemsRes = await this.db.query(itemsSql, appointmentIds);

    // 3. Busca transações financeiras vinculadas
    const finPlaceholders = appointmentIds.map((_, i) => `$${i + 2}`).join(', ');
    const finSql = `
      SELECT 
        appointment_id,
        status
      FROM financial_transactions
      WHERE tenant_id = $1 
        AND appointment_id IN (${finPlaceholders}) 
        AND is_active = true 
        AND deleted_at IS NULL
    `;
    const finRes = await this.db.query(finSql, [tenantId, ...appointmentIds]);

    const proceduresByApp = new Map<string, any[]>();
    for (const item of itemsRes.rows) {
      const list = proceduresByApp.get(item.appointment_id) || [];
      list.push({
        procedure_id: item.procedure_id,
        name: item.name,
        effective_price_cents: Number(item.effective_price_cents) || 0,
        duration_minutes: Number(item.duration_minutes) || 0,
      });
      proceduresByApp.set(item.appointment_id, list);
    }

    const finByApp = new Map<string, string>();
    for (const fin of finRes.rows) {
      finByApp.set(fin.appointment_id, fin.status);
    }

    return appRes.rows.map((row) => {
      const finStatus = finByApp.get(row.id);
      let mappedFinStatus: 'PAID' | 'PENDING' | 'NONE' = 'NONE';
      if (finStatus === 'PAID') mappedFinStatus = 'PAID';
      else if (finStatus === 'PENDING') mappedFinStatus = 'PENDING';

      return {
        id: row.id,
        start_time: String(row.start_time),
        end_time: String(row.end_time),
        status: row.status,
        notes: row.notes || null,
        is_overtime: Boolean(row.is_overtime),
        total_charged_cents: Number(row.total_charged_cents) || 0,
        procedures: proceduresByApp.get(row.id) || [],
        financial_status: mappedFinStatus,
      };
    });
  }
}
