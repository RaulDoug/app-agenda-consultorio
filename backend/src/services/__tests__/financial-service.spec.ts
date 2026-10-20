import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialService } from '../financial-service.js';
import type { FinancialRepository } from '../../repositories/financial-repository.js';

describe('FinancialService — Regras de Negócio e Casos de Uso', () => {
  let service: FinancialService;
  let mockRepo: Partial<FinancialRepository>;

  beforeEach(() => {
    mockRepo = {
      checkoutAppointment: vi.fn(),
      createTransaction: vi.fn(),
      findById: vi.fn(),
      updateTransaction: vi.fn(),
      updateInstallmentsBatch: vi.fn(),
      checkIncomeDeletionAllowed: vi.fn(),
      softDelete: vi.fn(),
      settleBatch: vi.fn(),
      listTransactions: vi.fn(),
      getMetrics: vi.fn(),
    };
    service = new FinancialService(mockRepo as FinancialRepository);
  });

  describe('checkout', () => {
    it('deve rejeitar checkout sem appointmentId', async () => {
      await expect(
        service.checkout('tenant-1', {
          appointmentId: '',
          items: [{ procedureId: 'p1', priceCents: 100 }],
          paymentPlan: { installmentsCount: 1 },
        } as any)
      ).rejects.toThrow('appointmentId é obrigatório para o checkout.');
    });

    it('deve rejeitar checkout sem procedimentos selecionados', async () => {
      await expect(
        service.checkout('tenant-1', {
          appointmentId: 'app-1',
          items: [],
          paymentPlan: { installmentsCount: 1 },
        } as any)
      ).rejects.toThrow('Pelo menos um procedimento confirmado é obrigatório para o checkout.');
    });
  });

  describe('createExpense', () => {
    it('deve rejeitar despesa sem categoria', async () => {
      await expect(
        service.createExpense('tenant-1', {
          category: '',
          amount_cents: 1000,
          due_date: '2026-11-01',
        })
      ).rejects.toThrow('Categoria da despesa é obrigatória.');
    });

    it('deve rejeitar despesa com valor menor ou igual a zero', async () => {
      await expect(
        service.createExpense('tenant-1', {
          category: 'Aluguel',
          amount_cents: 0,
          due_date: '2026-11-01',
        })
      ).rejects.toThrow('amount_cents deve ser um número maior que zero.');
    });

    it('D-04: despesa recorrente de 3 meses deve criar 3 parcelas, primeira com status informado e demais PENDING', async () => {
      (mockRepo.createTransaction as any).mockImplementation((dto: any) => Promise.resolve({ id: 'tx-1', ...dto }));

      const res = await service.createExpense('tenant-1', {
        category: 'Software Odonto',
        amount_cents: 15000,
        status: 'PAID',
        due_date: '2026-11-01',
        is_recurring: true,
        recurrence_months: 3,
      });

      expect(Array.isArray(res)).toBe(true);
      const list = res as any[];
      expect(list).toHaveLength(3);
      expect(mockRepo.createTransaction).toHaveBeenCalledTimes(3);

      // Parcela 1: PAID
      expect(list[0].status).toBe('PAID');
      expect(list[0].due_date).toBe('2026-11-01');

      // Parcela 2: PENDING
      expect(list[1].status).toBe('PENDING');
      expect(list[1].payment_date).toBeNull();

      // Parcela 3: PENDING
      expect(list[2].status).toBe('PENDING');
      expect(list[2].payment_date).toBeNull();
    });

    it('D-04: despesa parcelada com divisão deve distribuir valor e centavos residuais', async () => {
      (mockRepo.createTransaction as any).mockImplementation((dto: any) => Promise.resolve({ id: 'tx-1', ...dto }));

      // 10000 centavos / 3 parcelas = 3333 centavos + 1 centavo residual na parcela 1
      const res = await service.createExpense('tenant-1', {
        category: 'Compressor',
        amount_cents: 10000,
        due_date: '2026-11-01',
        installments_count: 3,
        installment_division_mode: 'DIVIDE',
      });

      const list = res as any[];
      expect(list).toHaveLength(3);
      expect(list[0].amount_cents).toBe(3334);
      expect(list[1].amount_cents).toBe(3333);
      expect(list[2].amount_cents).toBe(3333);
    });
  });

  describe('deleteTransaction e Proteção D-06', () => {
    it('D-06: deve lançar erro LINKED_COMPLETED_APPOINTMENT com status 400 se checkIncomeDeletionAllowed for false', async () => {
      (mockRepo.findById as any).mockResolvedValue({ id: 'tx-1', type: 'INCOME' });
      (mockRepo.checkIncomeDeletionAllowed as any).mockResolvedValue(false);

      await expect(service.deleteTransaction('tenant-1', 'tx-1')).rejects.toMatchObject({
        statusCode: 400,
        code: 'LINKED_COMPLETED_APPOINTMENT',
      });
    });

    it('deve realizar exclusão com sucesso quando permitida', async () => {
      (mockRepo.findById as any).mockResolvedValue({ id: 'tx-2', type: 'EXPENSE' });
      (mockRepo.checkIncomeDeletionAllowed as any).mockResolvedValue(true);
      (mockRepo.softDelete as any).mockResolvedValue(true);

      await expect(service.deleteTransaction('tenant-1', 'tx-2')).resolves.toBeUndefined();
      expect(mockRepo.softDelete).toHaveBeenCalledWith('tenant-1', 'tx-2');
    });
  });

  describe('updateTransaction e D-03', () => {
    it('D-03: deve atualizar em lote parcelas do grupo quando scope = ALL', async () => {
      (mockRepo.findById as any).mockResolvedValue({
        id: 'tx-1',
        group_id: 'grp-1',
        installment_number: 2,
      });
      (mockRepo.updateInstallmentsBatch as any).mockResolvedValue(2);
      (mockRepo.updateTransaction as any).mockResolvedValue({ id: 'tx-1', amount_cents: 2000 });

      await service.updateTransaction('tenant-1', 'tx-1', {
        amount_cents: 2000,
        scope: 'ALL',
      });

      expect(mockRepo.updateInstallmentsBatch).toHaveBeenCalledWith(
        'tenant-1',
        'grp-1',
        2,
        expect.objectContaining({ amount_cents: 2000 })
      );
      expect(mockRepo.updateTransaction).toHaveBeenCalled();
    });
  });
});
