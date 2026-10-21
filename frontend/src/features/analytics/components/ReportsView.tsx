import React, { useState, useMemo } from 'react';
import {
  LocalAppointment,
  LocalAppointmentItem,
  LocalProcedure,
  LocalFinancialTransaction,
  LocalPatient,
} from '../../../db/types';
import { CashFilterPeriod } from '../utils/cash-calculator';
import { calculateReportsDashboard } from '../utils/reports-calculator';
import { InactivePatientsList } from './InactivePatientsList';
import { ReportsApiClient, reportsApiClient } from '../../../services/reports-api';
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Calendar,
  Clock,
  Award,
  Users,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Database,
} from 'lucide-react';

interface ReportsViewProps {
  appointments: LocalAppointment[];
  appointmentItems: LocalAppointmentItem[];
  procedures: LocalProcedure[];
  transactions: LocalFinancialTransaction[];
  patients: LocalPatient[];
  token?: string;
  apiClient?: ReportsApiClient;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  appointments,
  appointmentItems,
  procedures,
  transactions,
  patients,
  token,
  apiClient = reportsApiClient,
}) => {
  const [period, setPeriod] = useState<CashFilterPeriod>('this_month');
  const [showInactiveList, setShowInactiveList] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'local' | 'server'>('local');
  const [isRevalidating, setIsRevalidating] = useState(false);

  // Sincroniza o token de autenticação no cliente de API de relatórios
  React.useEffect(() => {
    if (token && apiClient?.setToken) {
      apiClient.setToken(token);
    }
  }, [token, apiClient]);

  // Calcula todas as métricas gerenciais reativamente a partir do Dexie
  const localData = useMemo(() => {
    return calculateReportsDashboard(
      appointments,
      appointmentItems,
      procedures,
      transactions,
      patients,
      period
    );
  }, [appointments, appointmentItems, procedures, transactions, patients, period]);

  const [serverData, setServerData] = useState<any>(null);

  const data = serverData && syncStatus === 'server' ? { ...localData, ...serverData } : localData;

  const handleRevalidate = async () => {
    setIsRevalidating(true);
    try {
      const [noShow, dre, recv] = await Promise.all([
        apiClient.getNoShow(period),
        apiClient.getDRE(period),
        apiClient.getReceivables(),
      ]);
      setServerData({
        noShowRate: noShow.no_show_rate,
        noShowCount: noShow.no_show_count,
        lostRevenueCents: noShow.lost_estimated_cents,
        netProfitCents: dre.net_profit_cents,
        totalIncomePaidCents: dre.total_income_paid_cents,
        totalExpensePaidCents: dre.total_expense_paid_cents,
        marginPercent: dre.margin_percentage,
        receivablesNext30Cents: recv.pending_next_30_cents,
        receivablesNext60Cents: recv.pending_next_60_cents,
        receivablesNext90Cents: recv.pending_next_90_cents,
      });
      setSyncStatus('server');
    } catch {
      // Falha transparente: permanece no modo local
      setSyncStatus('local');
    } finally {
      setIsRevalidating(false);
    }
  };

  const formatReais = (cents: number) => {
    const isNegative = cents < 0;
    const abs = Math.abs(cents);
    const formatted = (abs / 100).toFixed(2);
    return isNegative ? `- R$ ${formatted}` : `R$ ${formatted}`;
  };

  return (
    <div className="space-y-6" data-testid="reports-view-container">
      {/* Cabeçalho e Seletor de Período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-teal-600" />
              Relatórios & Indicadores Gerenciais
            </h2>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                syncStatus === 'server'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
              data-testid="badge-report-sync-source"
            >
              {syncStatus === 'server' ? '✓ Servidor Sincronizado' : '● Local (Offline-First)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe a lucratividade, comparecimento e retenção de pacientes em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleRevalidate}
            disabled={isRevalidating}
            className="min-h-[38px] px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            data-testid="btn-revalidate-reports"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            {isRevalidating ? 'Revalidando...' : 'Revalidar com Servidor'}
          </button>

          {/* Seletor de Período */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
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
                  onClick={() => {
                    setPeriod(p.key as CashFilterPeriod);
                    setSyncStatus('local');
                    setServerData(null);
                  }}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    isSelected
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid de Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Taxa de No-Show (Faltas) */}
        <div
          data-testid="metric-card-noshow"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Taxa de No-Show (Faltas)
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {data.noShow.noShowRate}%
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ({data.noShow.noShowCount} de {data.noShow.totalAppointments} consultas)
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Perda financeira estimada:</span>
            <span className="font-mono font-bold text-rose-600">
              {formatReais(data.noShow.lostEstimatedCents)}
            </span>
          </div>
        </div>

        {/* Card 2: DRE / Resultado Líquido */}
        <div
          data-testid="metric-card-dre"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Resultado Líquido (DRE)
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold font-mono ${
                data.dre.netProfitCents >= 0 ? 'text-teal-700' : 'text-rose-600'
              }`}
            >
              {formatReais(data.dre.netProfitCents)}
            </span>
            {data.dre.profitMarginPercent > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800">
                {data.dre.profitMarginPercent}% margem
              </span>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Receitas Pagas:</span>
              <span className="font-mono font-bold text-emerald-700 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {formatReais(data.dre.totalIncomePaidCents)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Despesas Pagas:</span>
              <span className="font-mono font-bold text-rose-600 flex items-center gap-0.5">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {formatReais(data.dre.totalExpensePaidCents)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Projeção de Recebíveis Futuros */}
        <div
          data-testid="metric-card-projection"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recebíveis Futuros (Parcelas)
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div>
            <span className="text-3xl font-extrabold text-blue-800 font-mono">
              {formatReais(data.projection.pendingNext30Cents)}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">previstos nos próximos 30 dias</span>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Em até 60 dias:</span>
              <span className="font-mono font-semibold text-slate-700">
                {formatReais(data.projection.pendingNext60Cents)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Em até 90 dias:</span>
              <span className="font-mono font-semibold text-slate-700">
                {formatReais(data.projection.pendingNext90Cents)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ranking de Procedimentos Mais Lucrativos e Realizados */}
      <div
        data-testid="procedures-ranking-table"
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-800">
              Procedimentos Mais Rentáveis e Realizados
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Baseado nas consultas concluídas
          </span>
        </div>

        {data.ranking.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl">
            Nenhum procedimento concluído no período selecionado.
          </div>
        ) : (
          <div className="space-y-3">
            {data.ranking.map((item: any, idx: number) => (
              <div
                key={item.procedureId}
                className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100 transition space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700'
                          : idx === 2
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="text-[11px] text-slate-400">
                      ({item.completedCount} {item.completedCount === 1 ? 'consulta' : 'consultas'})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block">
                      {formatReais(item.totalRevenueCents)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Média: {formatReais(item.averagePriceCents)}
                    </span>
                  </div>
                </div>

                {/* Barra de Participação Visual */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-teal-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, item.percentageShare))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Retenção & Pacientes Inativos */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowInactiveList((prev) => !prev)}
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-base text-slate-800">
                Oportunidades de Reativação (Pacientes Inativos)
              </h3>
              <p className="text-xs text-slate-500">
                Pacientes sem consulta há mais de 180 dias com atalho direto de WhatsApp para retorno preventivo.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform ${showInactiveList ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {showInactiveList && (
          <div className="pt-3 border-t border-slate-100">
            <InactivePatientsList patients={patients} appointments={appointments} />
          </div>
        )}
      </div>
    </div>
  );
};
