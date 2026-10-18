import React from 'react';
import { LocalAppointmentWithDetails } from '../types';
import { STATUS_TOKENS } from '../../../theme/tokens';

interface AppointmentCardProps {
  appointment: LocalAppointmentWithDetails;
  onClick?: (appointment: LocalAppointmentWithDetails) => void;
  onMarkNoShow?: (appointmentId: string) => void;
  onReschedule?: (appointment: LocalAppointmentWithDetails) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onClick,
  onMarkNoShow,
  onReschedule,
}) => {
  const statusToken = STATUS_TOKENS[appointment.status] || STATUS_TOKENS.PENDING;

  // Formatar horário de início e fim: "HH:mm - HH:mm"
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const startTimeStr = formatTime(appointment.start_time);
  const endTimeStr = formatTime(appointment.end_time);

  const proceduresText = appointment.procedures?.length
    ? appointment.procedures.map((p) => p.name).join(', ')
    : appointment.notes || 'Atendimento Geral';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(appointment)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.(appointment);
        }
      }}
      className={`relative flex flex-col justify-between p-3 rounded-xl border border-slate-200 border-l-4 shadow-xs transition hover:shadow-md cursor-pointer ${statusToken.borderClass} ${statusToken.cardBg}`}
      data-testid={`appointment-card-${appointment.id}`}
      data-status={appointment.status}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 font-mono">
              {startTimeStr} - {endTimeStr}
            </span>
            {appointment.is_extra_fit && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-200 text-amber-900 border border-amber-300"
                title="Consulta marcada como encaixe"
              >
                ⚡ Encaixe
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-slate-900 truncate mt-0.5">
            {appointment.patient_name}
          </h4>
          <p className="text-xs text-slate-600 truncate mt-0.5">
            {proceduresText}
          </p>
        </div>

        {/* Badge do Status */}
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${statusToken.badgeBg} ${statusToken.badgeText}`}
        >
          {statusToken.label}
        </span>
      </div>

      {/* Ações de 1 toque no card se não for concluído/faltou */}
      {appointment.status !== 'COMPLETED' && appointment.status !== 'NO_SHOW' && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60">
          {onMarkNoShow && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkNoShow(appointment.id);
              }}
              className="text-xs font-medium text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition"
            >
              Paciente Faltou
            </button>
          )}
          {onReschedule && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReschedule(appointment);
              }}
              className="text-xs font-medium text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded transition"
            >
              Remarcar
            </button>
          )}
        </div>
      )}
    </div>
  );
};
