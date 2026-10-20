import type { Request, Response } from 'express';
import { FinancialService } from '../services/financial-service.js';

export class FinancialController {
  private service: FinancialService;

  constructor(service?: FinancialService) {
    this.service = service || new FinancialService();
  }

  checkout = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const { appointmentId, items, discount, paymentPlan } = req.body;

      const result = await this.service.checkout(tenantId, {
        tenantId,
        appointmentId,
        items,
        discount,
        paymentPlan,
      });

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (err: any) {
      if (err.message && err.message.includes('não pode ser maior ou igual ao valor total')) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  };

  createExpense = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const expense = await this.service.createExpense(tenantId, {
        category: req.body.category,
        description: req.body.description,
        amount_cents: req.body.amountCents ?? req.body.amount_cents,
        status: req.body.status,
        payment_method: req.body.paymentMethod ?? req.body.payment_method,
        payment_date: req.body.paymentDate ?? req.body.payment_date,
        due_date: req.body.dueDate ?? req.body.due_date,
        is_recurring: req.body.is_recurring ?? req.body.isRecurring,
        recurrence_months: req.body.recurrence_months ?? req.body.recurrenceMonths,
        installments_count: req.body.installments_count ?? req.body.installmentsCount,
        installment_division_mode: req.body.installment_division_mode ?? req.body.installmentDivisionMode,
      });

      res.status(201).json(expense);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const updated = await this.service.updateTransaction(tenantId, req.params.id as string, {
        category: req.body.category,
        description: req.body.description,
        amount_cents: req.body.amountCents ?? req.body.amount_cents,
        payment_method: req.body.paymentMethod ?? req.body.payment_method,
        status: req.body.status,
        due_date: req.body.dueDate ?? req.body.due_date,
        payment_date: req.body.paymentDate ?? req.body.payment_date,
        scope: req.body.scope,
      });

      res.json(updated);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      await this.service.deleteTransaction(tenantId, req.params.id as string);

      res.status(200).json({
        status: 'success',
        message: 'Transação desativada com sucesso (Soft Delete contábil preservado)',
      });
    } catch (err: any) {
      if (err.code === 'LINKED_COMPLETED_APPOINTMENT') {
        res.status(400).json({
          error: err.message,
          code: err.code,
        });
        return;
      }
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  };

  settleBatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const { transactionIds, paymentMethod, paymentDate } = req.body;

      const settledCount = await this.service.settleBatch(
        tenantId,
        transactionIds,
        paymentMethod,
        paymentDate
      );

      res.status(200).json({
        status: 'success',
        settledCount,
      });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const { startDate, endDate, status, type, category } = req.query;

      const transactions = await this.service.listTransactions(tenantId, {
        startDate: typeof startDate === 'string' ? startDate : undefined,
        endDate: typeof endDate === 'string' ? endDate : undefined,
        status: typeof status === 'string' ? (status as any) : undefined,
        type: typeof type === 'string' ? (type as any) : undefined,
        category: typeof category === 'string' ? category : undefined,
      });

      res.status(200).json(transactions);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        error: 'Erro ao listar transações financeiras.',
        details: err.message,
      });
    }
  };

  getMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const { period, startDate, endDate } = req.query;

      const metrics = await this.service.getMetrics(
        tenantId,
        typeof period === 'string' ? (period as any) : 'this_month',
        startDate && endDate
          ? { startDate: String(startDate), endDate: String(endDate) }
          : undefined
      );

      res.json(metrics);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  };
}
