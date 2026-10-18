import React from 'react';
import { PatientWithHistoryStatus } from '../types';

interface PatientCardProps {
  item: PatientWithHistoryStatus;
  onSchedule?: (patient: PatientWithHistoryStatus) => void;
  onClick?: (patient: PatientWithHistoryStatus) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  item,
  onSchedule,
  onClick,
}) => {
  const { patient, nextAppointment, lastCancelledWithoutReschedule, hasNoHistory } = item;

  const formatNextDate = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div
      onClick={() => onClick?.(item)}
      className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition shadow-xs flex flex-col justify-between gap-3"
      data-testid={`patient-card-${patient.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">{patient.name}</h4>
          <span className="text-xs text-slate-500 font-mono">{patient.whatsapp}</span>
        </div>

        {/* Badges de Histórico e Retorno */}
        <div className="flex flex-col items-end gap-1">
          {hasNoHistory && (
            <span
              data-testid="badge-sem-historico"
              className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800"
            >
              Novo / Sem consultas anteriores
            </span>
          )}

          {nextAppointment && (
            <span
              data-testid="badge-proxima-consulta"
              className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800"
            >
              Próxima: {formatNextDate(nextAppointment.start_time)}
            </span>
          )}

          {lastCancelledWithoutReschedule && !nextAppointment && (
            <span
              data-testid="badge-cancelada-sem-reagendamento"
              className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800"
            >
              Consulta cancelada sem reagendamento
            </span>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <a
          href={`https://wa.me/55${patient.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-emerald-700 hover:text-emerald-900 font-medium"
        >
          Conversar no WhatsApp
        </a>

        {onSchedule && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSchedule(item);
            }}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-teal-50 text-teal-700 hover:bg-teal-100 transition"
          >
            + Agendar
          </button>
        )}
      </div>
    </div>
  );
};
