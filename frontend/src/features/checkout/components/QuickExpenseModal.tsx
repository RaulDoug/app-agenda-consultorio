import React, { useState } from 'react';
import { FinancialLocalRepository, financialLocalRepo } from '../../../db/repositories/financial-local-repository';

export type ExpenseCategory = 'MATERIAIS' | 'ALUGUEL' | 'LABORATORIO' | 'OUTROS';

const CATEGORIES: Array<{ key: ExpenseCategory; label: string; icon: string }> = [
  { key: 'MATERIAIS', label: 'Materiais & Insumos', icon: '📦' },
  { key: 'ALUGUEL', label: 'Aluguel & Contas', icon: '🏢' },
  { key: 'LABORATORIO', label: 'Laboratório & Prótese', icon: '🔬' },
  { key: 'OUTROS', label: 'Outras Despesas', icon: '🏷️' },
];

interface QuickExpenseModalProps {
  isOpen: boolean;
  tenantId: string;
  onClose: () => void;
  financialRepo?: FinancialLocalRepository;
  onExpenseSaved?: (expense: any) => void;
}

export const QuickExpenseModal: React.FC<QuickExpenseModalProps> = ({
  isOpen,
  tenantId,
  onClose,
  financialRepo = financialLocalRepo,
  onExpenseSaved,
}) => {
  const [amountReais, setAmountReais] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('MATERIAIS');
  const [description, setDescription] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Bloqueio de scroll do plano de fundo enquanto o modal estiver aberto (AC-094)
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const val = parseFloat(amountReais) || 0;
    if (val <= 0) {
      setErrorMsg('Informe um valor válido para a despesa.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const amountCents = Math.round(val * 100);

      const created = await financialRepo.recordExpense({
        tenantId,
        category,
        description: description.trim() || undefined,
        amountCents,
        paymentMethod,
        dueDate: paymentDate,
        paymentDate: `${paymentDate}T12:00:00.000Z`,
      });

      onExpenseSaved?.(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar despesa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-fade-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-rose-50/50">
          <div>
            <h3 id="expense-modal-title" className="font-bold text-rose-950 text-base">
              Nova Despesa Rápida
            </h3>
            <p className="text-xs text-rose-700">Lançamento de saída do caixa</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Campo de Valor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Valor da Saída <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-rose-500">
              <span className="text-sm font-bold text-slate-400 mr-2">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amountReais}
                onChange={(e) => setAmountReais(e.target.value)}
                placeholder="0.00"
                className="w-full text-base font-mono font-bold text-slate-900 bg-transparent focus:outline-none"
                aria-label="Valor da despesa"
                autoFocus
              />
            </div>
          </div>

          {/* Seleção de Categoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Categoria
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition flex items-center gap-2 ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descrição Opcional */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição / Fornecedor (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Compra de luvas e anestésicos..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-rose-500"
              aria-label="Descrição da despesa"
            />
          </div>

          {/* Data e Forma de Pagamento */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Data do Pagamento
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Forma de Saída
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-rose-500"
              >
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO_DEBITO">Cartão Débito</option>
                <option value="BOLETO">Boleto</option>
              </select>
            </div>
          </div>

          {/* Botões */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amountReais}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
