import React, { useState } from 'react';
import { CheckCircle2, X, Calendar, CreditCard } from 'lucide-react';

interface BatchSettleModalProps {
  isOpen: boolean;
  selectedCount: number;
  totalCents: number;
  title?: string;
  onClose: () => void;
  onConfirm: (paymentMethod: string, paymentDate: string) => Promise<void> | void;
}

export const BatchSettleModal: React.FC<BatchSettleModalProps> = ({
  isOpen,
  selectedCount,
  totalCents,
  title,
  onClose,
  onConfirm,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'DINHEIRO' | 'DEBITO' | 'CREDITO'>('PIX');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const totalReais = (totalCents / 100).toFixed(2);
  const modalTitle = title || (selectedCount > 1 ? 'Quitação de Parcelas em Lote' : 'Baixa de Parcela');

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm(paymentMethod, paymentDate);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentOptions: { id: 'PIX' | 'DINHEIRO' | 'DEBITO' | 'CREDITO'; label: string }[] = [
    { id: 'PIX', label: 'PIX' },
    { id: 'DINHEIRO', label: 'Dinheiro' },
    { id: 'DEBITO', label: 'Débito' },
    { id: 'CREDITO', label: 'Crédito' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-settle-title"
      data-testid="batch-settle-modal"
    >
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
        {/* Barra superior de arrasto mobile */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden -mt-1 mb-2" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <h3 id="batch-settle-title" className="text-base font-bold text-slate-900">
              {modalTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo Financeiro */}
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              {selectedCount} parcela(s) selecionada(s)
            </div>
            <div className="text-xs text-emerald-600 mt-0.5">Total a receber</div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-emerald-950">
            R$ {totalReais}
          </div>
        </div>

        {/* Data do Pagamento */}
        <div className="space-y-1.5">
          <label htmlFor="batch-payment-date" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            Data do Pagamento
          </label>
          <input
            id="batch-payment-date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            data-testid="input-batch-payment-date"
          />
        </div>

        {/* Forma de Pagamento com botões touch >= 44px */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-slate-500" />
            Forma de Pagamento
          </label>
          <div className="grid grid-cols-2 gap-2" data-testid="payment-methods-grid">
            {paymentOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPaymentMethod(opt.id)}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center ${
                  paymentMethod === opt.id
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                data-testid={`btn-method-${opt.id.toLowerCase()}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ações inferiores na zona do polegar */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[48px] px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-2 min-h-[48px] px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-2"
            data-testid="btn-confirm-batch-settle"
          >
            {isSubmitting ? 'Gravando baixa...' : `Confirmar Baixa (R$ ${totalReais})`}
          </button>
        </div>
      </div>
    </div>
  );
};
