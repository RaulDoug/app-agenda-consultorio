import React, { useState, useMemo } from 'react';
import {
  LocalPatient,
  LocalAppointment,
  LocalFinancialTransaction,
  LocalProcedure,
} from '../../../db/types';
import { FinancialLocalRepository, financialLocalRepo } from '../../../db/repositories/financial-local-repository';
import { X, DollarSign, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface PatientFinancialDrawerProps {
  isOpen: boolean;
  patient: LocalPatient | null;
  appointments: LocalAppointment[];
  transactions: LocalFinancialTransaction[];
  procedures?: LocalProcedure[];
  financialRepo?: FinancialLocalRepository;
  onClose: () => void;
  onTransactionUpdated?: () => void;
}

export const PatientFinancialDrawer: React.FC<PatientFinancialDrawerProps> = ({
  isOpen,
  patient,
  appointments,
  transactions,
  procedures = [],
  financialRepo = financialLocalRepo,
  onClose,
  onTransactionUpdated,
}) => {
  const [settleTx, setSettleTx] = useState<LocalFinancialTransaction | null>(null);
  const [settleMethod, setSettleMethod] = useState('PIX');
  const [settleDate, setSettleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [settleAmountReais, setSettleAmountReais] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtra agendamentos e transações deste paciente estritamente por ID
  const patientAppointments = useMemo(() => {
    if (!patient) return [];
    return appointments
      .filter((a) => a.patient_id === patient.id)
      .sort((a, b) => b.start_time.localeCompare(a.start_time));
  }, [patient, appointments]);

  const patientTransactions = useMemo(() => {
    if (!patient) return [];
    const patientAppIds = new Set(patientAppointments.map((a) => a.id));
    return transactions
      .filter((t) => t.is_active && !t.deleted_at)
      .filter((t) => {
        // Associação estrita via chave relacional do agendamento do paciente (resolve TM-FIN-12)
        if (t.appointment_id && patientAppIds.has(t.appointment_id)) return true;
        return false;
      })
      .sort((a, b) => (b.payment_date || b.due_date).localeCompare(a.payment_date || a.due_date));
  }, [patient, patientAppointments, transactions]);

  // Totalizadores
  const summary = useMemo(() => {
    let totalSpentCents = 0;
    let pendingCents = 0;
    let completedCount = 0;
    let noShowCount = 0;

    patientAppointments.forEach((a) => {
      if (a.status === 'COMPLETED') completedCount++;
      if (a.status === 'NO_SHOW') noShowCount++;
    });

    patientTransactions.forEach((t) => {
      if (t.type === 'INCOME') {
        if (t.status === 'PAID') {
          totalSpentCents += t.amount_cents;
        } else if (t.status === 'PENDING') {
          pendingCents += t.amount_cents;
        }
      }
    });

    return {
      totalSpentCents,
      pendingCents,
      completedCount,
      noShowCount,
    };
  }, [patientAppointments, patientTransactions]);

  if (!isOpen || !patient) return null;

  const handleStartSettle = (tx: LocalFinancialTransaction) => {
    setSettleTx(tx);
    setSettleMethod(tx.payment_method || 'PIX');
    setSettleDate(new Date().toISOString().split('T')[0]);
    setSettleAmountReais((tx.amount_cents / 100).toFixed(2));
  };

  const handleConfirmSettle = async () => {
    if (!settleTx) return;
    const val = parseFloat(settleAmountReais);
    if (isNaN(val) || val <= 0) return;

    try {
      setIsSubmitting(true);
      await financialRepo.settleTransaction(settleTx.id, {
        paymentMethod: settleMethod,
        paymentDate: settleDate,
        amountCents: Math.round(val * 100),
      });
      setSettleTx(null);
      onTransactionUpdated?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatReais = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2)}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-financial-title"
      data-testid="patient-financial-drawer"
    >
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Barra superior de arrasto mobile */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden -mt-1 mb-1 shrink-0" />

        {/* Cabeçalho */}
        <div className="flex items-center justify-between shrink-0 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-teal-600" />
              <h3 id="patient-financial-title" className="text-base font-bold text-slate-900 truncate">
                Prontuário Financeiro
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {patient.name} • {patient.whatsapp}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fechar prontuário"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 gap-2.5 shrink-0">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl" data-testid="card-patient-total-spent">
            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
              Total Investido
            </span>
            <span className="text-lg font-mono font-extrabold text-teal-950 mt-0.5 block">
              {formatReais(summary.totalSpentCents)}
            </span>
            <span className="text-[10px] text-teal-700 mt-0.5 block">
              {summary.completedCount} consulta(s) concluída(s)
            </span>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl" data-testid="card-patient-pending">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
              Saldo Pendente
            </span>
            <span className="text-lg font-mono font-extrabold text-amber-950 mt-0.5 block">
              {formatReais(summary.pendingCents)}
            </span>
            <span className="text-[10px] text-amber-700 mt-0.5 block">
              {summary.noShowCount > 0 ? `${summary.noShowCount} falta(s)` : 'Sem faltas registradas'}
            </span>
          </div>
        </div>

        {/* Lista de Histórico Financeiro */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Movimentações & Parcelas
          </h4>

          {patientTransactions.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-xs italic">
              Nenhuma movimentação financeira registrada para este paciente.
            </div>
          ) : (
            patientTransactions.map((tx) => {
              const isPaid = tx.status === 'PAID';
              const rawDate = tx.payment_date || tx.due_date;
              const displayDate = rawDate ? String(rawDate).split('T')[0] : '';

              return (
                <React.Fragment key={tx.id}>
                  <div
                    className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between gap-3"
                    data-testid={`patient-tx-${tx.id}`}
                  >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {tx.description || 'Consulta / Tratamento'}
                      </span>
                      {tx.installment_number > 0 && tx.total_installments > 1 && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          {tx.installment_number}/{tx.total_installments}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {isPaid ? `Pago em ${displayDate}` : `Vencimento: ${displayDate}`} • {tx.payment_method || 'PIX'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-mono font-bold text-slate-900">
                      {formatReais(tx.amount_cents)}
                    </span>

                    {isPaid ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Pago
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartSettle(tx)}
                        disabled={isSubmitting}
                        className="min-h-[38px] px-2.5 py-1 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition active:scale-95"
                        data-testid={`btn-patient-pay-${tx.id}`}
                      >
                        ✓ Baixa
                      </button>
                    )}
                  </div>
                </div>

                {settleTx?.id === tx.id && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5 text-xs animate-in fade-in" data-testid={`settle-panel-${tx.id}`}>
                    <div className="font-bold text-emerald-900">Quitar Lançamento</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Forma</label>
                        <select
                          value={settleMethod}
                          onChange={(e) => setSettleMethod(e.target.value)}
                          className="w-full p-1.5 border border-slate-300 rounded-lg bg-white"
                          data-testid="select-patient-settle-method"
                        >
                          <option value="PIX">PIX</option>
                          <option value="DINHEIRO">Dinheiro</option>
                          <option value="CARTAO_DEBITO">Débito</option>
                          <option value="CARTAO_CREDITO">Crédito</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Data</label>
                        <input
                          type="date"
                          value={settleDate}
                          onChange={(e) => setSettleDate(e.target.value)}
                          className="w-full p-1.5 border border-slate-300 rounded-lg"
                          data-testid="input-patient-settle-date"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Valor (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={settleAmountReais}
                          onChange={(e) => setSettleAmountReais(e.target.value)}
                          className="w-full p-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                          data-testid="input-patient-settle-amount"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSettleTx(null)}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-800"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmSettle}
                        disabled={isSubmitting}
                        className="px-3.5 py-1 text-white bg-emerald-700 hover:bg-emerald-800 font-bold rounded-lg transition"
                        data-testid="btn-confirm-patient-settle"
                      >
                        Confirmar Baixa
                      </button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
          )}
        </div>

        {/* Rodapé na zona do polegar */}
        <div className="pt-2 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Fechar Prontuário
          </button>
        </div>
      </div>
    </div>
  );
};
