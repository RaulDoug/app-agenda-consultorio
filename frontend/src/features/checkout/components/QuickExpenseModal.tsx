import React, { useState, useEffect } from 'react';
import { FinancialLocalRepository, financialLocalRepo } from '../../../db/repositories/financial-local-repository';

export type ExpenseCategory = string;

const DEFAULT_CATEGORIES: Array<{ key: string; label: string; icon: string }> = [
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
  const [category, setCategory] = useState<string>('MATERIAIS');
  const [categoriesList, setCategoriesList] = useState<Array<{ key: string; label: string; icon: string }>>(DEFAULT_CATEGORIES);
  const [description, setDescription] = useState<string>('');
  const [expenseStatus, setExpenseStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [modality, setModality] = useState<'single' | 'installments' | 'recurring'>('single');
  const [installmentsCount, setInstallmentsCount] = useState<number>(2);
  const [recurringMonths, setRecurringMonths] = useState<number>(6);
  const [dateValue, setDateValue] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset completo dos campos ao abrir o modal (Item 13 / AC-190)
  useEffect(() => {
    if (isOpen) {
      setAmountReais('');
      setCategory('MATERIAIS');
      setDescription('');
      setExpenseStatus('PAID');
      setModality('single');
      setInstallmentsCount(2);
      setRecurringMonths(6);
      setDateValue(new Date().toISOString().split('T')[0]);
      setPaymentMethod('PIX');
      setIsSubmitting(false);
      setErrorMsg('');
    }
  }, [isOpen]);

  // Carrega categorias dinâmicas com fallback local
  useEffect(() => {
    let isMounted = true;
    if (financialRepo?.listCategories) {
      financialRepo.listCategories().then((cats) => {
        if (!isMounted || !cats || cats.length === 0) return;
        const iconMap: Record<string, string> = {
          MATERIAIS: '📦',
          MATERIAL: '📦',
          ALUGUEL: '🏢',
          LABORATORIO: '🔬',
          EQUIPAMENTOS: '⚙️',
          MARKETING: '📢',
          FOLHA: '👥',
          OUTROS: '🏷️',
        };
        const labelMap: Record<string, string> = {
          MATERIAIS: 'Materiais & Insumos',
          MATERIAL: 'Materiais & Insumos',
          ALUGUEL: 'Aluguel & Contas',
          LABORATORIO: 'Laboratório & Prótese',
          EQUIPAMENTOS: 'Equipamentos & Manutenção',
          MARKETING: 'Marketing & Divulgação',
          FOLHA: 'Folha & Pessoal',
          OUTROS: 'Outras Despesas',
        };
        const mapped = cats.map((c) => ({
          key: c,
          label: labelMap[c.toUpperCase()] || (c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()),
          icon: iconMap[c.toUpperCase()] || '🏷️',
        }));
        setCategoriesList(mapped);
      }).catch(() => {
        // Fallback para DEFAULT_CATEGORIES
      });
    }
    return () => {
      isMounted = false;
    };
  }, [financialRepo]);

  // Bloqueio de scroll do plano de fundo enquanto o modal estiver aberto (AC-094)
  useEffect(() => {
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
      const isPaid = expenseStatus === 'PAID';

      const created = await financialRepo.recordExpense({
        tenantId,
        category,
        description: description.trim() || undefined,
        amountCents,
        paymentMethod,
        status: expenseStatus,
        dueDate: dateValue,
        paymentDate: isPaid ? `${dateValue}T12:00:00.000Z` : null,
        installmentsCount: modality === 'installments' ? installmentsCount : undefined,
        isRecurring: modality === 'recurring',
        recurringMonths: modality === 'recurring' ? recurringMonths : undefined,
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
        className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh] overflow-y-auto"
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
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 flex-1">
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

          {/* Status: Pago vs Pendente (Item 15 / AC-190) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status do Pagamento
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setExpenseStatus('PAID')}
                className={`py-1.5 px-3 text-xs font-bold rounded-lg transition ${
                  expenseStatus === 'PAID'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                data-testid="btn-expense-status-paid"
              >
                ✓ Paga (Hoje)
              </button>
              <button
                type="button"
                onClick={() => setExpenseStatus('PENDING')}
                className={`py-1.5 px-3 text-xs font-bold rounded-lg transition ${
                  expenseStatus === 'PENDING'
                    ? 'bg-white text-amber-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                data-testid="btn-expense-status-pending"
              >
                ⏱ A Pagar (Pendente)
              </button>
            </div>
          </div>

          {/* Modalidade: Única, Parcelada, Recorrente (Item 14 / AC-190) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Modalidade de Pagamento
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-xs">
              {[
                { key: 'single', label: 'Única' },
                { key: 'installments', label: 'Parcelada' },
                { key: 'recurring', label: 'Recorrente' },
              ].map((m) => {
                const isSelected = modality === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setModality(m.key as any)}
                    className={`py-1.5 px-2 rounded-lg font-bold transition text-center ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    data-testid={`btn-expense-modality-${m.key}`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuração Condicional da Modalidade */}
          {modality === 'installments' && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Número de Parcelas
              </label>
              <select
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(parseInt(e.target.value, 10))}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                data-testid="select-expense-installments"
              >
                {[2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                  <option key={n} value={n}>
                    {n}x de R$ {amountReais ? ((parseFloat(amountReais) || 0) / n).toFixed(2) : '0.00'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {modality === 'recurring' && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Repetir Mensalmente Por:
              </label>
              <select
                value={recurringMonths}
                onChange={(e) => setRecurringMonths(parseInt(e.target.value, 10))}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                data-testid="select-expense-recurring-months"
              >
                <option value={3}>3 meses</option>
                <option value={6}>6 meses (Semestral)</option>
                <option value={12}>12 meses (Anual)</option>
              </select>
            </div>
          )}

          {/* Seleção de Categoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Categoria
            </label>
            <div className="grid grid-cols-2 gap-2" data-testid="expense-categories-grid">
              {categoriesList.map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`min-h-[44px] p-2.5 rounded-xl border text-left text-xs font-semibold transition flex items-center gap-2 ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                    data-testid={`btn-expense-cat-${cat.key.toLowerCase()}`}
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
                {expenseStatus === 'PAID' ? 'Data do Pagamento' : 'Data de Vencimento'}
              </label>
              <input
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-rose-500"
                aria-label={expenseStatus === 'PAID' ? 'Data do pagamento' : 'Data de vencimento'}
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
