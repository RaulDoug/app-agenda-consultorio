import {
  LocalAppointment,
  LocalAppointmentItem,
  LocalProcedure,
  LocalFinancialTransaction,
  LocalPatient,
} from '../../../db/types';
import { CashFilterPeriod, filterTransactionsByPeriod, calculateCashMetrics, CashMetrics } from './cash-calculator';

export interface NoShowMetrics {
  totalAppointments: number;
  noShowCount: number;
  noShowRate: number; // ex: 20.0 (%)
  lostEstimatedCents: number;
}

export interface ReceivablesProjection {
  pendingNext30Cents: number;
  pendingNext60Cents: number;
  pendingNext90Cents: number;
}

export interface ProcedureRankingItem {
  procedureId: string;
  name: string;
  completedCount: number;
  totalRevenueCents: number;
  averagePriceCents: number;
  percentageShare: number; // 0 - 100
}

export interface ReportsDashboardData {
  noShow: NoShowMetrics;
  dre: CashMetrics & { profitMarginPercent: number };
  projection: ReceivablesProjection;
  ranking: ProcedureRankingItem[];
}

export function filterAppointmentsByPeriod(
  appointments: LocalAppointment[],
  period: CashFilterPeriod
): LocalAppointment[] {
  if (period === 'all') return appointments;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (period === 'today') {
    return appointments.filter((app) => app.start_time.split('T')[0] === todayStr);
  }

  if (period === 'this_month') {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return appointments.filter((app) => {
      const d = new Date(app.start_time);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }

  if (period === 'last_30_days') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const minIso = thirtyDaysAgo.toISOString().split('T')[0];
    return appointments.filter((app) => {
      const targetDate = app.start_time.split('T')[0];
      return targetDate >= minIso && targetDate <= todayStr;
    });
  }

  return appointments;
}

export function calculateNoShowMetrics(
  appointments: LocalAppointment[],
  appointmentItems: LocalAppointmentItem[]
): NoShowMetrics {
  // Ignora cancelados
  const relevant = appointments.filter((a) => a.status !== 'CANCELLED');
  const totalAppointments = relevant.length;
  const noShowAppointments = relevant.filter((a) => a.status === 'NO_SHOW');
  const noShowCount = noShowAppointments.length;

  const noShowRate = totalAppointments > 0
    ? parseFloat(((noShowCount / totalAppointments) * 100).toFixed(1))
    : 0;

  const noShowAppIds = new Set(noShowAppointments.map((a) => a.id));
  let lostEstimatedCents = 0;
  for (const item of appointmentItems) {
    if (noShowAppIds.has(item.appointment_id)) {
      lostEstimatedCents += item.effective_price_cents;
    }
  }

  return {
    totalAppointments,
    noShowCount,
    noShowRate,
    lostEstimatedCents,
  };
}

export function calculateReceivablesProjection(
  transactions: LocalFinancialTransaction[],
  refDate: Date = new Date()
): ReceivablesProjection {
  const refTime = refDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const activePending = transactions.filter(
    (t) => t.is_active && !t.deleted_at && t.type === 'INCOME' && t.status === 'PENDING'
  );

  let pendingNext30Cents = 0;
  let pendingNext60Cents = 0;
  let pendingNext90Cents = 0;

  for (const t of activePending) {
    const dueDate = new Date(t.due_date);
    const diffDays = Math.ceil((dueDate.getTime() - refTime) / dayMs);

    // Considera apenas títulos com vencimento futuro ou hoje
    if (diffDays >= 0) {
      if (diffDays <= 30) {
        pendingNext30Cents += t.amount_cents;
      }
      if (diffDays <= 60) {
        pendingNext60Cents += t.amount_cents;
      }
      if (diffDays <= 90) {
        pendingNext90Cents += t.amount_cents;
      }
    }
  }

  return {
    pendingNext30Cents,
    pendingNext60Cents,
    pendingNext90Cents,
  };
}

export function calculateProceduresRanking(
  appointments: LocalAppointment[],
  appointmentItems: LocalAppointmentItem[],
  procedures: LocalProcedure[]
): ProcedureRankingItem[] {
  // Considera apenas agendamentos COMPLETED
  const completedAppIds = new Set(
    appointments.filter((a) => a.status === 'COMPLETED').map((a) => a.id)
  );

  const procMap = new Map(procedures.map((p) => [p.id, p.name]));
  const aggMap = new Map<string, { count: number; totalCents: number }>();

  let grandTotalCents = 0;

  for (const item of appointmentItems) {
    if (completedAppIds.has(item.appointment_id)) {
      const current = aggMap.get(item.procedure_id) || { count: 0, totalCents: 0 };
      current.count += 1;
      current.totalCents += item.effective_price_cents;
      aggMap.set(item.procedure_id, current);
      grandTotalCents += item.effective_price_cents;
    }
  }

  const ranking: ProcedureRankingItem[] = [];
  for (const [procId, data] of aggMap.entries()) {
    const name = procMap.get(procId) || 'Procedimento';
    const averagePriceCents = data.count > 0 ? Math.round(data.totalCents / data.count) : 0;
    const percentageShare = grandTotalCents > 0
      ? parseFloat(((data.totalCents / grandTotalCents) * 100).toFixed(1))
      : 0;

    ranking.push({
      procedureId: procId,
      name,
      completedCount: data.count,
      totalRevenueCents: data.totalCents,
      averagePriceCents,
      percentageShare,
    });
  }

  return ranking.sort((a, b) => b.totalRevenueCents - a.totalRevenueCents);
}

export function calculateReportsDashboard(
  appointments: LocalAppointment[],
  appointmentItems: LocalAppointmentItem[],
  procedures: LocalProcedure[],
  transactions: LocalFinancialTransaction[],
  patients: LocalPatient[],
  period: CashFilterPeriod = 'this_month',
  referenceDate: Date = new Date()
): ReportsDashboardData {
  const filteredApps = filterAppointmentsByPeriod(appointments, period);
  const filteredTxs = filterTransactionsByPeriod(transactions, period);

  const noShow = calculateNoShowMetrics(filteredApps, appointmentItems);
  const baseCash = calculateCashMetrics(filteredTxs);

  const profitMarginPercent = baseCash.totalIncomePaidCents > 0
    ? parseFloat(((baseCash.netProfitCents / baseCash.totalIncomePaidCents) * 100).toFixed(1))
    : 0;

  const dre = {
    ...baseCash,
    profitMarginPercent,
  };

  const projection = calculateReceivablesProjection(transactions, referenceDate);
  const ranking = calculateProceduresRanking(filteredApps, appointmentItems, procedures);

  return {
    noShow,
    dre,
    projection,
    ranking,
  };
}
