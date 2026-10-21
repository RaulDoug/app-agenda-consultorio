import type {
  NoShowReport,
  DREReport,
  ReceivablesReport,
  ProfitableProceduresReport,
  InactivePatientsReport,
  PatientHistoryReport,
  ReportPeriod,
} from '@cliniassist/shared';

export interface ReportsApiClientConfig {
  baseUrl?: string;
  getToken?: () => string | null | undefined;
}

export class ReportsApiClient {
  private baseUrl: string;
  private getToken?: () => string | null | undefined;
  private staticToken?: string | null;

  constructor(config?: ReportsApiClientConfig) {
    this.baseUrl = config?.baseUrl || '';
    this.getToken = config?.getToken;
  }

  setToken(token: string | null | undefined): void {
    this.staticToken = token;
  }

  setTokenProvider(getToken: () => string | null | undefined): void {
    this.getToken = getToken;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = this.staticToken || (this.getToken ? this.getToken() : null);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async getNoShow(period: ReportPeriod = 'this_month'): Promise<NoShowReport> {
    const res = await fetch(`${this.baseUrl}/api/reports/no-show?period=${encodeURIComponent(period)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Erro ao buscar relatório No-Show: HTTP ${res.status}`);
    return await res.json();
  }

  async getDRE(period: ReportPeriod = 'this_month'): Promise<DREReport> {
    const res = await fetch(`${this.baseUrl}/api/reports/dre?period=${encodeURIComponent(period)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Erro ao buscar DRE: HTTP ${res.status}`);
    return await res.json();
  }

  async getReceivables(): Promise<ReceivablesReport> {
    const res = await fetch(`${this.baseUrl}/api/reports/receivables`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Erro ao buscar Recebíveis: HTTP ${res.status}`);
    return await res.json();
  }

  async getProfitableProcedures(period: ReportPeriod = 'this_month'): Promise<ProfitableProceduresReport> {
    const res = await fetch(`${this.baseUrl}/api/reports/procedures-profitability?period=${encodeURIComponent(period)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Erro ao buscar rentabilidade de procedimentos: HTTP ${res.status}`);
    return await res.json();
  }

  async getInactivePatients(months: 3 | 6 = 3): Promise<InactivePatientsReport> {
    const res = await fetch(`${this.baseUrl}/api/reports/inactive-patients?months=${months}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Erro ao buscar pacientes inativos: HTTP ${res.status}`);
    return await res.json();
  }

  async getPatientHistory(patientId: string): Promise<PatientHistoryReport> {
    const res = await fetch(`${this.baseUrl}/api/reports/patient-history/${encodeURIComponent(patientId)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Erro ao buscar histórico do paciente: HTTP ${res.status}`);
    return await res.json();
  }
}

export const reportsApiClient = new ReportsApiClient();
