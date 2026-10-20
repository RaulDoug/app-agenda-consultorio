import {
  FinancialRepository,
  type FinancialTransaction,
  type CheckoutParams,
  type ListTransactionsFilters,
  type FinancialMetricsResult,
} from '../repositories/financial-repository.js';
import type {
  CreateExpenseDTO,
  UpdateTransactionDTO,
} from '@cliniassist/shared';

export class FinancialService {
  private repo: FinancialRepository;

  constructor(repo?: FinancialRepository) {
    this.repo = repo || new FinancialRepository();
  }

  async checkout(tenantId: string, params: CheckoutParams) {
    if (!params.appointmentId) {
      const error: any = new Error('appointmentId é obrigatório para o checkout.');
      error.statusCode = 400;
      throw error;
    }

    if (!params.items || !Array.isArray(params.items) || params.items.length === 0) {
      const error: any = new Error('Pelo menos um procedimento confirmado é obrigatório para o checkout.');
      error.statusCode = 400;
      throw error;
    }

    if (!params.paymentPlan || typeof params.paymentPlan.installmentsCount !== 'number') {
      const error: any = new Error('paymentPlan com installmentsCount é obrigatório.');
      error.statusCode = 400;
      throw error;
    }

    return this.repo.checkoutAppointment({
      ...params,
      tenantId,
    });
  }

  async createExpense(tenantId: string, data: CreateExpenseDTO): Promise<FinancialTransaction | FinancialTransaction[]> {
    if (!data.category || data.category.trim() === '') {
      const error: any = new Error('Categoria da despesa é obrigatória.');
      error.statusCode = 400;
      throw error;
    }

    if (typeof data.amount_cents !== 'number' || data.amount_cents <= 0) {
      const error: any = new Error('amount_cents deve ser um número maior que zero.');
      error.statusCode = 400;
      throw error;
    }

    const txStatus = data.status === 'PENDING' ? 'PENDING' : 'PAID';
    const baseDueDate = data.due_date || data.payment_date || new Date().toISOString().slice(0, 10);
    const basePaymentDate = txStatus === 'PAID' ? (data.payment_date || baseDueDate) : null;

    // Cenário 1: Despesa Recorrente por N meses (D-04)
    if (data.is_recurring && data.recurrence_months && data.recurrence_months > 1) {
      const count = data.recurrence_months;
      const groupId = crypto.randomUUID();
      const transactions: FinancialTransaction[] = [];

      for (let i = 0; i < count; i++) {
        const dueDate = this.addMonths(baseDueDate, i);
        const isFirst = i === 0;
        const status = isFirst ? txStatus : 'PENDING';
        const paymentDate = isFirst ? basePaymentDate : null;

        const tx = await this.repo.createTransaction({
          tenant_id: tenantId,
          type: 'EXPENSE',
          category: data.category.trim(),
          description: data.description ? `${data.description} (${i + 1}/${count})` : `Despesa Recorrente (${i + 1}/${count})`,
          amount_cents: data.amount_cents,
          payment_method: status === 'PAID' ? data.payment_method || 'PIX' : null,
          status,
          due_date: dueDate,
          payment_date: paymentDate,
          installment_number: i + 1,
          total_installments: count,
          group_id: groupId,
        });
        transactions.push(tx);
      }
      return transactions;
    }

    // Cenário 2: Despesa Parcelada (D-04)
    if (data.installments_count && data.installments_count > 1) {
      const count = data.installments_count;
      const groupId = crypto.randomUUID();
      const transactions: FinancialTransaction[] = [];

      const isDivision = data.installment_division_mode !== 'REPEAT';
      const baseAmountPerInstallment = isDivision
        ? Math.floor(data.amount_cents / count)
        : data.amount_cents;
      const remainder = isDivision ? data.amount_cents % count : 0;

      for (let i = 0; i < count; i++) {
        const dueDate = this.addMonths(baseDueDate, i);
        const isFirst = i === 0;
        const status = isFirst ? txStatus : 'PENDING';
        const paymentDate = isFirst ? basePaymentDate : null;

        // Distribui o centavo restante na primeira parcela se houver divisão
        const amountCents = isDivision && isFirst
          ? baseAmountPerInstallment + remainder
          : baseAmountPerInstallment;

        const tx = await this.repo.createTransaction({
          tenant_id: tenantId,
          type: 'EXPENSE',
          category: data.category.trim(),
          description: data.description ? `${data.description} (${i + 1}/${count})` : `Despesa Parcelada (${i + 1}/${count})`,
          amount_cents: amountCents,
          payment_method: status === 'PAID' ? data.payment_method || 'PIX' : null,
          status,
          due_date: dueDate,
          payment_date: paymentDate,
          installment_number: i + 1,
          total_installments: count,
          group_id: groupId,
        });
        transactions.push(tx);
      }
      return transactions;
    }

    // Cenário 3: Despesa Avulsa Única
    return this.repo.createTransaction({
      tenant_id: tenantId,
      type: 'EXPENSE',
      category: data.category.trim(),
      description: data.description || null,
      amount_cents: data.amount_cents,
      payment_method: data.payment_method || null,
      status: txStatus,
      due_date: baseDueDate,
      payment_date: basePaymentDate,
      installment_number: 1,
      total_installments: 1,
    });
  }

  async updateTransaction(
    tenantId: string,
    id: string,
    data: UpdateTransactionDTO
  ): Promise<FinancialTransaction> {
    const existing = await this.repo.findById(tenantId, id);
    if (!existing) {
      const error: any = new Error('Transação financeira não encontrada.');
      error.statusCode = 404;
      throw error;
    }

    // Se scope for 'ALL' e a transação pertencer a um grupo (D-03)
    if (data.scope === 'ALL' && existing.group_id) {
      await this.repo.updateInstallmentsBatch(
        tenantId,
        existing.group_id,
        existing.installment_number || 1,
        {
          category: data.category,
          description: data.description,
          amount_cents: data.amount_cents,
          payment_method: data.payment_method,
        }
      );
    }

    const updated = await this.repo.updateTransaction(tenantId, id, {
      category: data.category,
      description: data.description,
      amount_cents: data.amount_cents,
      payment_method: data.payment_method,
      status: data.status,
      due_date: data.due_date,
      payment_date: data.payment_date,
    });

    if (!updated) {
      const error: any = new Error('Falha ao atualizar transação financeira.');
      error.statusCode = 500;
      throw error;
    }

    return updated;
  }

  async deleteTransaction(tenantId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(tenantId, id);
    if (!existing) {
      const error: any = new Error('Transação não encontrada ou já desativada');
      error.statusCode = 404;
      throw error;
    }

    // Proteção de Receitas vinculadas a Agendamentos Concluídos (D-06)
    const allowed = await this.repo.checkIncomeDeletionAllowed(tenantId, id);
    if (!allowed) {
      const error: any = new Error(
        'Não é permitido excluir transação financeira vinculada a um agendamento concluído ativo. Cancele ou estorne o agendamento primeiro.'
      );
      error.statusCode = 400;
      error.code = 'LINKED_COMPLETED_APPOINTMENT';
      throw error;
    }

    await this.repo.softDelete(tenantId, id);
  }

  async settleBatch(
    tenantId: string,
    transactionIds: string[],
    paymentMethod?: string,
    paymentDate?: string
  ): Promise<number> {
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      const error: any = new Error('transactionIds deve ser um array não vazio.');
      error.statusCode = 400;
      throw error;
    }

    return this.repo.settleBatch(
      tenantId,
      transactionIds,
      paymentMethod || 'PIX',
      paymentDate || new Date().toISOString().slice(0, 10)
    );
  }

  async listTransactions(
    tenantId: string,
    filters: ListTransactionsFilters = {}
  ): Promise<FinancialTransaction[]> {
    return this.repo.listTransactions(tenantId, filters);
  }

  async getMetrics(
    tenantId: string,
    period: 'today' | 'this_month' | 'last_30_days' | 'all' = 'this_month',
    customDates?: { startDate?: string; endDate?: string }
  ): Promise<FinancialMetricsResult> {
    return this.repo.getMetrics(tenantId, period, customDates);
  }

  private addMonths(dateStr: string, monthsToAdd: number): string {
    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const targetDate = new Date(Date.UTC(year, month + monthsToAdd, day));
    return targetDate.toISOString().slice(0, 10);
  }
}
