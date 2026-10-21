import React, { useState, useMemo } from 'react';
import {
  LocalFinancialTransaction,
  LocalPatient,
  LocalAppointment,
  LocalProcedure,
  LocalAppointmentItem,
} from '../../../db/types';
import { CashFilterPeriod, filterTransactionsByPeriod, calculateCashMetrics } from '../utils/cash-calculator';
import { ReceivablesList } from './ReceivablesList';
import { FinancialLedger } from './FinancialLedger';
import { FinancialLocalRepository, financialLocalRepo } from '../../../db/repositories/financial-local-repository';
import { LayoutDashboard, ReceiptText } from 'lucide-react';

interface CashFlowDashboardProps {
  transactions: LocalFinancialTransaction[];
  patients?: LocalPatient[];
  appointments?: LocalAppointment[];
  procedures?: LocalProcedure[];
  appointmentItems?: LocalAppointmentItem[];
  financialRepo?: FinancialLocalRepository;
  token?: string;
  onTransactionUpdated?: () => void;
}

export const CashFlowDashboard: React.FC<CashFlowDashboardProps> = ({
  transactions,
  patients,
  appointments,
  procedures,
  appointmentItems,
  financialRepo = financialLocalRepo,
  token,
  onTransactionUpdated,
}) => {
  const [viewMode, setViewMode] = useState<'overview' | 'ledger'>('overview');
  const [period, setPeriod] = useState<CashFilterPeriod>('this_month');

  // Filtra transações pelo período selecionado
  const filteredTransactions = useMemo(() => {
    return filterTransactionsByPeriod(transactions, period);
  }, [transactions, period]);

  // Calcula indicadores DRE
  const metrics = useMemo(() => {
    return calculateCashMetrics(filteredTransactions);
  }, [filteredTransactions]);

  const handleMarkPaid = async (txId: string, paymentMethod?: string, paymentDate?: string) => {
    try {
      if (paymentMethod) {
        await financialRepo.settleTransaction(txId, {
          paymentMethod,
          paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        });
      } else {
        await financialRepo.markAsPaid(txId);
      }
      onTransactionUpdated?.();
    } catch (err) {
      console.error('Erro ao dar baixa na parcela:', err);
    }
  };

  const handleSettleBatch = async (transactionIds: string[], paymentMethod: string, paymentDate: string) => {
    try {
      await financialRepo.settleBatch(transactionIds, paymentMethod, paymentDate, token);
      onTransactionUpdated?.();
    } catch (err) {
      console.error('Erro ao dar baixa em lote:', err);
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
      {/* Seletor Mobile-First: Resumo vs Extrato Completo */}
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode('overview')}
            className={`flex-1 sm:flex-initial min-h-[40px] px-3.5 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
              viewMode === 'overview'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            data-testid="tab-view-overview"
          >
            <LayoutDashboard className="w-4 h-4" />
            Visão Geral & Contas
          </button>
          <button
            type="button"
            onClick={() => setViewMode('ledger')}
            className={`flex-1 sm:flex-initial min-h-[40px] px-3.5 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
              viewMode === 'ledger'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            data-testid="tab-view-ledger"
          >
            <ReceiptText className="w-4 h-4" />
            Extrato (Livro Caixa)
          </button>
        </div>
      </div>

      {viewMode === 'ledger' ? (
        <FinancialLedger
          transactions={transactions}
          patients={patients}
          appointments={appointments}
          procedures={procedures}
          appointmentItems={appointmentItems}
          financialRepo={financialRepo}
          onTransactionUpdated={onTransactionUpdated}
        />
      ) : (
        <>
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
                    className={`min-h-[36px] px-2.5 py-1 rounded-md font-semibold transition ${
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

          {/* Lista de Contas a Receber com Baixa Rápida e Baixa em Lote */}
          <ReceivablesList
            transactions={transactions}
            onMarkPaid={handleMarkPaid}
            onSettleBatch={handleSettleBatch}
          />
        </>
      )}
    </div>
  );
};
