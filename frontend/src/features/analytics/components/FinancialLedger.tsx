import React, { useState, useMemo, useEffect } from 'react';
import {
  LocalFinancialTransaction,
  LocalPatient,
  LocalAppointment,
  LocalProcedure,
  LocalAppointmentItem,
} from '../../../db/types';
import { FinancialLocalRepository, financialLocalRepo } from '../../../db/repositories/financial-local-repository';
import { Download, Search, Filter, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, Calendar, X } from 'lucide-react';
import { TransactionDetailModal } from './TransactionDetailModal';

interface FinancialLedgerProps {
  transactions: LocalFinancialTransaction[];
  patients?: LocalPatient[];
  appointments?: LocalAppointment[];
  procedures?: LocalProcedure[];
  appointmentItems?: LocalAppointmentItem[];
  financialRepo?: FinancialLocalRepository;
  onTransactionUpdated?: () => void;
}

export type LedgerFilterType = 'all' | 'income' | 'expense' | 'pending';

const normalizeText = (text: string) => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export const FinancialLedger: React.FC<FinancialLedgerProps> = ({
  transactions,
  patients = [],
  appointments = [],
  procedures = [],
  appointmentItems = [],
  financialRepo = financialLocalRepo,
  onTransactionUpdated,
}) => {
  const [localProcedures, setLocalProcedures] = useState<LocalProcedure[]>(procedures);
  const [localAppItems, setLocalAppItems] = useState<LocalAppointmentItem[]>(appointmentItems);

  useEffect(() => {
    if (procedures.length > 0) setLocalProcedures(procedures);
    if (appointmentItems.length > 0) setLocalAppItems(appointmentItems);
  }, [procedures, appointmentItems]);

  useEffect(() => {
    let isMounted = true;
    if (financialRepo?.db && procedures.length === 0) {
      financialRepo.db.procedures.toArray().then((procs) => {
        if (isMounted && procs && procs.length > 0) setLocalProcedures(procs);
      }).catch(() => {});
    }
    if (financialRepo?.db && appointmentItems.length === 0) {
      financialRepo.db.appointment_items.toArray().then((items) => {
        if (isMounted && items && items.length > 0) setLocalAppItems(items);
      }).catch(() => {});
    }
    return () => { isMounted = false; };
  }, [financialRepo, procedures.length, appointmentItems.length]);

  const appProceduresMap = useMemo(() => {
    const map = new Map<string, string[]>();
    const procNameMap = new Map<string, string>();
    localProcedures.forEach((p) => procNameMap.set(p.id, p.name));

    localAppItems.forEach((item) => {
      const pName = procNameMap.get(item.procedure_id);
      if (pName) {
        const list = map.get(item.appointment_id) || [];
        list.push(pName);
        map.set(item.appointment_id, list);
      }
    });

    return map;
  }, [localAppItems, localProcedures]);
  const [filterType, setFilterType] = useState<LedgerFilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  const [specificDateFilter, setSpecificDateFilter] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<LocalFinancialTransaction | null>(null);

  // Mapeamentos para enriquecimento e busca rápida por cliente
  const appMap = useMemo(() => {
    const map = new Map<string, LocalAppointment>();
    appointments.forEach((a) => map.set(a.id, a));
    return map;
  }, [appointments]);

  const patientMap = useMemo(() => {
    const map = new Map<string, LocalPatient>();
    patients.forEach((p) => map.set(p.id, p));
    return map;
  }, [patients]);

  const getTransactionPatient = (tx: LocalFinancialTransaction) => {
    if (!tx.appointment_id) return null;
    const app = appMap.get(tx.appointment_id);
    if (!app) return null;
    return patientMap.get(app.patient_id) || null;
  };

  // Helper para aplicar atalhos rápidos de período
  const applyPreset = (preset: 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'all') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'today') {
      const todayStr = toIsoDate(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
      setMonthFilter('ALL');
      setSpecificDateFilter('');
    } else if (preset === 'this_week') {
      const dayOfWeek = now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      setStartDate(toIsoDate(start));
      setEndDate(toIsoDate(end));
      setMonthFilter('ALL');
      setSpecificDateFilter('');
    } else if (preset === 'this_month') {
      const y = now.getFullYear();
      const m = now.getMonth();
      const first = new Date(y, m, 1);
      const last = new Date(y, m + 1, 0);
      setStartDate(toIsoDate(first));
      setEndDate(toIsoDate(last));
      setMonthFilter(`${y}-${pad(m + 1)}`);
      setSpecificDateFilter('');
    } else if (preset === 'last_30_days') {
      const endStr = toIsoDate(now);
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      setStartDate(toIsoDate(start));
      setEndDate(endStr);
      setMonthFilter('ALL');
      setSpecificDateFilter('');
    } else {
      setStartDate('');
      setEndDate('');
      setMonthFilter('ALL');
      setSpecificDateFilter('');
    }
  };

  const handleMonthSelect = (m: string) => {
    setMonthFilter(m);
    setSpecificDateFilter('');
    if (m === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else {
      const [yStr, mStr] = m.split('-');
      const y = parseInt(yStr, 10);
      const mon = parseInt(mStr, 10);
      const lastDay = new Date(y, mon, 0).getDate();
      const pad = (n: number) => String(n).padStart(2, '0');
      setStartDate(`${y}-${pad(mon)}-01`);
      setEndDate(`${y}-${pad(mon)}-${pad(lastDay)}`);
    }
  };

  const handleSpecificDateChange = (val: string) => {
    setSpecificDateFilter(val);
    setStartDate(val);
    setEndDate(val);
    setMonthFilter('ALL');
  };

  // Lista de categorias distintas para o seletor
  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.category && tx.is_active && !tx.deleted_at) {
        set.add(tx.category.toUpperCase().trim());
      }
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Lista de meses disponíveis para o seletor
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.is_active && !tx.deleted_at) {
        const d = (tx.payment_date ? tx.payment_date.split('T')[0] : tx.due_date) || '';
        if (d.length >= 7) {
          set.add(d.slice(0, 7)); // YYYY-MM
        }
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Filtragem combinada
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => tx.is_active && !tx.deleted_at)
      .filter((tx) => {
        // Filtro por tipo/status
        if (filterType === 'income') return tx.type === 'INCOME';
        if (filterType === 'expense') return tx.type === 'EXPENSE';
        if (filterType === 'pending') return tx.status === 'PENDING';
        return true;
      })
      .filter((tx) => {
        // Filtro por categoria
        if (categoryFilter === 'ALL') return true;
        return (tx.category || '').toUpperCase().trim() === categoryFilter;
      })
      .filter((tx) => {
        const d = (tx.payment_date ? tx.payment_date.split('T')[0] : tx.due_date) || '';
        if (!d) return true;

        // Filtro por período (Data Inicial e Data Final)
        if (startDate && d < startDate) {
          return false;
        }
        if (endDate && d > endDate) {
          return false;
        }

        // Filtro por mês (quando não houver período manual definido)
        if (!startDate && !endDate && monthFilter !== 'ALL' && !d.startsWith(monthFilter)) {
          return false;
        }

        // Filtro por data específica legado
        if (!startDate && !endDate && specificDateFilter && d !== specificDateFilter) {
          return false;
        }

        return true;
      })
      .filter((tx) => {
        // Busca textual com normalização de acentos e busca por nome do cliente
        if (!searchTerm.trim()) return true;
        const term = normalizeText(searchTerm);
        const desc = normalizeText(tx.description || '');
        const cat = normalizeText(tx.category || '');
        const method = normalizeText(tx.payment_method || '');

        const patient = getTransactionPatient(tx);
        const patientName = patient ? normalizeText(patient.name) : '';
        const patientPhone = patient?.whatsapp ? normalizeText(patient.whatsapp) : '';

        return (
          desc.includes(term) ||
          cat.includes(term) ||
          method.includes(term) ||
          patientName.includes(term) ||
          patientPhone.includes(term)
        );
      })
      .sort((a, b) => {
        const dateA = a.payment_date || a.due_date;
        const dateB = b.payment_date || b.due_date;
        return dateB.localeCompare(dateA);
      });
  }, [transactions, filterType, categoryFilter, startDate, endDate, monthFilter, specificDateFilter, searchTerm, appMap, patientMap]);

  // Exportação CSV com colunas de Nome e Telefone do Cliente para receitas
  const handleExportCsv = () => {
    const headers = [
      'Data',
      'Descricao',
      'Categoria',
      'Tipo',
      'Status',
      'Valor_RS',
      'Cliente_Nome',
      'Cliente_Telefone',
    ];
    const rows = filteredTransactions.map((tx) => {
      const date = tx.payment_date ? tx.payment_date.split('T')[0] : tx.due_date;
      const desc = `"${(tx.description || '').replace(/"/g, '""')}"`;
      const cat = tx.category || 'GERAL';
      const type = tx.type === 'INCOME' ? 'Receita' : 'Despesa';
      const status = tx.status === 'PAID' ? 'Pago' : 'Pendente';
      const val = (tx.amount_cents / 100).toFixed(2).replace('.', ',');

      const patient = getTransactionPatient(tx);
      const clientName = tx.type === 'INCOME' && patient ? `"${patient.name.replace(/"/g, '""')}"` : '';
      const clientPhone = tx.type === 'INCOME' && patient ? (patient.whatsapp || '') : '';

      return [date, desc, cat, type, status, val, clientName, clientPhone].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `extrato-financeiro-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatReais = (cents: number, type: 'INCOME' | 'EXPENSE') => {
    const formatted = (cents / 100).toFixed(2);
    return type === 'INCOME' ? `+ R$ ${formatted}` : `- R$ ${formatted}`;
  };

  const selectedPatient = selectedTx ? getTransactionPatient(selectedTx) : null;
  const selectedApp = selectedTx?.appointment_id ? appMap.get(selectedTx.appointment_id) : null;

  const selectedProcedureName = useMemo(() => {
    if (!selectedTx) return undefined;
    if (selectedTx.appointment_id) {
      const procs = appProceduresMap.get(selectedTx.appointment_id);
      if (procs && procs.length > 0) {
        return procs.join(', ');
      }
    }
    return undefined;
  }, [selectedTx, appProceduresMap]);

  return (
    <div className="space-y-4" data-testid="financial-ledger">
      {/* Barra de Ações: Filtro de Abas e Exportação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Pílulas de Filtro com scroll horizontal suave */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-slate-100 rounded-xl text-xs shrink-0">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'income', label: 'Receitas' },
            { key: 'expense', label: 'Despesas' },
            { key: 'pending', label: 'Pendentes' },
          ].map((tab) => {
            const isSelected = filterType === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterType(tab.key as LedgerFilterType)}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                data-testid={`filter-tab-${tab.key}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Botão Exportar CSV */}
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={filteredTransactions.length === 0}
          className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 disabled:opacity-50 rounded-xl transition shadow-2xs self-start sm:self-auto"
          data-testid="btn-export-csv"
        >
          <Download className="w-4 h-4 text-teal-700" />
          Exportar CSV
        </button>
      </div>

      {/* Filtros Temporais e Busca Avançada */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Busca Textual */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição, paciente..."
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              data-testid="input-ledger-search"
            />
          </div>

          {/* Filtro de Categoria */}
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] appearance-none"
              data-testid="select-ledger-category"
            >
              <option value="ALL">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Período: Data Inicial */}
          <div className="relative flex items-center">
            <span className="absolute left-3 text-[11px] font-bold text-slate-400 pointer-events-none">
              De:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setMonthFilter('ALL');
                setSpecificDateFilter('');
              }}
              className="w-full pl-10 pr-2 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] font-mono text-slate-700"
              data-testid="input-ledger-start-date"
              aria-label="Data inicial"
            />
          </div>

          {/* Filtro por Período: Data Final */}
          <div className="relative flex items-center">
            <span className="absolute left-3 text-[11px] font-bold text-slate-400 pointer-events-none">
              Até:
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setMonthFilter('ALL');
                setSpecificDateFilter('');
              }}
              className="w-full pl-10 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] font-mono text-slate-700"
              data-testid="input-ledger-end-date"
              aria-label="Data final"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setMonthFilter('ALL');
                  setSpecificDateFilter('');
                }}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded transition"
                title="Limpar período"
                aria-label="Limpar período"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Atalhos Rápidos de Período e Seletor de Mês */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Atalhos:</span>
            {[
              { label: 'Hoje', action: () => applyPreset('today') },
              { label: 'Esta Semana', action: () => applyPreset('this_week') },
              { label: 'Este Mês', action: () => applyPreset('this_month') },
              { label: 'Últimos 30d', action: () => applyPreset('last_30_days') },
              { label: 'Limpar', action: () => applyPreset('all') },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={preset.action}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition active:scale-95"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Seletor Rápido de Mês */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={monthFilter}
              onChange={(e) => handleMonthSelect(e.target.value)}
              className="text-xs bg-slate-100/70 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold focus:outline-none cursor-pointer"
              data-testid="select-ledger-month"
              aria-label="Filtrar por mês"
            >
              <option value="ALL">Mês Específico...</option>
              {availableMonths.map((m) => {
                const [y, mon] = m.split('-');
                const dateObj = new Date(parseInt(y, 10), parseInt(mon, 10) - 1, 1);
                const label = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                return (
                  <option key={m} value={m}>
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Input de compatibilidade com data específica */}
        <input
          type="date"
          value={specificDateFilter}
          onChange={(e) => handleSpecificDateChange(e.target.value)}
          className="sr-only"
          data-testid="input-ledger-specific-date"
          aria-label="Data específica"
        />
      </div>

      {/* Lista de Cards Verticais Mobile-First Clicáveis */}
      {filteredTransactions.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs italic">
          Nenhuma movimentação encontrada com os filtros aplicados.
        </div>
      ) : (
        <div className="space-y-2.5" data-testid="ledger-transactions-list">
          {filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'INCOME';
            const isPaid = tx.status === 'PAID';
            const rawDate = tx.payment_date || tx.due_date;
            const displayDate = rawDate ? String(rawDate).split('T')[0] : '';
            const patient = getTransactionPatient(tx);

            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between gap-3 hover:border-teal-400 hover:shadow-xs transition cursor-pointer"
                data-testid={`ledger-row-${tx.id}`}
              >
                {/* Ícone de Tipo */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {isIncome ? (
                    <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-rose-600" />
                  )}
                </div>

                {/* Dados da Movimentação */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {tx.description || (isIncome ? 'Consulta / Atendimento' : 'Despesa')}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                      {tx.category || 'GERAL'}
                    </span>
                    {patient && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                        {patient.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                    <span>{displayDate}</span>
                    <span>•</span>
                    <span>{tx.payment_method || 'PIX'}</span>
                    {tx.installment_number > 0 && tx.total_installments > 1 && (
                      <>
                        <span>•</span>
                        <span className="text-amber-800 font-bold">
                          {tx.installment_number}/{tx.total_installments}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Valor e Badge de Status */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-sm font-mono font-extrabold ${
                      isIncome ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {formatReais(tx.amount_cents, tx.type)}
                  </div>

                  <div className="mt-0.5 flex items-center justify-end gap-1">
                    {isPaid ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded-full">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Pago
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded-full">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes, Edição, Baixa, Estorno e Exclusão */}
      <TransactionDetailModal
        isOpen={Boolean(selectedTx)}
        transaction={selectedTx}
        patientName={selectedPatient?.name}
        patientPhone={selectedPatient?.whatsapp}
        isAppointmentCompleted={selectedApp?.status === 'COMPLETED'}
        procedureName={selectedProcedureName}
        onClose={() => setSelectedTx(null)}
        onSave={async (updates) => {
          if (!selectedTx) return;
          await financialRepo.updateTransaction(selectedTx.id, updates);
          onTransactionUpdated?.();
        }}
        onSettle={async (method, date, amountCents) => {
          if (!selectedTx) return;
          await financialRepo.settleTransaction(selectedTx.id, {
            paymentMethod: method,
            paymentDate: date,
            amountCents,
          });
          onTransactionUpdated?.();
        }}
        onRevert={async () => {
          if (!selectedTx) return;
          await financialRepo.revertTransactionPayment(selectedTx.id);
          onTransactionUpdated?.();
        }}
        onDelete={async () => {
          if (!selectedTx) return;
          await financialRepo.softDeleteTransaction(selectedTx.id);
          onTransactionUpdated?.();
        }}
      />
    </div>
  );
};
