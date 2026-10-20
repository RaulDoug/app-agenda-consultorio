export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'PAID' | 'PENDING';
export type PaymentMethod =
  | 'PIX'
  | 'DINHEIRO'
  | 'DEBITO'
  | 'CREDITO'
  | 'PARCELADO'
  | 'CASH'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'BOLETO';

export interface FinancialTransaction {
  id: string;
  tenant_id: string;
  appointment_id?: string | null;
  type: TransactionType;
  category: string;
  description?: string | null;
  amount_cents: number;
  payment_method?: PaymentMethod | string | null;
  status: TransactionStatus;
  due_date: string; // YYYY-MM-DD
  payment_date?: string | null; // YYYY-MM-DD
  installment_number?: number;
  total_installments?: number;
  group_id?: string | null;
  is_active?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FinancialCategory {
  id: string;
  tenant_id: string;
  name: string;
  type?: TransactionType;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFinancialCategoryDTO {
  name: string;
  type?: TransactionType;
}

export interface CreateExpenseDTO {
  category: string;
  description?: string | null;
  amount_cents: number;
  payment_method?: PaymentMethod | string | null;
  status?: TransactionStatus;
  due_date: string; // YYYY-MM-DD
  payment_date?: string | null; // YYYY-MM-DD
  // Despesas recorrentes
  is_recurring?: boolean;
  recurrence_months?: number; // Repetição por N meses
  // Despesas parceladas
  installments_count?: number; // N parcelas
  installment_division_mode?: 'DIVIDE' | 'REPEAT'; // divide valor total ou repete em cada parcela
}

export interface UpdateTransactionDTO {
  category?: string;
  description?: string | null;
  amount_cents?: number;
  payment_method?: PaymentMethod | string | null;
  status?: TransactionStatus;
  due_date?: string;
  payment_date?: string | null;
  scope?: 'SINGLE' | 'ALL'; // Edita apenas esta parcela ou todas as parcelas pendentes do grupo
}

export interface FinancialMetricsResponse {
  period: 'today' | 'this_month' | 'last_30_days' | 'all';
  income_paid_cents: number;
  expenses_paid_cents: number;
  expenses_pending_cents: number;
  income_pending_cents: number;
  net_profit_cents: number;
  transactions: FinancialTransaction[];
}
