import React from 'react';
import { LocalFinancialTransaction } from '../../../db/types';

interface ReceivablesListProps {
  transactions: LocalFinancialTransaction[];
  onMarkPaid: (transactionId: string) => Promise<void> | void;
}

export const ReceivablesList: React.FC<ReceivablesListProps> = ({
  transactions,
  onMarkPaid,
}) => {
  const pendingReceivables = transactions
    .filter((t) => t.is_active && !t.deleted_at && t.type === 'INCOME' && t.status === 'PENDING')
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  return (
    <div className="space-y-3" data-testid="receivables-list">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Contas a Receber (Parcelas Pendentes)
        </h4>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
          {pendingReceivables.length} pendente(s)
        </span>
      </div>

      {pendingReceivables.length === 0 ? (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs italic text-center">
          Nenhuma parcela pendente a receber.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
          {pendingReceivables.map((tx) => {
            const amountReais = (tx.amount_cents / 100).toFixed(2);
            return (
              <div
                key={tx.id}
                className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition"
                data-testid={`receivable-row-${tx.id}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {tx.description || 'Consulta / Tratamento'}
                    </span>
                    <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                      {tx.installment_number > 0
                        ? `${tx.installment_number}/${tx.total_installments}`
                        : 'À Vista'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Vencimento: {tx.due_date}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-mono font-bold text-slate-900">
                    R$ {amountReais}
                  </span>

                  <button
                    type="button"
                    onClick={() => onMarkPaid(tx.id)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition active:scale-95"
                    aria-label={`Dar baixa em ${tx.description}`}
                  >
                    ✓ Dar Baixa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
