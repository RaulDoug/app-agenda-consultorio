import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportsService } from '../reports-service.js';
import type { ReportsRepository } from '../../repositories/reports-repository.js';
import type { PatientRepository } from '../../repositories/patient-repository.js';

describe('ReportsService — Lógica de Negócios, Períodos e Agregações', () => {
  let reportsService: ReportsService;
  let mockReportsRepo: any;
  let mockPatientRepo: any;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const patientId = 'aaaaaaaa-1111-aaaa-1111-aaaaaaaaaaaa';

  beforeEach(() => {
    mockReportsRepo = {
      getNoShowStats: vi.fn(),
      getDREStats: vi.fn(),
      getReceivablesStats: vi.fn(),
      getProfitableProcedures: vi.fn(),
      getInactivePatients: vi.fn(),
      getPatientAppointmentsHistory: vi.fn(),
    };

    mockPatientRepo = {
      findById: vi.fn(),
    };

    reportsService = new ReportsService(
      mockReportsRepo as unknown as ReportsRepository,
      mockPatientRepo as unknown as PatientRepository
    );
  });

  describe('resolvePeriodRange', () => {
    it('deve resolver corretamente o período today', () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const range = reportsService.resolvePeriodRange('today');
      expect(range.startDate).toBe(todayStr);
      expect(range.endDate).toBe(todayStr);
    });

    it('deve resolver corretamente o período this_month', () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();

      const range = reportsService.resolvePeriodRange('this_month');
      expect(range.startDate).toBe(`${year}-${month}-01`);
      expect(range.endDate).toBe(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
    });

    it('deve resolver corretamente o período last_30_days', () => {
      const range = reportsService.resolvePeriodRange('last_30_days');
      expect(range.startDate).toBeDefined();
      expect(range.endDate).toBeDefined();

      const start = new Date(range.startDate! + 'T00:00:00.000Z');
      const end = new Date(range.endDate! + 'T00:00:00.000Z');
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);
    });

    it('deve retornar undefined para limites quando period = all', () => {
      const range = reportsService.resolvePeriodRange('all');
      expect(range.startDate).toBeUndefined();
      expect(range.endDate).toBeUndefined();
    });

    it('deve priorizar datas customizadas sobre o período', () => {
      const range = reportsService.resolvePeriodRange('today', '2026-05-01', '2026-05-15');
      expect(range.startDate).toBe('2026-05-01');
      expect(range.endDate).toBe('2026-05-15');
    });
  });

  describe('getNoShowReport', () => {
    it('deve formatar summary amigável e valor em reais formatado', async () => {
      mockReportsRepo.getNoShowStats.mockResolvedValue({
        total_appointments: 14,
        no_show_count: 4,
        no_show_rate: 28.57,
        lost_estimated_cents: 35000,
      });

      const report = await reportsService.getNoShowReport(tenantId, { period: 'this_month' });

      expect(report.total_appointments).toBe(14);
      expect(report.no_show_count).toBe(4);
      expect(report.no_show_rate).toBe(28.57);
      expect(report.summary).toBe('4 de 14 consultas');
      expect(report.lost_estimated_cents).toBe(35000);
      expect(report.lost_estimated_reais).toContain('350');
    });
  });

  describe('getDREReport', () => {
    it('deve calcular a margem de lucro percentual com 2 casas decimais', async () => {
      mockReportsRepo.getDREStats.mockResolvedValue({
        total_income_paid_cents: 100000,
        total_expense_paid_cents: 40000,
        net_profit_cents: 60000,
      });

      const dre = await reportsService.getDREReport(tenantId, { period: 'last_30_days' });

      expect(dre.total_income_paid_cents).toBe(100000);
      expect(dre.total_expense_paid_cents).toBe(40000);
      expect(dre.net_profit_cents).toBe(60000);
      expect(dre.margin_percentage).toBe(60.0);
    });

    it('deve retornar margem 0 quando a receita for 0', async () => {
      mockReportsRepo.getDREStats.mockResolvedValue({
        total_income_paid_cents: 0,
        total_expense_paid_cents: 10000,
        net_profit_cents: -10000,
      });

      const dre = await reportsService.getDREReport(tenantId);
      expect(dre.margin_percentage).toBe(0);
    });
  });

  describe('getReceivablesReport', () => {
    it('deve repassar a projeção retornada pelo repositório', async () => {
      const mockResult = {
        reference_date: '2026-10-18',
        pending_next_30_cents: 40000,
        pending_next_60_cents: 100000,
        pending_next_90_cents: 180000,
        breakdown: {
          window_0_30_cents: 40000,
          window_31_60_cents: 60000,
          window_61_90_cents: 80000,
        },
      };
      mockReportsRepo.getReceivablesStats.mockResolvedValue(mockResult);

      const res = await reportsService.getReceivablesReport(tenantId, '2026-10-18');
      expect(res).toEqual(mockResult);
    });
  });

  describe('getProfitableProceduresReport', () => {
    it('deve retornar a lista de procedimentos com o período identificado', async () => {
      const items = [
        {
          procedure_id: 'proc-1',
          procedure_name: 'Implante',
          completed_count: 5,
          total_revenue_cents: 500000,
          total_cost_cents: 150000,
          total_profit_cents: 350000,
          margin_percentage: 70,
        },
      ];
      mockReportsRepo.getProfitableProcedures.mockResolvedValue(items);

      const report = await reportsService.getProfitableProceduresReport(tenantId, { period: 'this_month' }, 5);
      expect(report.period).toBe('this_month');
      expect(report.items).toHaveLength(1);
      expect(report.items[0].procedure_name).toBe('Implante');
    });
  });

  describe('getInactivePatientsReport', () => {
    it('deve converter 3 meses em 90 dias e 6 meses em 180 dias', async () => {
      mockReportsRepo.getInactivePatients.mockResolvedValue([
        {
          id: 'pat-1',
          name: 'João Inativo',
          whatsapp: '5511999990000',
          last_appointment_date: '2026-05-01',
          never_consulted: false,
          days_inactive: 160,
        },
      ]);

      const report = await reportsService.getInactivePatientsReport(tenantId, 6, '2026-10-18');
      expect(mockReportsRepo.getInactivePatients).toHaveBeenCalledWith(tenantId, '2026-10-18', 180);
      expect(report.filter_months).toBe(6);
      expect(report.total_inactive).toBe(1);
      expect(report.patients[0].name).toBe('João Inativo');
    });
  });

  describe('getPatientHistoryReport', () => {
    it('deve rejeitar se o paciente não existir no tenant', async () => {
      mockPatientRepo.findById.mockResolvedValue(null);

      await expect(
        reportsService.getPatientHistoryReport(tenantId, patientId)
      ).rejects.toThrow('Paciente não encontrado.');
    });

    it('deve retornar o histórico e calcular o resumo estatístico do paciente', async () => {
      mockPatientRepo.findById.mockResolvedValue({ id: patientId, name: 'Ana Paciente' });
      mockReportsRepo.getPatientAppointmentsHistory.mockResolvedValue([
        {
          id: 'app-1',
          start_time: '2026-10-01 10:00:00+00',
          end_time: '2026-10-01 10:30:00+00',
          status: 'COMPLETED',
          notes: 'Tudo ok',
          is_overtime: false,
          total_charged_cents: 25000,
          procedures: [{ procedure_id: 'proc-1', name: 'Restauração', effective_price_cents: 25000, duration_minutes: 30 }],
          financial_status: 'PAID',
        },
        {
          id: 'app-2',
          start_time: '2026-09-01 10:00:00+00',
          end_time: '2026-09-01 10:30:00+00',
          status: 'NO_SHOW',
          notes: null,
          is_overtime: false,
          total_charged_cents: 15000,
          procedures: [],
          financial_status: 'NONE',
        },
      ]);

      const report = await reportsService.getPatientHistoryReport(tenantId, patientId);
      expect(report.patient_id).toBe(patientId);
      expect(report.patient_name).toBe('Ana Paciente');
      expect(report.summary.total_appointments).toBe(2);
      expect(report.summary.completed_count).toBe(1);
      expect(report.summary.no_show_count).toBe(1);
      expect(report.summary.cancelled_count).toBe(0);
      expect(report.summary.total_spent_cents).toBe(25000);
      expect(report.appointments).toHaveLength(2);
    });
  });
});
