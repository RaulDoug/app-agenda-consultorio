import React, { useState, useEffect, useMemo } from 'react';
import { InstallmentPlanItem } from '../../../db/repositories/financial-local-repository';

interface InstallmentsFormProps {
  totalCents: number;
  onChangePlan: (plan: InstallmentPlanItem[], isValid: boolean) => void;
  defaultFirstDueDate?: string; // YYYY-MM-DD
}

export const InstallmentsForm: React.FC<InstallmentsFormProps> = ({
  totalCents,
  onChangePlan,
  defaultFirstDueDate,
}) => {
  const [entryReais, setEntryReais] = useState<string>('0');
  const [installmentsCount, setInstallmentsCount] = useState<number>(3);

  // Data inicial padrão: daqui a 30 dias
  const [firstDueDate, setFirstDueDate] = useState<string>(() => {
    if (defaultFirstDueDate) return defaultFirstDueDate;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const entryCents = useMemo(() => {
    const val = parseFloat(entryReais) || 0;
    return Math.max(0, Math.round(val * 100));
  }, [entryReais]);

  const isEntryInvalid = entryCents > totalCents;

  const plan = useMemo(() => {
    if (isEntryInvalid) return [];

    const items: InstallmentPlanItem[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // Entrada à vista se houver
    if (entryCents > 0) {
      items.push({
        installmentNumber: 0,
        totalInstallments: installmentsCount,
        dueDate: todayStr,
        amountCents: entryCents,
        status: 'PAID',
        paymentDate: todayStr,
        description: 'Entrada (Hoje)',
      });
    }

    const remainingCents = totalCents - entryCents;
    if (remainingCents > 0 && installmentsCount > 0) {
      const baseShare = Math.floor(remainingCents / installmentsCount);
      const remainder = remainingCents % installmentsCount;

      const [yStr, mStr, dStr] = firstDueDate.split('-');
      const baseYear = parseInt(yStr, 10);
      const baseMonth = parseInt(mStr, 10) - 1; // 0-indexed
      const baseDay = parseInt(dStr, 10);

      for (let i = 0; i < installmentsCount; i++) {
        // Avançar meses respeitando a virada de ano
        const instDate = new Date(baseYear, baseMonth + i, baseDay);
        // Formato YYYY-MM-DD
        const year = instDate.getFullYear();
        const month = String(instDate.getMonth() + 1).padStart(2, '0');
        const day = String(instDate.getDate()).padStart(2, '0');
        const dueDate = `${year}-${month}-${day}`;

        const amountCents = i < remainder ? baseShare + 1 : baseShare;

        items.push({
          installmentNumber: i + 1,
          totalInstallments: installmentsCount,
          dueDate,
          amountCents,
          status: 'PENDING',
          paymentDate: null,
          description: `Parcela ${i + 1}/${installmentsCount}`,
        });
      }
    }

    return items;
  }, [totalCents, entryCents, installmentsCount, firstDueDate, isEntryInvalid]);

  useEffect(() => {
    onChangePlan(plan, !isEntryInvalid);
  }, [plan, isEntryInvalid, onChangePlan]);

  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3" data-testid="installments-form">
      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
        Configuração do Parcelamento
      </div>

      {isEntryInvalid && (
        <div
          data-testid="entry-invalid-error"
          className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-lg font-medium"
        >
          O valor da entrada (R$ {(entryCents / 100).toFixed(2)}) não pode ser superior ao valor total cobrado (R$ {(totalCents / 100).toFixed(2)}).
        </div>
      )}

      {/* Entrada e Quantidade de Parcelas */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Entrada (Hoje)
          </label>
          <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-teal-500">
            <span className="text-xs font-bold text-slate-500 mr-1">R$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={entryReais}
              onChange={(e) => setEntryReais(e.target.value)}
              placeholder="0.00"
              className="w-full text-xs font-mono font-bold text-slate-900 bg-transparent focus:outline-none"
              aria-label="Valor de entrada"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nº de Parcelas
          </label>
          <select
            value={installmentsCount}
            onChange={(e) => setInstallmentsCount(parseInt(e.target.value, 10))}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Número de parcelas"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map((n) => (
              <option key={n} value={n}>
                {n}x {entryCents > 0 ? '+ Entrada' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data da Primeira Parcela */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Vencimento da 1ª Parcela
        </label>
        <input
          type="date"
          value={firstDueDate}
          onChange={(e) => setFirstDueDate(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-teal-500"
          aria-label="Vencimento da primeira parcela"
        />
      </div>

      {/* Prévia Detalhada das Parcelas */}
      {!isEntryInvalid && plan.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
            Prévia das Parcelas ({plan.length} movimentações)
          </div>
          <div
            className="divide-y divide-slate-200/60 border border-slate-200 rounded-lg bg-white overflow-hidden max-h-36 overflow-y-auto"
            data-testid="installments-preview"
          >
            {plan.map((item, idx) => (
              <div
                key={idx}
                className="p-2 flex items-center justify-between text-xs hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-400'
                    }`}
                  />
                  <span className="font-semibold text-slate-800">{item.description}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({item.dueDate})
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  R$ {(item.amountCents / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
