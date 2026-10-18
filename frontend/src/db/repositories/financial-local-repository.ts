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
  dueDate?: string;
  paymentDate?: string;
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

    const tx: LocalFinancialTransaction = {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      appointment_id: null,
      type: 'EXPENSE',
      category: input.category,
      description: input.description || `Despesa - ${input.category}`,
      amount_cents: input.amountCents,
      payment_method: input.paymentMethod || 'DINHEIRO',
      status: 'PAID',
      due_date: input.dueDate || today,
      payment_date: input.paymentDate || now,
      installment_number: 1,
      total_installments: 1,
      is_active: true,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    };

    await this.db.transaction(
      'rw',
      [this.db.financial_transactions, this.db.sync_outbox],
      async () => {
        await this.db.financial_transactions.add(tx);
        await enqueueMutation(this.db, {
          entity: 'financial_transactions',
          recordId: tx.id,
          operation: 'INSERT',
          payload: tx,
        });
      }
    );

    return tx;
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
}

export const financialLocalRepo = new FinancialLocalRepository();
