import { LocalFinancialTransaction } from '../../../db/types';

export interface CashMetrics {
  totalIncomePaidCents: number;
  totalExpensePaidCents: number;
  netProfitCents: number;
  totalReceivablesPendingCents: number;
  incomeCount: number;
  expenseCount: number;
  pendingReceivablesCount: number;
}

export type CashFilterPeriod = 'today' | 'this_month' | 'last_30_days' | 'all';

export function filterTransactionsByPeriod(
  transactions: LocalFinancialTransaction[],
  period: CashFilterPeriod
): LocalFinancialTransaction[] {
  const activeTxs = transactions.filter((t) => t.is_active && !t.deleted_at);
  if (period === 'all') return activeTxs;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (period === 'today') {
    return activeTxs.filter((t) => {
      const targetDate = (t.payment_date || t.due_date).split('T')[0];
      return targetDate === todayStr;
    });
  }

  if (period === 'this_month') {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    return activeTxs.filter((t) => {
      const targetDate = new Date(t.payment_date || t.due_date);
      return (
        targetDate.getFullYear() === currentYear &&
        targetDate.getMonth() === currentMonth
      );
    });
  }

  if (period === 'last_30_days') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const minIso = thirtyDaysAgo.toISOString().split('T')[0];

    return activeTxs.filter((t) => {
      const targetDate = (t.payment_date || t.due_date).split('T')[0];
      return targetDate >= minIso && targetDate <= todayStr;
    });
  }

  return activeTxs;
}

export function calculateCashMetrics(transactions: LocalFinancialTransaction[]): CashMetrics {
  let totalIncomePaidCents = 0;
  let totalExpensePaidCents = 0;
  let totalReceivablesPendingCents = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  let pendingReceivablesCount = 0;

  for (const t of transactions) {
    if (!t.is_active || t.deleted_at) continue;

    if (t.type === 'INCOME') {
      if (t.status === 'PAID') {
        totalIncomePaidCents += t.amount_cents;
        incomeCount += 1;
      } else if (t.status === 'PENDING') {
        totalReceivablesPendingCents += t.amount_cents;
        pendingReceivablesCount += 1;
      }
    } else if (t.type === 'EXPENSE') {
      if (t.status === 'PAID') {
        totalExpensePaidCents += t.amount_cents;
        expenseCount += 1;
      }
    }
  }

  const netProfitCents = totalIncomePaidCents - totalExpensePaidCents;

  return {
    totalIncomePaidCents,
    totalExpensePaidCents,
    netProfitCents,
    totalReceivablesPendingCents,
    incomeCount,
    expenseCount,
    pendingReceivablesCount,
  };
}
