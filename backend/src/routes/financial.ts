import { Router, type Request, type Response } from 'express';
import { FinancialRepository } from '../repositories/financial-repository.js';
import { validateInstallmentPlan } from '../financial/installments.js';

export const financialRouter = Router();
const financialRepo = new FinancialRepository();

// Helper para extrair tenantId via JWT ou header x-tenant-id
function getTenantId(req: Request, res: Response): string | null {
  const tenantId = req.tenantId || (req.headers['x-tenant-id'] as string);
  if (!tenantId) {
    res.status(401).json({ error: 'Token de autenticação ou tenant_id não fornecido.' });
    return null;
  }
  return tenantId;
}

/**
 * Conclusão de Atendimento e Checkout Financeiro (AC-027, AC-028, AC-029, AC-030, AC-031)
 * POST /api/financial/checkout
 */
financialRouter.post('/checkout', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const { appointmentId, items, discount, paymentPlan } = req.body;

    if (!appointmentId) {
      res.status(400).json({ error: 'appointmentId é obrigatório' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Pelo menos um procedimento confirmado é obrigatório para o checkout' });
      return;
    }

    if (!paymentPlan || typeof paymentPlan.installmentsCount !== 'number') {
      res.status(400).json({ error: 'paymentPlan com installmentsCount é obrigatório' });
      return;
    }

    const result = await financialRepo.checkoutAppointment({
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
    res.status(500).json({ error: err.message });
  }
});

/**
 * Baixa / Quitação em Lote de Parcelas Pendentes (AC-032)
 * POST /api/financial/settle-batch
 */
financialRouter.post('/settle-batch', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const { transactionIds, paymentMethod, paymentDate } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      res.status(400).json({ error: 'transactionIds deve ser um array não vazio' });
      return;
    }

    const settledCount = await financialRepo.settleBatch(
      tenantId,
      transactionIds,
      paymentMethod || 'PIX',
      paymentDate || new Date().toISOString().slice(0, 10)
    );

    res.status(200).json({
      status: 'success',
      settledCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Registro de Despesas Rápidas do Consultório (AC-033)
 * Suporta despesas já pagas (status PAID) ou a vencer no futuro (status PENDING - Opção B)
 * POST /api/financial/expenses
 */
financialRouter.post('/expenses', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const { category, description, amountCents, status, paymentMethod, paymentDate, dueDate } = req.body;

    if (!category) {
      res.status(400).json({ error: 'Categoria da despesa é obrigatória' });
      return;
    }

    if (typeof amountCents !== 'number' || amountCents <= 0) {
      res.status(400).json({ error: 'amountCents deve ser um número maior que zero' });
      return;
    }

    const txStatus = status === 'PENDING' ? 'PENDING' : 'PAID';
    const effectiveDueDate = dueDate || paymentDate || new Date().toISOString().slice(0, 10);
    const effectivePaymentDate = txStatus === 'PAID' ? (paymentDate || effectiveDueDate) : null;

    const created = await financialRepo.createTransaction({
      tenant_id: tenantId,
      type: 'EXPENSE',
      category,
      description: description || null,
      amount_cents: amountCents,
      payment_method: paymentMethod || null,
      status: txStatus,
      due_date: effectiveDueDate,
      payment_date: effectivePaymentDate,
      installment_number: 1,
      total_installments: 1,
    });

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Soft Delete / Cancelamento de Transação Financeira (AC-034)
 * DELETE /api/financial/transactions/:id
 */
financialRouter.delete('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const success = await financialRepo.softDelete(tenantId, req.params.id);

    if (!success) {
      res.status(404).json({ error: 'Transação não encontrada ou já desativada' });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Transação desativada com sucesso (Soft Delete contábil preservado)',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
