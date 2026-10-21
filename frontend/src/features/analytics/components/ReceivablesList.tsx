import React, { useState } from 'react';
import { LocalFinancialTransaction } from '../../../db/types';
import { BatchSettleModal } from './BatchSettleModal';
import { CheckSquare, Square, CheckCheck } from 'lucide-react';

interface ReceivablesListProps {
  transactions: LocalFinancialTransaction[];
  onMarkPaid: (transactionId: string, paymentMethod?: string, paymentDate?: string) => Promise<void> | void;
  onSettleBatch?: (transactionIds: string[], paymentMethod: string, paymentDate: string) => Promise<void> | void;
}

export const ReceivablesList: React.FC<ReceivablesListProps> = ({
  transactions,
  onMarkPaid,
  onSettleBatch,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [singleSettleTx, setSingleSettleTx] = useState<LocalFinancialTransaction | null>(null);

  const pendingReceivables = transactions
    .filter((t) => t.is_active && !t.deleted_at && t.type === 'INCOME' && t.status === 'PENDING')
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const allSelected = pendingReceivables.length > 0 && selectedIds.size === pendingReceivables.length;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingReceivables.map((t) => t.id)));
    }
  };

  const selectedTransactions = pendingReceivables.filter((t) => selectedIds.has(t.id));
  const totalSelectedCents = selectedTransactions.reduce((acc, t) => acc + t.amount_cents, 0);

  const handleBatchConfirm = async (paymentMethod: string, paymentDate: string) => {
    const idsToSettle = Array.from(selectedIds);
    if (onSettleBatch) {
      await onSettleBatch(idsToSettle, paymentMethod, paymentDate);
    } else {
      for (const id of idsToSettle) {
        await onMarkPaid(id);
      }
    }
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-3" data-testid="receivables-list">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Contas a Receber (Parcelas Pendentes)
          </h4>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            {pendingReceivables.length} pendente(s)
          </span>
        </div>

        {pendingReceivables.length > 0 && (
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1.5 p-1 rounded min-h-[44px]"
            data-testid="btn-select-all-receivables"
          >
            <CheckCheck className="w-4 h-4 text-teal-600" />
            {allSelected ? 'Desmarcar Todas' : 'Selecionar Todas'}
          </button>
        )}
      </div>

      {pendingReceivables.length === 0 ? (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs italic text-center">
          Nenhuma parcela pendente a receber.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
          {pendingReceivables.map((tx) => {
            const amountReais = (tx.amount_cents / 100).toFixed(2);
            const isSelected = selectedIds.has(tx.id);

            return (
              <div
                key={tx.id}
                className={`p-3 flex items-center justify-between gap-3 transition ${
                  isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50/50'
                }`}
                data-testid={`receivable-row-${tx.id}`}
              >
                {/* Checkbox touch >= 44px */}
                <button
                  type="button"
                  onClick={() => handleToggleSelect(tx.id)}
                  className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center text-slate-400 hover:text-emerald-700 transition"
                  aria-label={`Selecionar parcela ${tx.description}`}
                  data-testid={`checkbox-receivable-${tx.id}`}
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300" />
                  )}
                </button>

                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleToggleSelect(tx.id)}>
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
                    Vencimento: {tx.due_date ? String(tx.due_date).split('T')[0] : ''}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-sm font-mono font-bold text-slate-900">
                    R$ {amountReais}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSingleSettleTx(tx)}
                    className="min-h-[44px] px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition active:scale-95"
                    aria-label={`Dar baixa em ${tx.description}`}
                    data-testid={`btn-single-settle-${tx.id}`}
                  >
                    ✓ Baixa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Barra de Ação Flutuante Mobile na Zona do Polegar */}
      {selectedIds.size > 0 && (
        <div
          className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom duration-200"
          data-testid="batch-action-bar"
        >
          <div>
            <div className="text-xs font-semibold text-slate-300">
              {selectedIds.size} selecionada(s)
            </div>
            <div className="text-sm font-mono font-extrabold text-emerald-400">
              R$ {(totalSelectedCents / 100).toFixed(2)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsBatchModalOpen(true)}
            className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
            data-testid="btn-open-batch-settle"
          >
            Dar Baixa em Lote
          </button>
        </div>
      )}

      {/* Modal para Baixa de Parcela Individual com Seleção de Método */}
      <BatchSettleModal
        isOpen={Boolean(singleSettleTx)}
        selectedCount={1}
        totalCents={singleSettleTx?.amount_cents || 0}
        title="Baixa de Parcela"
        onClose={() => setSingleSettleTx(null)}
        onConfirm={async (paymentMethod, paymentDate) => {
          if (!singleSettleTx) return;
          if (onSettleBatch) {
            await onSettleBatch([singleSettleTx.id], paymentMethod, paymentDate);
          } else {
            await onMarkPaid(singleSettleTx.id, paymentMethod, paymentDate);
          }
          setSingleSettleTx(null);
        }}
      />

      {/* Bottom Sheet de Confirmação da Baixa em Lote */}
      <BatchSettleModal
        isOpen={isBatchModalOpen}
        selectedCount={selectedIds.size}
        totalCents={totalSelectedCents}
        title="Quitação de Parcelas em Lote"
        onClose={() => setIsBatchModalOpen(false)}
        onConfirm={handleBatchConfirm}
      />
    </div>
  );
};
