import React, { useState, useMemo } from 'react';
import { LocalAppointmentWithDetails } from '../../agenda/types';
import { ItemForDiscount, splitDiscountProportionally, calculateDiscountFromPercentage } from '../utils/discount-splitter';
import { ItemPriceEditor } from './ItemPriceEditor';
import { InstallmentsForm } from './InstallmentsForm';
import type { InstallmentPlanItem } from '../../../db/repositories/financial-local-repository';

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
  installments?: InstallmentPlanItem[];
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
  // Bloqueio de scroll do plano de fundo enquanto a gaveta estiver aberta (AC-094)
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Lista local de itens editáveis
  const [items, setItems] = useState<ItemForDiscount[]>(() => {
    if (appointment?.procedures && appointment.procedures.length > 0) {
      return appointment.procedures.map((p) => ({
        id: p.id,
        name: p.name,
        basePriceCents: p.default_price_cents,
      }));
    }
    if (appointment) {
      return [
        {
          id: crypto.randomUUID(),
          name: appointment.notes || 'Atendimento Geral',
          basePriceCents: 15000, // R$ 150,00
        },
      ];
    }
    return [];
  });

  const [discountType, setDiscountType] = useState<'reais' | 'percentual'>('percentual');
  const [discountValueInput, setDiscountValueInput] = useState<string>('0');
  const [targetTotalCents, setTargetTotalCents] = useState<number>(0);
  const [finalTotalInputStr, setFinalTotalInputStr] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [installmentPlan, setInstallmentPlan] = useState<InstallmentPlanItem[]>([]);
  const [isInstallmentsValid, setIsInstallmentsValid] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sincroniza itens quando appointment mudar
  React.useEffect(() => {
    let initialSubtotal = 0;
    if (appointment?.procedures && appointment.procedures.length > 0) {
      const initialItems = appointment.procedures.map((p) => ({
        id: p.id,
        name: p.name,
        basePriceCents: p.default_price_cents,
      }));
      setItems(initialItems);
      initialSubtotal = initialItems.reduce((acc, it) => acc + it.basePriceCents, 0);
    } else if (appointment) {
      const defaultItem = {
        id: crypto.randomUUID(),
        name: appointment.notes || 'Atendimento Geral',
        basePriceCents: 15000,
      };
      setItems([defaultItem]);
      initialSubtotal = defaultItem.basePriceCents;
    } else {
      setItems([]);
      initialSubtotal = 0;
    }
    setTargetTotalCents(initialSubtotal);
    setFinalTotalInputStr((initialSubtotal / 100).toFixed(2));
    setDiscountValueInput('0');
    setPaymentMethod('PIX');
    setErrorMsg('');
  }, [appointment?.id]);

  // Subtotal base fixo dos procedimentos
  const subtotalCents = useMemo(() => {
    return items.reduce((acc, it) => acc + it.basePriceCents, 0);
  }, [items]);

  // Diferença entre total desejado e subtotal de tabela
  const diffCents = targetTotalCents - subtotalCents;
  const percentDiff = subtotalCents > 0 ? (diffCents / subtotalCents) * 100 : 0;

  // Rateio proporcional sem modificar o valor de tabela dos itens
  const splitResult = useMemo(() => {
    if (items.length === 0 || subtotalCents === 0) {
      return {
        subtotalCents,
        discountCents: 0,
        totalCents: targetTotalCents,
        items: items.map((it) => ({
          id: it.id,
          name: it.name,
          basePriceCents: it.basePriceCents,
          discountCents: 0,
          effectivePriceCents: it.basePriceCents,
        })),
      };
    }

    if (diffCents < 0) {
      // Desconto proporcional
      const discountCents = Math.abs(diffCents);
      return splitDiscountProportionally(items, discountCents);
    }

    if (diffCents > 0) {
      // Acréscimo proporcional ponderado pelo valor de tabela dos itens
      let allocated = 0;
      return {
        subtotalCents,
        discountCents: 0,
        totalCents: targetTotalCents,
        items: items.map((it, idx) => {
          let itemAdd = 0;
          if (idx === items.length - 1) {
            itemAdd = diffCents - allocated;
          } else {
            itemAdd = Math.round((it.basePriceCents / subtotalCents) * diffCents);
            allocated += itemAdd;
          }
          return {
            id: it.id,
            name: it.name,
            basePriceCents: it.basePriceCents,
            discountCents: 0,
            effectivePriceCents: it.basePriceCents + itemAdd,
          };
        }),
      };
    }

    // Exatamente igual
    return {
      subtotalCents,
      discountCents: 0,
      totalCents: subtotalCents,
      items: items.map((it) => ({
        id: it.id,
        name: it.name,
        basePriceCents: it.basePriceCents,
        discountCents: 0,
        effectivePriceCents: it.basePriceCents,
      })),
    };
  }, [items, subtotalCents, diffCents, targetTotalCents]);

  const handleUpdateItemPrice = (id: string, newPriceCents: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, basePriceCents: newPriceCents } : it))
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Ajustar total final diretamente sem alterar o preço base do procedimento
  const handleFinalTotalChange = (str: string) => {
    setFinalTotalInputStr(str);
    const parsed = parseFloat(str);
    if (isNaN(parsed) || parsed < 0) return;

    const newTargetCents = Math.round(parsed * 100);
    setTargetTotalCents(newTargetCents);

    const diff = newTargetCents - subtotalCents;
    if (subtotalCents > 0) {
      const pct = (diff / subtotalCents) * 100;
      if (discountType === 'percentual') {
        setDiscountValueInput(pct === 0 ? '0' : (pct > 0 ? `+${pct.toFixed(1)}` : `${pct.toFixed(1)}`));
      } else {
        setDiscountValueInput(diff === 0 ? '0' : (diff > 0 ? `+${(diff / 100).toFixed(2)}` : `${(diff / 100).toFixed(2)}`));
      }
    }
  };

  const handleFinalTotalBlur = () => {
    const parsed = parseFloat(finalTotalInputStr);
    if (isNaN(parsed) || parsed < 0) {
      setFinalTotalInputStr((targetTotalCents / 100).toFixed(2));
    } else {
      setFinalTotalInputStr(parsed.toFixed(2));
    }
  };

  // Ajustar pelo campo de desconto / acréscimo
  const handleDiscountInputChange = (str: string) => {
    setDiscountValueInput(str);
    const parsed = parseFloat(str);
    if (isNaN(parsed)) return;

    let newTarget = subtotalCents;
    if (discountType === 'percentual') {
      newTarget = Math.max(0, Math.round(subtotalCents * (1 + parsed / 100)));
    } else {
      newTarget = Math.max(0, subtotalCents + Math.round(parsed * 100));
    }
    setTargetTotalCents(newTarget);
    setFinalTotalInputStr((newTarget / 100).toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !appointment) return;

    if (items.length === 0) {
      setErrorMsg('Não é possível concluir checkout sem procedimentos.');
      return;
    }

    if (paymentMethod === 'PARCELADO') {
      if (!isInstallmentsValid || installmentPlan.length === 0) {
        setErrorMsg('Por favor, configure o parcelamento corretamente.');
        return;
      }
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
        installments: paymentMethod === 'PARCELADO' ? installmentPlan : undefined,
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

  if (!isOpen || !appointment) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up sm:animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
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

            {/* Variação de Valor (Desconto ou Acréscimo) */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-xs font-semibold text-slate-700">
                {diffCents > 0 ? 'Acréscimo:' : 'Desconto:'}
              </span>
              <div className="flex items-center gap-2">
                {diffCents === 0 && (
                  <span className="text-xs font-mono text-slate-400">
                    0.0% (R$ 0.00)
                  </span>
                )}
                {diffCents < 0 && (
                  <span className="text-xs font-bold text-amber-700 font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    - R$ {(Math.abs(diffCents) / 100).toFixed(2)} ({percentDiff.toFixed(1)}%)
                  </span>
                )}
                {diffCents > 0 && (
                  <span className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    + R$ {(diffCents / 100).toFixed(2)} (+{percentDiff.toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>

            {/* Edição Rápida do Total Final com Rateio Automático */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Total Final Cobrado:</span>
                <span className="text-[10px] text-slate-500">Ajuste o valor final diretamente</span>
              </div>
              <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border-2 border-teal-500 shadow-2xs focus-within:ring-2 focus-within:ring-teal-500/20">
                <span className="text-xs font-bold text-teal-700">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={finalTotalInputStr}
                  onChange={(e) => handleFinalTotalChange(e.target.value)}
                  onBlur={handleFinalTotalBlur}
                  className="w-28 text-base font-mono font-extrabold text-teal-900 bg-transparent focus:outline-none text-right"
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
          {paymentMethod === 'PARCELADO' && (
            childrenInstallments || (
              <InstallmentsForm
                totalCents={splitResult.totalCents}
                onChangePlan={(plan, isValid) => {
                  setInstallmentPlan(plan);
                  setIsInstallmentsValid(isValid);
                }}
              />
            )
          )}

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
              disabled={
                isSubmitting ||
                items.length === 0 ||
                (paymentMethod === 'PARCELADO' && (!isInstallmentsValid || installmentPlan.length === 0))
              }
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
