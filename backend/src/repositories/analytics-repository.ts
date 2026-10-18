import { getDatabase, type IDatabase } from '../db/connection.js';

export interface NoShowMetrics {
  total_appointments: number;
  no_show_count: number;
  no_show_rate: number;
  lost_estimated_cents: number;
}

export interface DREMetrics {
  total_income_paid_cents: number;
  total_expense_paid_cents: number;
  net_profit_cents: number;
}

export interface CashFlowProjection {
  reference_date: string;
  pending_next_30_cents: number;
  pending_next_60_cents: number;
  pending_next_90_cents: number;
}

export interface ProcedureProfitabilityRankingItem {
  procedure_id: string;
  procedure_name: string;
  completed_count: number;
  total_effective_price_cents: number;
}

export interface InactivePatientItem {
  id: string;
  name: string;
  whatsapp: string;
  last_appointment_date: string;
}

export class AnalyticsRepository {
  private customDb?: IDatabase;

  constructor(db?: IDatabase) {
    this.customDb = db;
  }

  private get db(): IDatabase {
    return this.customDb || getDatabase();
  }

  /**
   * AC-035 & AC-036: Taxa de No-Show e Prejuízo Estimado com Proteção contra Divisão por Zero
   */
  async getNoShowMetrics(
    tenantId: string,
    startDate?: string,
    endDate?: string
  ): Promise<NoShowMetrics> {
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

    // 1. Contagem de agendamentos e faltas
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

    // Proteção contra divisão por zero (AC-036)
    const rate = total > 0 ? Number(((noShow / total) * 100).toFixed(2)) : 0;

    // 2. Cálculo do prejuízo financeiro das faltas
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
   * AC-037: DRE Simplificado no Período (Receitas pagas, Despesas pagas e Lucro Líquido)
   */
  async getDREMetrics(
    tenantId: string,
    startDate?: string,
    endDate?: string
  ): Promise<DREMetrics> {
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
   * AC-038: Projeção de Fluxo de Caixa (Contas a Receber em 30, 60 e 90 dias)
   */
  async getCashFlowProjection(
    tenantId: string,
    referenceDateInput?: string
  ): Promise<CashFlowProjection> {
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
        COALESCE(SUM(CASE WHEN due_date >= $2 AND due_date <= $5 THEN amount_cents ELSE 0 END), 0)::int AS next_90
      FROM financial_transactions
      WHERE tenant_id = $1 
        AND type = 'INCOME' 
        AND status = 'PENDING'
        AND is_active = true 
        AND deleted_at IS NULL
    `;

    const res = await this.db.query(sql, [tenantId, refDateStr, date30, date60, date90]);
    const r = res.rows[0] || {};

    return {
      reference_date: refDateStr,
      pending_next_30_cents: Number(r.next_30) || 0,
      pending_next_60_cents: Number(r.next_60) || 0,
      pending_next_90_cents: Number(r.next_90) || 0,
    };
  }

  /**
   * AC-039: Ranking de Procedimentos mais Lucrativos por Faturamento Efetivo
   */
  async getProcedureProfitabilityRanking(
    tenantId: string
  ): Promise<ProcedureProfitabilityRankingItem[]> {
    const sql = `
      SELECT 
        p.id AS procedure_id,
        p.name AS procedure_name,
        COUNT(DISTINCT a.id)::int AS completed_count,
        COALESCE(SUM(ai.effective_price_cents), 0)::int AS total_effective_price_cents
      FROM appointment_items ai
      JOIN appointments a ON a.id = ai.appointment_id
      JOIN procedures p ON p.id = ai.procedure_id
      WHERE a.tenant_id = $1
        AND a.status = 'COMPLETED'
        AND a.deleted_at IS NULL
        AND p.deleted_at IS NULL
      GROUP BY p.id, p.name
      ORDER BY total_effective_price_cents DESC, completed_count DESC
    `;

    const res = await this.db.query<ProcedureProfitabilityRankingItem>(sql, [tenantId]);
    return res.rows.map((row) => ({
      procedure_id: row.procedure_id,
      procedure_name: row.procedure_name,
      completed_count: Number(row.completed_count),
      total_effective_price_cents: Number(row.total_effective_price_cents),
    }));
  }

  /**
   * AC-040: Lista de Pacientes Inativos (> 180 dias sem retorno e sem consulta futura marcada)
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
      SELECT 
        p.id,
        p.name,
        p.whatsapp,
        MAX(a.start_time) AS last_appointment_date
      FROM patients p
      JOIN appointments a ON a.patient_id = p.id AND a.tenant_id = p.tenant_id
      WHERE p.tenant_id = $1
        AND p.is_active = true
        AND p.deleted_at IS NULL
        AND a.status = 'COMPLETED'
        AND a.deleted_at IS NULL
      GROUP BY p.id, p.name, p.whatsapp
      HAVING MAX(a.start_time) < $2
        AND NOT EXISTS (
          SELECT 1 FROM appointments fut
          WHERE fut.patient_id = p.id
            AND fut.tenant_id = p.tenant_id
            AND fut.deleted_at IS NULL
            AND fut.status IN ('PENDING', 'CONFIRMED')
            AND fut.start_time > $3
        )
      ORDER BY last_appointment_date ASC
    `;

    const res = await this.db.query(sql, [tenantId, cutoffDateIso, refDateStr]);
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      whatsapp: r.whatsapp,
      last_appointment_date: String(r.last_appointment_date),
    }));
  }
}
