/**
 * Períodos de tempo padronizados suportados pelos relatórios analíticos
 */
export type ReportPeriod = 'today' | 'this_month' | 'last_30_days' | 'all';

/**
 * Filtro de consulta para relatórios baseados em data
 */
export interface ReportFilterQuery {
  period?: ReportPeriod;
  startDate?: string;
  endDate?: string;
}

/**
 * Relatório de Faltas (No-Show)
 */
export interface NoShowReport {
  total_appointments: number;
  no_show_count: number;
  no_show_rate: number; // Porcentagem com 2 casas decimais (ex: 28.57)
  summary: string; // Ex: "4 de 14 consultas"
  lost_estimated_cents: number;
  lost_estimated_reais: string; // Formatado para exibição amigável (ex: "R$ 300,00")
}

/**
 * Resultado Líquido — DRE Simplificado
 */
export interface DREReport {
  total_income_paid_cents: number;
  total_expense_paid_cents: number;
  net_profit_cents: number;
  margin_percentage: number; // Margem líquida em % (ex: 45.50)
}

/**
 * Recebíveis Futuros (Parcelas)
 */
export interface ReceivablesBreakdown {
  window_0_30_cents: number;
  window_31_60_cents: number;
  window_61_90_cents: number;
}

export interface ReceivablesReport {
  reference_date: string;
  pending_next_30_cents: number;
  pending_next_60_cents: number; // Acumulado até 60 dias
  pending_next_90_cents: number; // Acumulado até 90 dias
  breakdown: ReceivablesBreakdown;
}

/**
 * Item do Ranking de Procedimentos mais Rentáveis
 */
export interface ProfitableProcedureItem {
  procedure_id: string;
  procedure_name: string;
  completed_count: number;
  total_revenue_cents: number;
  total_cost_cents: number;
  total_profit_cents: number;
  margin_percentage: number; // Margem percentual do procedimento
}

export interface ProfitableProceduresReport {
  period: ReportPeriod | 'custom';
  items: ProfitableProcedureItem[];
}

/**
 * Item da Lista de Pacientes Inativos
 */
export interface InactivePatientItem {
  id: string;
  name: string;
  whatsapp: string;
  last_appointment_date: string | null;
  never_consulted: boolean;
  days_inactive: number;
}

export interface InactivePatientsReport {
  filter_months: 3 | 6;
  cutoff_date: string;
  total_inactive: number;
  patients: InactivePatientItem[];
}

/**
 * Item de Procedimento em Histórico de Consulta
 */
export interface PatientHistoryProcedureItem {
  procedure_id: string;
  name: string;
  effective_price_cents: number;
  duration_minutes: number;
}

/**
 * Consulta no Histórico do Paciente
 */
export interface PatientAppointmentHistoryItem {
  id: string;
  start_time: string;
  end_time: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes: string | null;
  is_overtime: boolean;
  total_charged_cents: number;
  procedures: PatientHistoryProcedureItem[];
  financial_status: 'PAID' | 'PENDING' | 'NONE';
}

/**
 * Relatório de Histórico Completo de Consultas por Paciente
 */
export interface PatientHistorySummary {
  total_appointments: number;
  completed_count: number;
  cancelled_count: number;
  no_show_count: number;
  total_spent_cents: number;
}

export interface PatientHistoryReport {
  patient_id: string;
  patient_name: string;
  summary: PatientHistorySummary;
  appointments: PatientAppointmentHistoryItem[];
}
