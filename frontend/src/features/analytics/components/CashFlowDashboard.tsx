import React, { useState, useMemo } from 'react';
import { LocalFinancialTransaction } from '../../../db/types';
import { CashFilterPeriod, filterTransactionsByPeriod, calculateCashMetrics } from '../utils/cash-calculator';
import { ReceivablesList } from './ReceivablesList';
import { FinancialLocalRepository, financialLocalRepo } from '../../../db/repositories/financial-local-repository';

interface CashFlowDashboardProps {
  transactions: LocalFinancialTransaction[];
  financialRepo?: FinancialLocalRepository;
  onTransactionUpdated?: () => void;
}

export const CashFlowDashboard: React.FC<CashFlowDashboardProps> = ({
  transactions,
  financialRepo = financialLocalRepo,
  onTransactionUpdated,
}) => {
  const [period, setPeriod] = useState<CashFilterPeriod>('this_month');

  // Filtra transações pelo período selecionado
  const filteredTransactions = useMemo(() => {
    return filterTransactionsByPeriod(transactions, period);
  }, [transactions, period]);

  // Calcula indicadores DRE
  const metrics = useMemo(() => {
    return calculateCashMetrics(filteredTransactions);
  }, [filteredTransactions]);

  const handleMarkPaid = async (txId: string) => {
    try {
      await financialRepo.markAsPaid(txId);
      onTransactionUpdated?.();
    } catch (err) {
      console.error('Erro ao dar baixa na parcela:', err);
    }
  };

  const formatReais = (cents: number) => {
    const isNegative = cents < 0;
    const abs = Math.abs(cents);
    const formatted = (abs / 100).toFixed(2);
    return isNegative ? `- R$ ${formatted}` : `R$ ${formatted}`;
  };

  return (
    <div className="space-y-4" data-testid="cash-flow-dashboard">
      {/* Seletor de Período Cumulativo */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <span className="text-xs font-bold text-slate-700">Período de Análise</span>
        <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
          {[
            { key: 'today', label: 'Hoje' },
            { key: 'this_month', label: 'Este Mês' },
            { key: 'last_30_days', label: 'Últimos 30d' },
            { key: 'all', label: 'Todos' },
          ].map((p) => {
            const isSelected = period === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key as any)}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  isSelected
                    ? 'bg-white text-teal-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de 4 Cards de Indicadores Financeiros */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Entrou no Caixa */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl" data-testid="card-income-paid">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Entrou no Caixa
          </div>
          <div className="text-lg font-mono font-extrabold text-emerald-950 mt-1">
            {formatReais(metrics.totalIncomePaidCents)}
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5">
            {metrics.incomeCount} recebimento(s) efetuado(s)
          </div>
        </div>

        {/* Card 2: A Receber no Mês (Parcelas) */}
        <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl" data-testid="card-receivables-pending">
          <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
            A Receber no Mês
          </div>
          <div className="text-lg font-mono font-extrabold text-sky-950 mt-1">
            {formatReais(metrics.totalReceivablesPendingCents)}
          </div>
          <div className="text-[10px] text-sky-700 mt-0.5">
            {metrics.pendingReceivablesCount} parcela(s) pendente(s)
          </div>
        </div>

        {/* Card 3: Despesas Pagas */}
        <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl" data-testid="card-expenses-paid">
          <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
            Despesas Pagas
          </div>
          <div className="text-lg font-mono font-extrabold text-rose-950 mt-1">
            {formatReais(metrics.totalExpensePaidCents)}
          </div>
          <div className="text-[10px] text-rose-700 mt-0.5">
            {metrics.expenseCount} despesa(s) quitada(s)
          </div>
        </div>

        {/* Card 4: Lucro Líquido Real */}
        <div className="p-3.5 bg-teal-50/70 border border-teal-300 rounded-xl" data-testid="card-net-profit">
          <div className="text-[11px] font-bold text-teal-900 uppercase tracking-wider">
            Lucro Líquido Real
          </div>
          <div className="text-lg font-mono font-extrabold text-teal-950 mt-1">
            {formatReais(metrics.netProfitCents)}
          </div>
          <div className="text-[10px] text-teal-700 mt-0.5">
            Resultado real apurado
          </div>
        </div>
      </div>

      {/* Lista de Contas a Receber com Baixa Rápida */}
      <ReceivablesList transactions={transactions} onMarkPaid={handleMarkPaid} />
    </div>
  );
};
