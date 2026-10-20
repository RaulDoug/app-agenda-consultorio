import { ReportsRepository } from '../repositories/reports-repository.js';
import { PatientRepository } from '../repositories/patient-repository.js';
import type {
  ReportPeriod,
  ReportFilterQuery,
  NoShowReport,
  DREReport,
  ReceivablesReport,
  ProfitableProceduresReport,
  InactivePatientsReport,
  PatientHistoryReport,
} from '@cliniassist/shared';

export class ReportsService {
  constructor(
    private reportsRepo: ReportsRepository = new ReportsRepository(),
    private patientRepo: PatientRepository = new PatientRepository()
  ) {}

  /**
   * Resolução padronizada de intervalos de data a partir do período
   */
  resolvePeriodRange(
    period?: ReportPeriod,
    startDate?: string,
    endDate?: string
  ): { startDate?: string; endDate?: string } {
    if (startDate || endDate) {
      return { startDate, endDate };
    }

    const now = new Date();
    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

    switch (period) {
      case 'today': {
        const today = toDateStr(now);
        return { startDate: today, endDate: today };
      }
      case 'this_month': {
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
        return {
          startDate: `${year}-${month}-01`,
          endDate: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
        };
      }
      case 'last_30_days': {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
          startDate: toDateStr(thirtyDaysAgo),
          endDate: toDateStr(now),
        };
      }
      case 'all':
      default:
        return { startDate: undefined, endDate: undefined };
    }
  }

  /**
   * Relatório 1 — Faltas (No-Show)
   */
  async getNoShowReport(
    tenantId: string,
    filter?: ReportFilterQuery
  ): Promise<NoShowReport> {
    const { startDate, endDate } = this.resolvePeriodRange(
      filter?.period,
      filter?.startDate,
      filter?.endDate
    );

    const stats = await this.reportsRepo.getNoShowStats(tenantId, startDate, endDate);

    const formatCurrency = (cents: number): string => {
      const val = (cents / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `R$ ${val}`;
    };

    return {
      total_appointments: stats.total_appointments,
      no_show_count: stats.no_show_count,
      no_show_rate: stats.no_show_rate,
      summary: `${stats.no_show_count} de ${stats.total_appointments} consultas`,
      lost_estimated_cents: stats.lost_estimated_cents,
      lost_estimated_reais: formatCurrency(stats.lost_estimated_cents),
    };
  }

  /**
   * Relatório 2 — DRE Simplificado
   */
  async getDREReport(
    tenantId: string,
    filter?: ReportFilterQuery
  ): Promise<DREReport> {
    const { startDate, endDate } = this.resolvePeriodRange(
      filter?.period,
      filter?.startDate,
      filter?.endDate
    );

    const stats = await this.reportsRepo.getDREStats(tenantId, startDate, endDate);

    const margin =
      stats.total_income_paid_cents > 0
        ? Number(
            (
              (stats.net_profit_cents / stats.total_income_paid_cents) *
              100
            ).toFixed(2)
          )
        : 0;

    return {
      total_income_paid_cents: stats.total_income_paid_cents,
      total_expense_paid_cents: stats.total_expense_paid_cents,
      net_profit_cents: stats.net_profit_cents,
      margin_percentage: margin,
    };
  }

  /**
   * Relatório 3 — Recebíveis Futuros (Parcelas)
   */
  async getReceivablesReport(
    tenantId: string,
    referenceDate?: string
  ): Promise<ReceivablesReport> {
    return this.reportsRepo.getReceivablesStats(tenantId, referenceDate);
  }

  /**
   * Relatório 4 — Procedimentos Realizados Mais Rentáveis
   */
  async getProfitableProceduresReport(
    tenantId: string,
    filter?: ReportFilterQuery,
    limit: number = 5
  ): Promise<ProfitableProceduresReport> {
    const { startDate, endDate } = this.resolvePeriodRange(
      filter?.period,
      filter?.startDate,
      filter?.endDate
    );

    const items = await this.reportsRepo.getProfitableProcedures(
      tenantId,
      startDate,
      endDate,
      limit
    );

    return {
      period: filter?.period || (startDate || endDate ? 'custom' : 'all'),
      items,
    };
  }

  /**
   * Relatório 5 — Pacientes Inativos (3 ou 6 meses)
   */
  async getInactivePatientsReport(
    tenantId: string,
    months: 3 | 6 = 6,
    referenceDate?: string
  ): Promise<InactivePatientsReport> {
    const inactiveDays = months === 3 ? 90 : 180;
    const refDateStr = referenceDate || new Date().toISOString().slice(0, 10);
    const refDate = new Date(refDateStr + 'T00:00:00.000Z');

    const cutoffDate = new Date(refDate.getTime() - inactiveDays * 24 * 60 * 60 * 1000);
    const cutoffDateStr = cutoffDate.toISOString().slice(0, 10);

    const patients = await this.reportsRepo.getInactivePatients(
      tenantId,
      refDateStr,
      inactiveDays
    );

    return {
      filter_months: months,
      cutoff_date: cutoffDateStr,
      total_inactive: patients.length,
      patients,
    };
  }

  /**
   * Relatório 6 — Histórico Completo de Consultas por Paciente
   */
  async getPatientHistoryReport(
    tenantId: string,
    patientId: string
  ): Promise<PatientHistoryReport> {
    const patient = await this.patientRepo.findById(tenantId, patientId);
    if (!patient) {
      throw new Error('Paciente não encontrado.');
    }

    const appointments = await this.reportsRepo.getPatientAppointmentsHistory(
      tenantId,
      patientId
    );

    let completed = 0;
    let cancelled = 0;
    let noShow = 0;
    let totalSpent = 0;

    for (const app of appointments) {
      if (app.status === 'COMPLETED') {
        completed++;
        totalSpent += app.total_charged_cents;
      } else if (app.status === 'CANCELLED') {
        cancelled++;
      } else if (app.status === 'NO_SHOW') {
        noShow++;
      }
    }

    return {
      patient_id: patient.id,
      patient_name: patient.name,
      summary: {
        total_appointments: appointments.length,
        completed_count: completed,
        cancelled_count: cancelled,
        no_show_count: noShow,
        total_spent_cents: totalSpent,
      },
      appointments,
    };
  }
}
