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
  group_id: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at?: string;
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
  group_id?: string | null;
}

export interface UpdateFinancialTransactionDTO {
  category?: string;
  description?: string | null;
  amount_cents?: number;
  payment_method?: string | null;
  status?: 'PAID' | 'PENDING';
  due_date?: string;
  payment_date?: string | null;
}

export interface ListTransactionsFilters {
  startDate?: string;
  endDate?: string;
  status?: 'PAID' | 'PENDING';
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
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

export interface FinancialMetricsResult {
  period: 'today' | 'this_month' | 'last_30_days' | 'all';
  income_paid_cents: number;
  expenses_paid_cents: number;
  expenses_pending_cents: number;
  income_pending_cents: number;
  net_profit_cents: number;
  transactions: FinancialTransaction[];
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
      const txId = data.id || crypto.randomUUID();
      const sql = `
        INSERT INTO financial_transactions (
          id, tenant_id, appointment_id, type, category, description,
          amount_cents, payment_method, status, due_date, payment_date,
          installment_number, total_installments, group_id, is_active,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, true,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
      `;

      const params = [
        txId,
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
        data.group_id || null,
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
   * Atualiza uma transação individual
   */
  async updateTransaction(
    tenantId: string,
    id: string,
    data: UpdateFinancialTransactionDTO
  ): Promise<FinancialTransaction | null> {
    const existing = await this.findById(tenantId, id);
    if (!existing) return null;

    const category = data.category !== undefined ? data.category : existing.category;
    const description = data.description !== undefined ? data.description : existing.description;
    const amountCents = data.amount_cents !== undefined ? data.amount_cents : existing.amount_cents;
    const paymentMethod = data.payment_method !== undefined ? data.payment_method : existing.payment_method;
    const status = data.status !== undefined ? data.status : existing.status;
    const dueDate = data.due_date !== undefined ? data.due_date : existing.due_date;
    const paymentDate =
      data.payment_date !== undefined
        ? data.payment_date
        : status === 'PAID' && !existing.payment_date
        ? dueDate
        : existing.payment_date;

    const sql = `
      UPDATE financial_transactions
      SET category = $1, description = $2, amount_cents = $3,
          payment_method = $4, status = $5, due_date = $6,
          payment_date = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND tenant_id = $9 AND is_active = true AND deleted_at IS NULL
      RETURNING *
    `;

    const res = await this.db.query<FinancialTransaction>(sql, [
      category,
      description,
      amountCents,
      paymentMethod,
      status,
      dueDate,
      paymentDate,
      id,
      tenantId,
    ]);

    return res.rows[0] || null;
  }

  /**
   * Atualiza parcelas pendentes subsequentes de um grupo (D-03: scope = 'ALL')
   * Preserva accounting integrity das parcelas já pagas (PAID).
   */
  async updateInstallmentsBatch(
    tenantId: string,
    groupId: string,
    fromInstallmentNumber: number,
    data: UpdateFinancialTransactionDTO
  ): Promise<number> {
    const fields: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [tenantId, groupId, fromInstallmentNumber];

    if (data.category !== undefined) {
      params.push(data.category);
      fields.push(`category = $${params.length}`);
    }
    if (data.description !== undefined) {
      params.push(data.description);
      fields.push(`description = $${params.length}`);
    }
    if (data.amount_cents !== undefined) {
      params.push(data.amount_cents);
      fields.push(`amount_cents = $${params.length}`);
    }
    if (data.payment_method !== undefined) {
      params.push(data.payment_method);
      fields.push(`payment_method = $${params.length}`);
    }

    const sql = `
      UPDATE financial_transactions
      SET ${fields.join(', ')}
      WHERE tenant_id = $1
        AND group_id = $2
        AND installment_number >= $3
        AND status = 'PENDING'
        AND is_active = true
        AND deleted_at IS NULL
    `;

    const res = await this.db.query(sql, params);
    return res.rowCount || 0;
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
          payment_date = $2,
          updated_at = CURRENT_TIMESTAMP
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
   * Verifica se a exclusão de receita é permitida (D-06).
   * Impede exclusão direta de receita vinculada a agendamento ativo e concluído.
   */
  async checkIncomeDeletionAllowed(tenantId: string, transactionId: string): Promise<boolean> {
    const tx = await this.findById(tenantId, transactionId);
    if (!tx) return true;

    if (tx.type === 'INCOME' && tx.appointment_id) {
      const appRes = await this.db.query(
        `SELECT id, status FROM appointments WHERE id = $1 AND tenant_id = $2 AND status = 'COMPLETED' AND deleted_at IS NULL`,
        [tx.appointment_id, tenantId]
      );
      if (appRes.rows.length > 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Soft Delete de transação financeira para integridade e rastreabilidade contábil (AC-034)
   */
  async softDelete(tenantId: string, transactionId: string): Promise<boolean> {
    const sql = `
      UPDATE financial_transactions
      SET is_active = false,
          deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
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
      WHERE id = $1 AND tenant_id = $2 AND is_active = true AND deleted_at IS NULL
    `;
    const res = await this.db.query<FinancialTransaction>(sql, [transactionId, tenantId]);
    return res.rows[0] || null;
  }

  /**
   * Lista transações financeiras ativas com filtros opcionais (AC-047)
   */
  async listTransactions(
    tenantId: string,
    filters: ListTransactionsFilters = {}
  ): Promise<FinancialTransaction[]> {
    const conditions: string[] = ['tenant_id = $1', 'is_active = true', 'deleted_at IS NULL'];
    const params: any[] = [tenantId];

    if (filters.startDate) {
      params.push(filters.startDate);
      conditions.push(`due_date >= $${params.length}`);
    }

    if (filters.endDate) {
      params.push(filters.endDate);
      conditions.push(`due_date <= $${params.length}`);
    }

    if (filters.status) {
      params.push(filters.status);
      conditions.push(`status = $${params.length}`);
    }

    if (filters.type) {
      params.push(filters.type);
      conditions.push(`type = $${params.length}`);
    }

    if (filters.category) {
      params.push(filters.category);
      conditions.push(`category = $${params.length}`);
    }

    const sql = `
      SELECT * FROM financial_transactions
      WHERE ${conditions.join(' AND ')}
      ORDER BY due_date ASC, id ASC
    `;

    const res = await this.db.query<FinancialTransaction>(sql, params);
    return res.rows;
  }

  /**
   * Métricas Financeiras Consolidadas em Regime de Caixa (D-07)
   */
  async getMetrics(
    tenantId: string,
    period: 'today' | 'this_month' | 'last_30_days' | 'all' = 'this_month',
    customDates?: { startDate?: string; endDate?: string }
  ): Promise<FinancialMetricsResult> {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    let startDate: string | undefined;
    let endDate: string | undefined;

    if (customDates?.startDate && customDates?.endDate) {
      startDate = customDates.startDate;
      endDate = customDates.endDate;
    } else {
      switch (period) {
        case 'today':
          startDate = todayStr;
          endDate = todayStr;
          break;
        case 'this_month': {
          const y = now.getUTCFullYear();
          const m = now.getUTCMonth();
          startDate = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
          startDate = `${y}-${String(m + 1).padStart(2, '0')}-01`;
          const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
          endDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          break;
        }
        case 'last_30_days': {
          const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          startDate = past30.toISOString().slice(0, 10);
          endDate = todayStr;
          break;
        }
        case 'all':
        default:
          startDate = undefined;
          endDate = undefined;
          break;
      }
    }

    // Busca todas as transações ativas do tenant
    const allTx = await this.listTransactions(tenantId, {});

    // Filtra em Regime de Caixa:
    // Receitas pagas consideram payment_date
    // Despesas pagas consideram payment_date
    // Valores pendentes consideram due_date
    const isWithinRange = (dateStr: string | null | undefined): boolean => {
      if (!dateStr) return false;
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;
      return true;
    };

    let incomePaidCents = 0;
    let expensesPaidCents = 0;
    let incomePendingCents = 0;
    let expensesPendingCents = 0;

    const filteredTransactions: FinancialTransaction[] = [];

    for (const tx of allTx) {
      const relevantDate = tx.status === 'PAID' ? (tx.payment_date || tx.due_date) : tx.due_date;
      if (isWithinRange(relevantDate) || (!startDate && !endDate)) {
        filteredTransactions.push(tx);

        if (tx.type === 'INCOME') {
          if (tx.status === 'PAID') {
            incomePaidCents += Number(tx.amount_cents);
          } else {
            incomePendingCents += Number(tx.amount_cents);
          }
        } else if (tx.type === 'EXPENSE') {
          if (tx.status === 'PAID') {
            expensesPaidCents += Number(tx.amount_cents);
          } else {
            expensesPendingCents += Number(tx.amount_cents);
          }
        }
      }
    }

    const netProfitCents = incomePaidCents - expensesPaidCents;

    return {
      period,
      income_paid_cents: incomePaidCents,
      expenses_paid_cents: expensesPaidCents,
      income_pending_cents: incomePendingCents,
      expenses_pending_cents: expensesPendingCents,
      net_profit_cents: netProfitCents,
      transactions: filteredTransactions,
    };
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

      const groupId = schedule.length > 1 ? crypto.randomUUID() : null;

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
        group_id: groupId,
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
