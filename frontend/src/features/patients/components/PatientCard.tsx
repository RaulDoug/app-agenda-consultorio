import React, { useState } from 'react';
import { LocalPatient } from '../../../db/types';
import { PatientWithHistoryStatus } from '../types';
import { FileText, ChevronDown, ChevronUp, Pencil } from 'lucide-react';

interface PatientCardProps {
  item: PatientWithHistoryStatus;
  onSchedule?: (patient: PatientWithHistoryStatus) => void;
  onEdit?: (patient: LocalPatient) => void;
  onClick?: (patient: PatientWithHistoryStatus) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  item,
  onSchedule,
  onEdit,
  onClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { patient, nextAppointment, lastCancelledWithoutReschedule, hasNoHistory } = item;

  const hasNotes = Boolean(patient.notes && patient.notes.trim().length > 0);

  const formatNextDate = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoString;
    }
  };

  const handleCardClick = () => {
    setIsExpanded((prev) => !prev);
    onClick?.(item);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`p-3.5 bg-white border rounded-xl transition shadow-xs flex flex-col justify-between gap-3 cursor-pointer ${
        isExpanded ? 'border-teal-400 ring-1 ring-teal-400/30' : 'border-slate-200 hover:border-slate-300'
      }`}
      data-testid={`patient-card-${patient.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-slate-900 text-sm truncate">{patient.name}</h4>
            {hasNotes && (
              <span
                data-testid={`badge-notes-${patient.id}`}
                title="Possui observações clínicas"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md shrink-0"
              >
                <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                Obs
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-mono">{patient.whatsapp}</span>
        </div>

        {/* Badges de Histórico e Retorno + Chevron */}
        <div className="flex items-center gap-2 shrink-0">
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

          <div
            data-testid={`btn-toggle-expand-${patient.id}`}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 bg-slate-50"
            aria-label={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-teal-700" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo Expandido */}
      {isExpanded && (
        <div
          data-testid={`patient-expanded-details-${patient.id}`}
          className="pt-3 border-t border-slate-100 space-y-3 animate-fade-in"
        >
          {/* Observações Clínicas */}
          <div
            data-testid={`patient-notes-content-${patient.id}`}
            className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950"
          >
            <div className="flex items-center gap-1.5 font-semibold text-amber-900 mb-1">
              <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              Observações / Histórico Clínico
            </div>
            <p className="whitespace-pre-wrap font-normal leading-relaxed text-slate-800">
              {patient.notes ? (
                patient.notes
              ) : (
                <span className="italic text-slate-400">Nenhuma observação cadastrada.</span>
              )}
            </p>
          </div>

          {/* Detalhes de Atendimento e Cadastro */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 text-[11px] block">Total de Consultas</span>
              <span className="font-semibold text-slate-800">
                {item.totalAppointments} atendimento(s)
              </span>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 text-[11px] block">Data de Cadastro</span>
              <span className="font-semibold text-slate-800 font-mono text-[11px]">
                {new Date(patient.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Botão de Edição */}
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              data-testid={`btn-edit-patient-${patient.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(patient);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-600" />
              Editar Cadastro
            </button>
          </div>
        </div>
      )}

      {/* Ações Inferiores Padrão */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <a
          href={`https://wa.me/55${patient.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-emerald-700 hover:text-emerald-900 font-medium inline-flex items-center gap-1"
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
