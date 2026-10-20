import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialController } from '../financial-controller.js';
import type { FinancialService } from '../../services/financial-service.js';

describe('FinancialController — Tratamento de Respostas e Erros HTTP', () => {
  let controller: FinancialController;
  let mockService: Partial<FinancialService>;
  let req: any;
  let res: any;

  beforeEach(() => {
    mockService = {
      checkout: vi.fn(),
      createExpense: vi.fn(),
      updateTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      settleBatch: vi.fn(),
      listTransactions: vi.fn(),
      getMetrics: vi.fn(),
    };
    controller = new FinancialController(mockService as FinancialService);

    req = {
      tenantId: 'tenant-123',
      params: {},
      query: {},
      body: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it('checkout deve responder 200 com resultado', async () => {
    (mockService.checkout as any).mockResolvedValue({ appointmentId: 'app-1', totalAmountCents: 10000 });

    await controller.checkout(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success', appointmentId: 'app-1' }));
  });

  it('createExpense deve responder 201 com despesa criada', async () => {
    req.body = { category: 'Água', amount_cents: 8000 };
    (mockService.createExpense as any).mockResolvedValue({ id: 'tx-1', amount_cents: 8000 });

    await controller.createExpense(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'tx-1' }));
  });

  it('D-06: delete deve responder 400 com error code LINKED_COMPLETED_APPOINTMENT se bloqueado', async () => {
    req.params = { id: 'tx-receita' };
    const err: any = new Error('Receita vinculada a agendamento');
    err.statusCode = 400;
    err.code = 'LINKED_COMPLETED_APPOINTMENT';
    (mockService.deleteTransaction as any).mockRejectedValue(err);

    await controller.delete(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: err.message,
      code: 'LINKED_COMPLETED_APPOINTMENT',
    });
  });

  it('getMetrics deve responder 200 com métricas calculadas', async () => {
    req.query = { period: 'this_month' };
    (mockService.getMetrics as any).mockResolvedValue({
      period: 'this_month',
      income_paid_cents: 50000,
      expenses_paid_cents: 10000,
      net_profit_cents: 40000,
    });

    await controller.getMetrics(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ net_profit_cents: 40000 }));
  });
});
