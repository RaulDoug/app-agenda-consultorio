import React, { useState, useMemo } from 'react';
import { LocalAppointmentWithDetails } from '../../agenda/types';
import { ItemForDiscount, splitDiscountProportionally, calculateDiscountFromPercentage } from '../utils/discount-splitter';
import { ItemPriceEditor } from './ItemPriceEditor';

export type PaymentMethod =
  | 'PIX'
  | 'DINHEIRO'
  | 'CARTAO_DEBITO'
  | 'CARTAO_CREDITO'
  | 'PARCELADO';

export interface CheckoutResult {
  appointmentId: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  paymentMethod: PaymentMethod;
  entryCents?: number;
  installmentsCount?: number;
  items: Array<{
    id: string;
    effectivePriceCents: number;
  }>;
}

interface CheckoutDrawerProps {
  isOpen: boolean;
  appointment: LocalAppointmentWithDetails | null;
  onClose: () => void;
  onCompleteCheckout: (result: CheckoutResult) => Promise<void> | void;
  onOpenReturnDrawer?: () => void;
  childrenInstallments?: React.ReactNode;
}

export const CheckoutDrawer: React.FC<CheckoutDrawerProps> = ({
  isOpen,
  appointment,
  onClose,
  onCompleteCheckout,
  onOpenReturnDrawer,
  childrenInstallments,
}) => {
  if (!isOpen || !appointment) return null;

  // Lista local de itens editáveis
  const [items, setItems] = useState<ItemForDiscount[]>(() => {
    if (appointment.procedures && appointment.procedures.length > 0) {
      return appointment.procedures.map((p) => ({
        id: p.id,
        name: p.name,
        basePriceCents: p.default_price_cents,
      }));
    }
    return [
      {
        id: crypto.randomUUID(),
        name: appointment.notes || 'Atendimento Geral',
        basePriceCents: 15000, // R$ 150,00
      },
    ];
  });

  const [discountType, setDiscountType] = useState<'reais' | 'percentual'>('reais');
  const [discountValueInput, setDiscountValueInput] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Subtotal base
  const subtotalCents = useMemo(() => {
    return items.reduce((acc, it) => acc + it.basePriceCents, 0);
  }, [items]);

  // Desconto calculado em centavos
  const calculatedDiscountCents = useMemo(() => {
    const rawVal = parseFloat(discountValueInput) || 0;
    if (rawVal <= 0) return 0;

    if (discountType === 'percentual') {
      return calculateDiscountFromPercentage(subtotalCents, rawVal);
    }
    return Math.round(rawVal * 100);
  }, [subtotalCents, discountType, discountValueInput]);

  // Rateio proporcional
  const splitResult = useMemo(() => {
    return splitDiscountProportionally(items, calculatedDiscountCents);
  }, [items, calculatedDiscountCents]);

  const handleUpdateItemPrice = (id: string, newPriceCents: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, basePriceCents: newPriceCents } : it))
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Ajustar total final diretamente calculando desconto correspondente
  const handleFinalTotalChange = (targetTotalReais: number) => {
    const targetCents = Math.round(targetTotalReais * 100);
    const neededDiscountCents = Math.max(0, subtotalCents - targetCents);
    setDiscountType('reais');
    setDiscountValueInput((neededDiscountCents / 100).toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (items.length === 0) {
      setErrorMsg('Não é possível concluir checkout sem procedimentos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onCompleteCheckout({
        appointmentId: appointment.id,
        subtotalCents: splitResult.subtotalCents,
        discountCents: splitResult.discountCents,
        totalCents: splitResult.totalCents,
        paymentMethod,
        items: splitResult.items.map((it) => ({
          id: it.id,
          effectivePriceCents: it.effectivePriceCents,
        })),
      });

      onClose();
      if (onOpenReturnDrawer) {
        onOpenReturnDrawer();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar fechamento');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up sm:animate-fade-in">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 id="checkout-title" className="font-bold text-slate-900 text-base">
              Checkout & Conclusão de Atendimento
            </h3>
            <p className="text-xs text-slate-500">
              Paciente: <span className="font-semibold text-slate-700">{appointment.patient_name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo do Formulário */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Editor de Procedimentos e Valores */}
          <ItemPriceEditor
            items={splitResult.items}
            onUpdateItemPrice={handleUpdateItemPrice}
            onRemoveItem={handleRemoveItem}
          />

          {/* Sessão de Desconto e Totalização */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal dos Itens:</span>
              <span className="font-mono font-semibold text-slate-800">
                R$ {(splitResult.subtotalCents / 100).toFixed(2)}
              </span>
            </div>

            {/* Campo de Desconto (R$ ou %) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Desconto:</span>
              <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden flex-1">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="px-2 py-1.5 text-xs bg-slate-100 border-r border-slate-300 text-slate-700 focus:outline-none"
                  aria-label="Tipo de desconto"
                >
                  <option value="reais">R$</option>
                  <option value="percentual">%</option>
                </select>
                <input
                  type="number"
                  step={discountType === 'reais' ? '0.01' : '1'}
                  min="0"
                  max={discountType === 'percentual' ? '100' : undefined}
                  value={discountValueInput}
                  onChange={(e) => setDiscountValueInput(e.target.value)}
                  placeholder="0.00"
                  className="px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 w-full focus:outline-none"
                  aria-label="Valor do desconto"
                />
              </div>

              {splitResult.discountCents > 0 && (
                <span className="text-xs font-bold text-amber-700 shrink-0">
                  - R$ {(splitResult.discountCents / 100).toFixed(2)}
                </span>
              )}
            </div>

            {/* Edição Rápida do Total Final com Rateio Automático */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800">Total Final Cobrado:</span>
              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-teal-500 shadow-2xs">
                <span className="text-xs font-bold text-teal-700">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={(splitResult.totalCents / 100).toFixed(2)}
                  onChange={(e) => handleFinalTotalChange(parseFloat(e.target.value) || 0)}
                  className="w-24 text-sm font-mono font-extrabold text-teal-900 bg-transparent focus:outline-none text-right"
                  aria-label="Total final"
                />
              </div>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(['PIX', 'DINHEIRO', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'PARCELADO'] as PaymentMethod[]).map(
                (method) => {
                  const isSelected = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2 rounded-lg text-xs font-semibold border transition text-center ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {method === 'CARTAO_DEBITO'
                        ? 'Débito'
                        : method === 'CARTAO_CREDITO'
                        ? 'Crédito'
                        : method === 'PARCELADO'
                        ? 'Parcelado'
                        : method}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Seletor ou Formulário de Parcelamento Injetado */}
          {paymentMethod === 'PARCELADO' && childrenInstallments}

          {/* Botões do Rodapé */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? 'Concluindo...' : 'Concluir Atendimento & Receber'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
