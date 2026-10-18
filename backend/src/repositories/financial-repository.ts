import { getDatabase, type IDatabase, type IDatabaseClient } from '../db/connection.js';
import { calculateDiscountDistribution, type ProcedurePricingItem, type DiscountOptions } from '../financial/calculator.js';
import { generateInstallmentSchedule, type InstallmentScheduleItem } from '../financial/installments.js';

export interface FinancialTransaction {
  id: string;
  tenant_id: string;
  appointment_id: string | null;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string | null;
  amount_cents: number;
  payment_method: string | null;
  status: 'PAID' | 'PENDING';
  due_date: string;
  payment_date: string | null;
  installment_number: number;
  total_installments: number;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
}

export interface CreateFinancialTransactionDTO {
  id?: string;
  tenant_id: string;
  appointment_id?: string | null;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description?: string | null;
  amount_cents: number;
  payment_method?: string | null;
  status?: 'PAID' | 'PENDING';
  due_date: string;
  payment_date?: string | null;
  installment_number?: number;
  total_installments?: number;
}

export interface CheckoutParams {
  tenantId: string;
  appointmentId: string;
  items: ProcedurePricingItem[];
  discount?: DiscountOptions;
  paymentPlan: {
    downPaymentCents?: number;
    installmentsCount: number;
    firstDueDate?: string;
    paymentMethod?: string;
    paymentDate?: string;
  };
}

export class FinancialRepository {
  private customDb?: IDatabase;

  constructor(db?: IDatabase) {
    this.customDb = db;
  }

  private get db(): IDatabase {
    return this.customDb || getDatabase();
  }

  /**
   * Cria uma transação financeira individual
   */
  async createTransaction(
    data: CreateFinancialTransactionDTO,
    externalClient?: IDatabaseClient
  ): Promise<FinancialTransaction> {
    const client = externalClient || (await this.db.getClient());
    const shouldRelease = !externalClient;

    try {
      const sql = `
        INSERT INTO financial_transactions (
          tenant_id, appointment_id, type, category, description,
          amount_cents, payment_method, status, due_date, payment_date,
          installment_number, total_installments, is_active
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, true
        ) RETURNING *
      `;

      const params = [
        data.tenant_id,
        data.appointment_id || null,
        data.type,
        data.category,
        data.description || null,
        data.amount_cents,
        data.payment_method || null,
        data.status || 'PAID',
        data.due_date,
        data.payment_date || (data.status === 'PAID' ? data.due_date : null),
        data.installment_number || 1,
        data.total_installments || 1,
      ];

      const res = await client.query<FinancialTransaction>(sql, params);
      return res.rows[0];
    } finally {
      if (shouldRelease) {
        client.release();
      }
    }
  }

  /**
   * Cria múltiplas transações financeiras em lote dentro de um client transacional
   */
  async createBatch(
    transactions: CreateFinancialTransactionDTO[],
    client: IDatabaseClient
  ): Promise<FinancialTransaction[]> {
    const results: FinancialTransaction[] = [];
    for (const tx of transactions) {
      const created = await this.createTransaction(tx, client);
      results.push(created);
    }
    return results;
  }

  /**
   * Baixa / Quitação em lote de múltiplas parcelas pendentes (AC-032)
   */
  async settleBatch(
    tenantId: string,
    transactionIds: string[],
    paymentMethod: string = 'PIX',
    paymentDate: string = new Date().toISOString().slice(0, 10)
  ): Promise<number> {
    if (!transactionIds || transactionIds.length === 0) {
      return 0;
    }

    const placeholders = transactionIds.map((_, i) => `$${i + 4}`).join(', ');
    const sql = `
      UPDATE financial_transactions
      SET status = 'PAID',
          payment_method = $1,
          payment_date = $2
      WHERE tenant_id = $3
        AND id IN (${placeholders})
        AND status = 'PENDING'
        AND is_active = true
        AND deleted_at IS NULL
    `;

    const params = [paymentMethod, paymentDate, tenantId, ...transactionIds];
    const res = await this.db.query(sql, params);
    return res.rowCount || 0;
  }

  /**
   * Soft Delete de transação financeira para integridade e rastreabilidade contábil (AC-034)
   */
  async softDelete(tenantId: string, transactionId: string): Promise<boolean> {
    const sql = `
      UPDATE financial_transactions
      SET is_active = false,
          deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2 AND is_active = true AND deleted_at IS NULL
    `;
    const res = await this.db.query(sql, [transactionId, tenantId]);
    return (res.rowCount || 0) > 0;
  }

  /**
   * Busca transação por ID garantindo isolamento multi-tenant
   */
  async findById(tenantId: string, transactionId: string): Promise<FinancialTransaction | null> {
    const sql = `
      SELECT * FROM financial_transactions
      WHERE id = $1 AND tenant_id = $2
    `;
    const res = await this.db.query<FinancialTransaction>(sql, [transactionId, tenantId]);
    return res.rows[0] || null;
  }

  /**
   * Conclusão transacional de consulta (Checkout) com rateio e plano financeiro
   */
  async checkoutAppointment(params: CheckoutParams): Promise<{
    appointmentId: string;
    totalAmountCents: number;
    transactions: FinancialTransaction[];
  }> {
    const client = await this.db.getClient();
    await client.query('BEGIN');

    try {
      // 1. Valida existência e tenant do agendamento
      const appRes = await client.query(
        `SELECT id, status FROM appointments WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [params.appointmentId, params.tenantId]
      );
      if (appRes.rows.length === 0) {
        throw new Error('Agendamento não encontrado ou desativado');
      }

      // 2. Calcula rateio contábil dos procedimentos (AC-027 e AC-028)
      const distribution = calculateDiscountDistribution(params.items, params.discount);

      // 3. Substitui itens em appointment_items com os preços efetivos finais
      await client.query(`DELETE FROM appointment_items WHERE appointment_id = $1`, [params.appointmentId]);

      for (const item of distribution.items) {
        await client.query(
          `INSERT INTO appointment_items (appointment_id, procedure_id, effective_price_cents, duration_minutes)
           VALUES ($1, $2, $3, 30)`,
          [params.appointmentId, item.procedureId, item.effectivePriceCents]
        );
      }

      // 4. Gera cronograma de parcelas e insere transações (AC-029, AC-030, AC-031)
      const schedule = generateInstallmentSchedule({
        totalAmountCents: distribution.totalEffectiveCents,
        downPaymentCents: params.paymentPlan.downPaymentCents || 0,
        installmentsCount: params.paymentPlan.installmentsCount,
        firstDueDate: params.paymentPlan.firstDueDate,
        paymentDate: params.paymentPlan.paymentDate,
      });

      const txDTOs: CreateFinancialTransactionDTO[] = schedule.map((sch) => ({
        tenant_id: params.tenantId,
        appointment_id: params.appointmentId,
        type: 'INCOME',
        category: 'Tratamento Odontológico',
        description: `Consulta ${params.appointmentId} - Parcela ${sch.installmentNumber}/${sch.totalInstallments}`,
        amount_cents: sch.amountCents,
        payment_method: sch.status === 'PAID' ? params.paymentPlan.paymentMethod || 'PIX' : null,
        status: sch.status,
        due_date: sch.dueDate,
        payment_date: sch.paymentDate || null,
        installment_number: sch.installmentNumber,
        total_installments: sch.totalInstallments,
      }));

      const createdTransactions = await this.createBatch(txDTOs, client);

      // 5. Marca agendamento como COMPLETED
      await client.query(
        `UPDATE appointments SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [params.appointmentId]
      );

      await client.query('COMMIT');

      return {
        appointmentId: params.appointmentId,
        totalAmountCents: distribution.totalEffectiveCents,
        transactions: createdTransactions,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
