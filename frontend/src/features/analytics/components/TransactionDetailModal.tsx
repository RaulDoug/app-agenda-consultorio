import React, { useState, useEffect, useMemo } from 'react';
import { LocalFinancialTransaction } from '../../../db/types';
import { X, CheckCircle2, Clock, AlertTriangle, Trash2, RotateCcw, Save, Lock } from 'lucide-react';

const EXPENSE_CATEGORIES = [
  { value: 'MATERIAIS', label: '📦 Materiais & Insumos' },
  { value: 'ALUGUEL', label: '🏢 Aluguel & Contas' },
  { value: 'LABORATORIO', label: '🔬 Laboratório & Prótese' },
  { value: 'EQUIPAMENTOS', label: '⚙️ Equipamentos & Manutenção' },
  { value: 'MARKETING', label: '📢 Marketing & Divulgação' },
  { value: 'FOLHA', label: '👥 Folha & Pessoal' },
  { value: 'OUTROS', label: '🏷️ Outras Despesas' },
];

interface TransactionDetailModalProps {
  isOpen: boolean;
  transaction: LocalFinancialTransaction | null;
  patientName?: string;
  patientPhone?: string;
  isAppointmentCompleted?: boolean;
  procedureName?: string;
  onClose: () => void;
  onSave?: (updates: Partial<LocalFinancialTransaction>) => Promise<void>;
  onSettle?: (paymentMethod: string, paymentDate: string, amountCents: number) => Promise<void>;
  onRevert?: () => Promise<void>;
  onDelete?: () => Promise<void>;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  transaction,
  patientName,
  patientPhone,
  isAppointmentCompleted = false,
  procedureName,
  onClose,
  onSave,
  onSettle,
  onRevert,
  onDelete,
}) => {
  const serviceName = useMemo(() => {
    if (procedureName && procedureName.trim()) return procedureName.trim();
    if (
      transaction?.description &&
      transaction.description !== 'Atendimento Concluído' &&
      transaction.description !== 'Entrada Checkout'
    ) {
      return transaction.description;
    }
    return 'Atendimento Padrão';
  }, [procedureName, transaction]);

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ATENDIMENTO');
  const [dueDate, setDueDate] = useState('');
  const [amountReais, setAmountReais] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');

  // Estado para fluxo de Baixa
  const [isSettling, setIsSettling] = useState(false);
  const [settleMethod, setSettleMethod] = useState('PIX');
  const [settleDate, setSettleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [settleAmountReais, setSettleAmountReais] = useState('');

  // Estado para fluxo de Estorno (Q-001)
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [revertCheckbox, setRevertCheckbox] = useState(false);

  // Estado para exclusão (Soft-delete)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const parseDateToInputFormat = (val?: string | null): string => {
    if (!val) return '';
    return String(val).split('T')[0];
  };

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description || '');
      setCategory(
        transaction.type === 'INCOME'
          ? serviceName
          : (transaction.category || 'MATERIAIS')
      );
      setDueDate(parseDateToInputFormat(transaction.due_date));
      setAmountReais((transaction.amount_cents / 100).toFixed(2));
      setPaymentMethod(transaction.payment_method || 'PIX');

      // Baixa inicial
      setSettleMethod(transaction.payment_method || 'PIX');
      setSettleDate(new Date().toISOString().split('T')[0]);
      setSettleAmountReais((transaction.amount_cents / 100).toFixed(2));

      setShowRevertConfirm(false);
      setRevertCheckbox(false);
      setShowDeleteConfirm(false);
      setIsSettling(false);
      setErrorMsg('');
    }
  }, [transaction, isOpen, serviceName]);

  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === 'INCOME';
  const isPaid = transaction.status === 'PAID';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const val = parseFloat(amountReais);
    if (isNaN(val) || val < 0) {
      setErrorMsg('Informe um valor válido.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSave?.({
        description: description.trim(),
        category: isIncome ? serviceName : category.trim(),
        due_date: parseDateToInputFormat(dueDate),
        amount_cents: Math.round(val * 100),
        payment_method: paymentMethod,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar alterações.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSettle = async () => {
    if (isSubmitting) return;
    const val = parseFloat(settleAmountReais);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Informe um valor válido para quitação.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSettle?.(settleMethod, settleDate, Math.round(val * 100));
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar baixa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRevert = async () => {
    if (isAppointmentCompleted && !revertCheckbox) return;
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onRevert?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao estornar pagamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onDelete?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao excluir lançamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      data-testid="transaction-detail-modal"
    >
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Detalhes do Lançamento</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isPaid ? 'Pago' : 'Pendente'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isIncome ? 'Receita (Entrada)' : 'Despesa (Saída)'} • ID: {transaction.id.slice(0, 8)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            aria-label="Fechar detalhes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* Informações do Paciente se vinculado */}
        {patientName && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-teal-900">Paciente: {patientName}</span>
              {patientPhone && (
                <div className="text-[11px] text-teal-700 font-mono mt-0.5">{patientPhone}</div>
              )}
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-200 text-teal-800 uppercase">
              Consulta
            </span>
          </div>
        )}

        {/* Formulário de Edição */}
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-900"
              aria-label="Descrição do lançamento"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isIncome ? 'Procedimento/Serviço' : 'Categoria'}
              </label>
              {isIncome ? (
                <div className="relative">
                  <input
                    type="text"
                    value={serviceName}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 pr-8 text-xs border border-slate-200 bg-slate-100 text-slate-700 rounded-lg font-medium cursor-not-allowed select-none"
                    aria-label="Procedimento/Serviço"
                    title="Serviço prestado no agendamento"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-900 bg-white cursor-pointer"
                  aria-label="Categoria"
                  data-testid="select-expense-category"
                  required
                >
                  {!EXPENSE_CATEGORIES.some((c) => c.value === category) && category && (
                    <option value={category}>{category}</option>
                  )}
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vencimento</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-slate-800"
                aria-label="Data de vencimento"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountReais}
                onChange={(e) => setAmountReais(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold text-slate-900"
                aria-label="Valor em reais"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800 bg-white"
                aria-label="Forma de pagamento"
              >
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO_DEBITO">Débito</option>
                <option value="CARTAO_CREDITO">Crédito</option>
                <option value="BOLETO">Boleto</option>
              </select>
            </div>
          </div>

          {transaction.payment_date && (
            <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded-lg border border-slate-200">
              Quitado em: {new Date(transaction.payment_date).toLocaleDateString('pt-BR')} às{' '}
              {new Date(transaction.payment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Alterações
            </button>
          </div>
        </form>

        <hr className="border-slate-100" />

        {/* SEÇÃO: DAR BAIXA (Se Pendente) */}
        {!isPaid && (
          <div className="space-y-3 p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl" data-testid="section-settle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Realizar Baixa / Quitar
              </div>
              {!isSettling && (
                <button
                  type="button"
                  data-testid="btn-open-settle"
                  onClick={() => setIsSettling(true)}
                  className="px-3 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition"
                >
                  Dar Baixa Agora
                </button>
              )}
            </div>

            {isSettling && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Forma de Pagto</label>
                    <select
                      value={settleMethod}
                      onChange={(e) => setSettleMethod(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                      data-testid="select-settle-method"
                    >
                      <option value="PIX">PIX</option>
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="CARTAO_DEBITO">Débito</option>
                      <option value="CARTAO_CREDITO">Crédito</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Data Pagto</label>
                    <input
                      type="date"
                      value={settleDate}
                      onChange={(e) => setSettleDate(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                      data-testid="input-settle-date"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Valor Efetivo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={settleAmountReais}
                      onChange={(e) => setSettleAmountReais(e.target.value)}
                      className="w-full p-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                      data-testid="input-settle-amount"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsSettling(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    data-testid="btn-confirm-settle"
                    onClick={handleConfirmSettle}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition"
                  >
                    Confirmar Baixa
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEÇÃO: ESTORNO DE PAGAMENTO (Se Pago) — Regra Q-001 */}
        {isPaid && (
          <div className="space-y-3 p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl" data-testid="section-revert">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                Estorno de Pagamento
              </div>
              {!showRevertConfirm && (
                <button
                  type="button"
                  data-testid="btn-start-revert"
                  onClick={() => setShowRevertConfirm(true)}
                  className="px-3 py-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition"
                >
                  Estornar Pagamento
                </button>
              )}
            </div>

            {showRevertConfirm && (
              <div className="space-y-3 pt-2">
                {isAppointmentCompleted && (
                  <div
                    data-testid="revert-completed-warning"
                    className="p-3 bg-amber-100/70 border border-amber-300 rounded-lg text-amber-900 text-xs space-y-2"
                  >
                    <div className="flex items-start gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>Atenção: A consulta vinculada a este lançamento já está concluída.</span>
                    </div>
                    <label className="flex items-start gap-2 cursor-pointer font-medium text-[11px] text-amber-950">
                      <input
                        type="checkbox"
                        checked={revertCheckbox}
                        onChange={(e) => setRevertCheckbox(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-amber-600 rounded border-amber-400 focus:ring-amber-500"
                        data-testid="checkbox-confirm-revert"
                      />
                      <span>
                        Estou ciente de que a consulta está concluída e desejo estornar o pagamento mesmo assim, tornando o lançamento pendente.
                      </span>
                    </label>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRevertConfirm(false);
                      setRevertCheckbox(false);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    data-testid="btn-confirm-revert"
                    onClick={handleConfirmRevert}
                    disabled={isSubmitting || (isAppointmentCompleted && !revertCheckbox)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                      isAppointmentCompleted && !revertCheckbox
                        ? 'bg-amber-300 text-amber-700 cursor-not-allowed'
                        : 'bg-amber-700 hover:bg-amber-800 text-white'
                    }`}
                  >
                    Confirmar Estorno
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEÇÃO: EXCLUSÃO (Soft-delete) */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          {!showDeleteConfirm ? (
            <button
              type="button"
              data-testid="btn-start-delete"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir Lançamento
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full justify-between bg-rose-50 p-2 rounded-lg border border-rose-200">
              <span className="text-xs text-rose-800 font-semibold">Confirmar exclusão?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-1 text-xs text-slate-600"
                >
                  Não
                </button>
                <button
                  type="button"
                  data-testid="btn-confirm-delete"
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                  className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
