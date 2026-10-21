import { CliniAssistLocalDB, localDb } from '../local-db.js';
import { enqueueMutation } from '../outbox.js';
import type { LocalFinancialTransaction } from '../types.js';

export interface InstallmentPlanItem {
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string; // YYYY-MM-DD
  amountCents: number;
  status: 'PAID' | 'PENDING';
  paymentDate?: string | null;
  description: string;
}

export interface RecordCheckoutInput {
  tenantId: string;
  appointmentId: string;
  totalCents: number;
  paymentMethod: string;
  installments: InstallmentPlanItem[];
}

export interface RecordExpenseInput {
  tenantId: string;
  category: string;
  description?: string;
  amountCents: number;
  paymentMethod?: string;
  status?: 'PAID' | 'PENDING';
  dueDate?: string;
  paymentDate?: string | null;
  installmentsCount?: number;
  isRecurring?: boolean;
  recurringMonths?: number;
}

export class FinancialLocalRepository {
  constructor(private db: CliniAssistLocalDB = localDb) {}

  async recordCheckout(input: RecordCheckoutInput): Promise<LocalFinancialTransaction[]> {
    const now = new Date().toISOString();
    const createdTransactions: LocalFinancialTransaction[] = [];

    await this.db.transaction(
      'rw',
      [this.db.financial_transactions, this.db.appointments, this.db.sync_outbox],
      async () => {
        // Verifica se já existem transações ativas para este agendamento (AC-101)
        const existingTxs = await this.db.financial_transactions
          .where('appointment_id')
          .equals(input.appointmentId)
          .filter((tx) => tx.is_active && !tx.deleted_at)
          .toArray();

        if (existingTxs.length > 0) {
          throw new Error(`O agendamento ${input.appointmentId} já possui faturamento registrado.`);
        }

        // Atualiza status do agendamento para COMPLETED
        const app = await this.db.appointments.get(input.appointmentId);
        if (app) {
          const updatedApp = {
            ...app,
            status: 'COMPLETED' as const,
            updated_at: now,
          };
          await this.db.appointments.put(updatedApp);
          await enqueueMutation(this.db, {
            entity: 'appointments',
            recordId: app.id,
            operation: 'UPDATE',
            payload: {
              id: app.id,
              status: 'COMPLETED',
              updated_at: now,
            },
          });
        }

        // Cria cada transação financeira (Entrada e/ou parcelas)
        for (const item of input.installments) {
          const tx: LocalFinancialTransaction = {
            id: crypto.randomUUID(),
            tenant_id: input.tenantId,
            appointment_id: input.appointmentId,
            type: 'INCOME',
            category: 'ATENDIMENTO',
            description: item.description,
            amount_cents: item.amountCents,
            payment_method: input.paymentMethod,
            status: item.status,
            due_date: item.dueDate,
            payment_date: item.status === 'PAID' ? item.paymentDate || now : null,
            installment_number: item.installmentNumber,
            total_installments: item.totalInstallments,
            is_active: true,
            deleted_at: null,
            created_at: now,
            updated_at: now,
          };

          await this.db.financial_transactions.add(tx);
          await enqueueMutation(this.db, {
            entity: 'financial_transactions',
            recordId: tx.id,
            operation: 'INSERT',
            payload: tx,
          });

          createdTransactions.push(tx);
        }
      }
    );

    return createdTransactions;
  }

  async recordExpense(input: RecordExpenseInput): Promise<LocalFinancialTransaction> {
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const status = input.status || 'PAID';
    const isPaid = status === 'PAID';
    const baseDueDate = input.dueDate || today;
    const baseDesc = input.description || `Despesa - ${input.category}`;
    const createdTxs: LocalFinancialTransaction[] = [];

    const [yStr, mStr, dStr] = baseDueDate.split('-');
    const baseYear = parseInt(yStr, 10);
    const baseMonth = parseInt(mStr, 10) - 1;
    const baseDay = parseInt(dStr, 10);

    const getDueDateForMonth = (offsetMonths: number) => {
      const d = new Date(baseYear, baseMonth + offsetMonths, baseDay);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (input.installmentsCount && input.installmentsCount > 1) {
      const count = input.installmentsCount;
      const baseShare = Math.floor(input.amountCents / count);
      const remainder = input.amountCents % count;

      for (let i = 0; i < count; i++) {
        const dueDate = getDueDateForMonth(i);
        const amount = i < remainder ? baseShare + 1 : baseShare;
        const txStatus = i === 0 && isPaid ? 'PAID' : 'PENDING';

        const tx: LocalFinancialTransaction = {
          id: crypto.randomUUID(),
          tenant_id: input.tenantId,
          appointment_id: null,
          type: 'EXPENSE',
          category: input.category,
          description: `${baseDesc} (${i + 1}/${count})`,
          amount_cents: amount,
          payment_method: input.paymentMethod || 'DINHEIRO',
          status: txStatus,
          due_date: dueDate,
          payment_date: txStatus === 'PAID' ? input.paymentDate || now : null,
          installment_number: i + 1,
          total_installments: count,
          is_active: true,
          deleted_at: null,
          created_at: now,
          updated_at: now,
        };
        createdTxs.push(tx);
      }
    } else if (input.isRecurring && input.recurringMonths && input.recurringMonths > 1) {
      const count = input.recurringMonths;
      for (let i = 0; i < count; i++) {
        const dueDate = getDueDateForMonth(i);
        const txStatus = i === 0 && isPaid ? 'PAID' : 'PENDING';

        const tx: LocalFinancialTransaction = {
          id: crypto.randomUUID(),
          tenant_id: input.tenantId,
          appointment_id: null,
          type: 'EXPENSE',
          category: input.category,
          description: `${baseDesc} (Mês ${i + 1}/${count})`,
          amount_cents: input.amountCents,
          payment_method: input.paymentMethod || 'DINHEIRO',
          status: txStatus,
          due_date: dueDate,
          payment_date: txStatus === 'PAID' ? input.paymentDate || now : null,
          installment_number: i + 1,
          total_installments: count,
          is_active: true,
          deleted_at: null,
          created_at: now,
          updated_at: now,
        };
        createdTxs.push(tx);
      }
    } else {
      const tx: LocalFinancialTransaction = {
        id: crypto.randomUUID(),
        tenant_id: input.tenantId,
        appointment_id: null,
        type: 'EXPENSE',
        category: input.category,
        description: baseDesc,
        amount_cents: input.amountCents,
        payment_method: input.paymentMethod || 'DINHEIRO',
        status,
        due_date: baseDueDate,
        payment_date: isPaid ? input.paymentDate || now : null,
        installment_number: 1,
        total_installments: 1,
        is_active: true,
        deleted_at: null,
        created_at: now,
        updated_at: now,
      };
      createdTxs.push(tx);
    }

    await this.db.transaction(
      'rw',
      [this.db.financial_transactions, this.db.sync_outbox],
      async () => {
        for (const tx of createdTxs) {
          await this.db.financial_transactions.add(tx);
          await enqueueMutation(this.db, {
            entity: 'financial_transactions',
            recordId: tx.id,
            operation: 'INSERT',
            payload: tx,
          });
        }
      }
    );

    return createdTxs[0];
  }

  async listTransactions(tenantId: string): Promise<LocalFinancialTransaction[]> {
    return await this.db.financial_transactions
      .where('tenant_id')
      .equals(tenantId)
      .filter((t) => t.is_active && !t.deleted_at)
      .sortBy('due_date');
  }

  async markAsPaid(id: string): Promise<LocalFinancialTransaction> {
    const existing = await this.db.financial_transactions.get(id);
    if (!existing) {
      throw new Error(`Transação financeira com id ${id} não encontrada no banco local.`);
    }

    const now = new Date().toISOString();
    const updated: LocalFinancialTransaction = {
      ...existing,
      status: 'PAID',
      payment_date: now,
      updated_at: now,
    };

    await this.db.transaction(
      'rw',
      [this.db.financial_transactions, this.db.sync_outbox],
      async () => {
        await this.db.financial_transactions.put(updated);
        await enqueueMutation(this.db, {
          entity: 'financial_transactions',
          recordId: id,
          operation: 'UPDATE',
          payload: {
            id,
            status: 'PAID',
            payment_date: now,
            updated_at: now,
          },
        });
      }
    );

    return updated;
  }

  async revertCheckout(appointmentId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.transaction(
      'rw',
      [this.db.financial_transactions, this.db.appointments, this.db.sync_outbox],
      async () => {
        // 1. Reverte o status do agendamento para CONFIRMED
        const app = await this.db.appointments.get(appointmentId);
        if (app) {
          const updatedApp = {
            ...app,
            status: 'CONFIRMED' as const,
            updated_at: now,
          };
          await this.db.appointments.put(updatedApp);
          await enqueueMutation(this.db, {
            entity: 'appointments',
            recordId: app.id,
            operation: 'UPDATE',
            payload: {
              id: app.id,
              status: 'CONFIRMED',
              updated_at: now,
            },
          });
        }

        // 2. Soft-delete em todas as transações ativas associadas a este agendamento
        const txs = await this.db.financial_transactions
          .where('appointment_id')
          .equals(appointmentId)
          .filter((tx) => tx.is_active && !tx.deleted_at)
          .toArray();

        for (const tx of txs) {
          const revertedTx: LocalFinancialTransaction = {
            ...tx,
            is_active: false,
            deleted_at: now,
            updated_at: now,
          };
          await this.db.financial_transactions.put(revertedTx);
          await enqueueMutation(this.db, {
            entity: 'financial_transactions',
            recordId: tx.id,
            operation: 'UPDATE',
            payload: {
              id: tx.id,
              is_active: false,
              deleted_at: now,
              updated_at: now,
            },
          });
        }
      }
    );
  }

  async settleBatch(
    transactionIds: string[],
    paymentMethod: string = 'PIX',
    paymentDate?: string,
    token?: string
  ): Promise<{ settledCount: number }> {
    if (!transactionIds || transactionIds.length === 0) {
      return { settledCount: 0 };
    }

    const now = new Date().toISOString();
    const resolvedPaymentDate = paymentDate
      ? (paymentDate.includes('T') ? paymentDate : `${paymentDate}T12:00:00.000Z`)
      : now;
    let settledCount = 0;

    await this.db.transaction(
      'rw',
      [this.db.financial_transactions, this.db.sync_outbox],
      async () => {
        for (const id of transactionIds) {
          const existing = await this.db.financial_transactions.get(id);
          if (existing && existing.status === 'PENDING') {
            const updated: LocalFinancialTransaction = {
              ...existing,
              status: 'PAID',
              payment_method: paymentMethod,
              payment_date: resolvedPaymentDate,
              updated_at: now,
            };
            await this.db.financial_transactions.put(updated);
            await enqueueMutation(this.db, {
              entity: 'financial_transactions',
              recordId: id,
              operation: 'UPDATE',
              payload: {
                id,
                status: 'PAID',
                payment_method: paymentMethod,
                payment_date: resolvedPaymentDate,
                updated_at: now,
              },
            });
            settledCount++;
          }
        }
      }
    );

    // Se fornecido token e ambiente online, sincroniza com POST /api/financial/settle-batch
    if (token) {
      try {
        await fetch('/api/financial/settle-batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            transactionIds,
            paymentMethod,
            paymentDate: resolvedPaymentDate.split('T')[0],
          }),
        });
      } catch {
        // Tolerância a falhas offline: a outbox cuidará da reconciliação
      }
    }

    return { settledCount };
  }

  async settleTransaction(
    id: string,
    options: { paymentMethod?: string; paymentDate?: string; amountCents?: number } = {}
  ): Promise<LocalFinancialTransaction> {
    const existing = await this.db.financial_transactions.get(id);
    if (!existing) {
      throw new Error(`Transação financeira com id ${id} não encontrada no banco local.`);
    }

    const now = new Date().toISOString();
    const resolvedPaymentDate = options.paymentDate
      ? (options.paymentDate.includes('T') ? options.paymentDate : `${options.paymentDate}T12:00:00.000Z`)
      : now;

    const updated: LocalFinancialTransaction = {
      ...existing,
      status: 'PAID',
      payment_method: options.paymentMethod || existing.payment_method || 'PIX',
      payment_date: resolvedPaymentDate,
      amount_cents: options.amountCents != null ? options.amountCents : existing.amount_cents,
      updated_at: now,
    };

    await this.db.transaction(
      'rw',
      [this.db.financial_transactions, this.db.sync_outbox],
      async () => {
        await this.db.financial_transactions.put(updated);
        await enqueueMutation(this.db, {
          entity: 'financial_transactions',
          recordId: id,
          operation: 'UPDATE',
          payload: {
            id,
            status: 'PAID',
            payment_method: updated.payment_method,
            payment_date: updated.payment_date,
            amount_cents: updated.amount_cents,
            updated_at: now,
          },
        });
      }
    );

    return updated;
  }

  async revertTransactionPayment(id: string): Promise<LocalFinancialTransaction> {
    const existing = await this.db.financial_transactions.get(id);
    if (!existing) {
      throw new Error(`Transação financeira com id ${id} não encontrada.`);
    }

    const now = new Date().toISOString();
    const reverted: LocalFinancialTransaction = {
      ...existing,
      status: 'PENDING',
      payment_date: null,
      updated_at: now,
    };

    await this.db.transaction(
      'rw',
      [this.db.financial_transactions, this.db.sync_outbox],
      async () => {
        await this.db.financial_transactions.put(reverted);
        await enqueueMutation(this.db, {
          entity: 'financial_transactions',
          recordId: id,
          operation: 'UPDATE',
          payload: {
            id,
            status: 'PENDING',
            payment_date: null,
            updated_at: now,
          },
        });
      }
    );

    return reverted;
  }

  async softDeleteTransaction(id: string): Promise<void> {
    const existing = await this.db.financial_transactions.get(id);
    if (!existing) {
      throw new Error(`Transação com id ${id} não encontrada para exclusão.`);
    }

    const now = new Date().toISOString();
    const deletedTx: LocalFinancialTransaction = {
      ...existing,
      is_active: false,
      deleted_at: now,
      updated_at: now,
    };

    await this.db.transaction(
      'rw',
      [this.db.financial_transactions, this.db.sync_outbox],
      async () => {
        await this.db.financial_transactions.put(deletedTx);
        await enqueueMutation(this.db, {
          entity: 'financial_transactions',
          recordId: id,
          operation: 'UPDATE',
          payload: {
            id,
            is_active: false,
            deleted_at: now,
            updated_at: now,
          },
        });
      }
    );
  }

  async updateTransaction(
    id: string,
    updates: Partial<Pick<LocalFinancialTransaction, 'description' | 'category' | 'due_date' | 'amount_cents' | 'payment_method'>>
  ): Promise<LocalFinancialTransaction> {
    const existing = await this.db.financial_transactions.get(id);
    if (!existing) {
      throw new Error(`Transação com id ${id} não encontrada.`);
    }

    const now = new Date().toISOString();
    const updated: LocalFinancialTransaction = {
      ...existing,
      ...updates,
      updated_at: now,
    };

    await this.db.transaction(
      'rw',
      [this.db.financial_transactions, this.db.sync_outbox],
      async () => {
        await this.db.financial_transactions.put(updated);
        await enqueueMutation(this.db, {
          entity: 'financial_transactions',
          recordId: id,
          operation: 'UPDATE',
          payload: {
            id,
            ...updates,
            updated_at: now,
          },
        });
      }
    );

    return updated;
  }

  async listCategories(): Promise<string[]> {
    const defaultCategories = [
      'ATENDIMENTO',
      'ALUGUEL',
      'EQUIPAMENTOS',
      'MATERIAIS',
      'MARKETING',
      'FOLHA',
      'OUTROS',
    ];

    try {
      const txs = await this.db.financial_transactions.toArray();
      const set = new Set<string>(defaultCategories);
      for (const tx of txs) {
        if (tx.category && tx.is_active && !tx.deleted_at) {
          set.add(tx.category.toUpperCase().trim());
        }
      }
      return Array.from(set);
    } catch {
      return defaultCategories;
    }
  }
}

export const financialLocalRepo = new FinancialLocalRepository();
