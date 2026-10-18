import React, { useState, useMemo } from 'react';
import { ReturnPeriod, evaluateSmartReturn } from '../utils/smart-return';
import { AppointmentLocalRepository, appointmentLocalRepo } from '../../../db/repositories/appointment-local-repository';

interface SmartReturnDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  patientId: string;
  patientName: string;
  baseDate: Date;
  preferredTimeStr: string;
  existingAppointments: Array<{ start_time: string; end_time: string; status?: string }>;
  appointmentRepo?: AppointmentLocalRepository;
  onReturnScheduled: (createdAppointment: any) => void;
}

export const SmartReturnDrawer: React.FC<SmartReturnDrawerProps> = ({
  isOpen,
  onClose,
  tenantId,
  patientId,
  patientName,
  baseDate,
  preferredTimeStr,
  existingAppointments,
  appointmentRepo = appointmentLocalRepo,
  onReturnScheduled,
}) => {
  const [period, setPeriod] = useState<ReturnPeriod>('30d');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const evaluation = useMemo(() => {
    return evaluateSmartReturn(baseDate, period, preferredTimeStr, existingAppointments, 30);
  }, [baseDate, period, preferredTimeStr, existingAppointments]);

  if (!isOpen) return null;

  const handleConfirmSchedule = async (targetDate: Date, timeStr: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const [h, m] = timeStr.split(':').map((s) => parseInt(s, 10));
      const start = new Date(targetDate);
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + 30 * 60 * 1000);

      const created = await appointmentRepo.createAppointment({
        tenant_id: tenantId,
        patient_id: patientId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'CONFIRMED',
        notes: `Retorno (${period}) agendado no checkout`,
        items: [
          {
            procedure_id: crypto.randomUUID(),
            effective_price_cents: 0, // Retorno cortesia ou consulta
            duration_minutes: 30,
          },
        ],
      });

      onReturnScheduled(created.appointment);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao agendar retorno');
      setIsSubmitting(false);
    }
  };

  const formattedTargetDate = evaluation.targetDate.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-return-title"
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up sm:animate-fade-in">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-teal-50/50">
          <div>
            <h3 id="smart-return-title" className="font-bold text-teal-950 text-base">
              Retorno Inteligente
            </h3>
            <p className="text-xs text-teal-700">
              Agendamento rápido para <span className="font-bold">{patientName}</span>
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

        {/* Conteúdo */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Seleção do Prazo de Retorno */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Prazo Recomendado
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['15d', '30d', '6m'] as ReturnPeriod[]).map((p) => {
                const isSelected = period === p;
                const label = p === '15d' ? 'Em 15 dias' : p === '30d' ? 'Em 30 dias' : 'Em 6 meses';

                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      isSelected
                        ? 'border-teal-600 bg-teal-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resultado da Análise de Disponibilidade */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-xs text-slate-600">
              Data calculada: <strong className="text-slate-900 capitalize">{formattedTargetDate}</strong>
            </div>

            {evaluation.wasAdjustedFromSunday && (
              <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                ℹ️ O prazo cairia em um domingo e foi ajustado para a <strong>segunda-feira</strong> seguinte.
              </div>
            )}

            {/* Cenário 1: Horário pretendido está livre */}
            {evaluation.isPreferredAvailable ? (
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConfirmSchedule(evaluation.targetDate, evaluation.preferredTimeStr)}
                  className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>✓</span>
                  <span>
                    Agendar para {evaluation.preferredTimeStr} (1 Toque)
                  </span>
                </button>
              </div>
            ) : (
              /* Cenário 2: Horário pretendido está ocupado -> Apresenta os 3 horários vagos mais próximos */
              <div className="pt-2 space-y-2" data-testid="smart-return-alternatives">
                <div className="text-xs text-rose-700 font-medium">
                  ⚠️ O horário habitual ({evaluation.preferredTimeStr}) já está ocupado nesta data.
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  Horários livres mais próximos:
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {evaluation.suggestedAlternatives.map((alt) => (
                    <button
                      key={alt.timeStr}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleConfirmSchedule(alt.dateTime, alt.timeStr)}
                      className="py-2 px-2 text-xs font-mono font-bold rounded-lg border border-teal-500 bg-teal-50 text-teal-900 hover:bg-teal-100 transition text-center"
                    >
                      {alt.timeStr}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Não agendar agora
          </button>
        </div>
      </div>
    </div>
  );
};
