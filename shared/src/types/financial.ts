export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'PAID' | 'PENDING';
export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'BOLETO';

export interface FinancialTransaction {
  id: string;
  tenant_id: string;
  appointment_id?: string | null;
  type: TransactionType;
  category: string;
  description?: string | null;
  amount_cents: number;
  payment_method?: PaymentMethod | null;
  status: TransactionStatus;
  due_date: string; // YYYY-MM-DD
  payment_date?: string | null; // YYYY-MM-DD
  installment_number?: number;
  total_installments?: number;
  is_active?: boolean;
  deleted_at?: string | null;
  created_at?: string;
}
