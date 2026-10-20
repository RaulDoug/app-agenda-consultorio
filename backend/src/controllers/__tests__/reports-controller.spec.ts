import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportsController } from '../reports-controller.js';
import type { ReportsService } from '../../services/reports-service.js';

describe('ReportsController — Tratamento HTTP e Códigos de Status', () => {
  let controller: ReportsController;
  let mockService: any;
  let req: any;
  let res: any;

  const tenantId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    mockService = {
      getNoShowReport: vi.fn(),
      getDREReport: vi.fn(),
      getReceivablesReport: vi.fn(),
      getProfitableProceduresReport: vi.fn(),
      getInactivePatientsReport: vi.fn(),
      getPatientHistoryReport: vi.fn(),
    };

    controller = new ReportsController(mockService as unknown as ReportsService);

    req = {
      tenantId,
      query: {},
      params: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it('deve retornar 401 se tenantId não estiver presente na requisição', async () => {
    req.tenantId = undefined;
    await controller.getNoShow(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('deve retornar 200 com métricas de No-Show', async () => {
    mockService.getNoShowReport.mockResolvedValue({ total_appointments: 10, no_show_count: 2 });
    req.query = { period: 'this_month' };

    await controller.getNoShow(req, res);
    expect(mockService.getNoShowReport).toHaveBeenCalledWith(tenantId, { period: 'this_month' });
    expect(res.json).toHaveBeenCalledWith({ total_appointments: 10, no_show_count: 2 });
  });

  it('deve retornar 200 com DRE', async () => {
    mockService.getDREReport.mockResolvedValue({ net_profit_cents: 50000 });
    await controller.getDRE(req, res);
    expect(res.json).toHaveBeenCalledWith({ net_profit_cents: 50000 });
  });

  it('deve retornar 200 com Recebíveis', async () => {
    mockService.getReceivablesReport.mockResolvedValue({ pending_next_30_cents: 10000 });
    req.query = { referenceDate: '2026-10-18' };

    await controller.getReceivables(req, res);
    expect(mockService.getReceivablesReport).toHaveBeenCalledWith(tenantId, '2026-10-18');
    expect(res.json).toHaveBeenCalledWith({ pending_next_30_cents: 10000 });
  });

  it('deve retornar 200 com Procedimentos Rentáveis', async () => {
    mockService.getProfitableProceduresReport.mockResolvedValue({ items: [] });
    req.query = { limit: '3' };

    await controller.getProfitableProcedures(req, res);
    expect(mockService.getProfitableProceduresReport).toHaveBeenCalledWith(tenantId, { period: undefined }, 3);
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });

  it('deve retornar 200 com Pacientes Inativos', async () => {
    mockService.getInactivePatientsReport.mockResolvedValue({ total_inactive: 2 });
    req.query = { months: '3', referenceDate: '2026-10-18' };

    await controller.getInactivePatients(req, res);
    expect(mockService.getInactivePatientsReport).toHaveBeenCalledWith(tenantId, 3, '2026-10-18');
    expect(res.json).toHaveBeenCalledWith({ total_inactive: 2 });
  });

  it('deve retornar 404 quando o paciente não for encontrado no histórico', async () => {
    req.params = { patientId: 'pat-404' };
    mockService.getPatientHistoryReport.mockRejectedValue(new Error('Paciente não encontrado.'));

    await controller.getPatientHistory(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Paciente não encontrado.' });
  });
});
