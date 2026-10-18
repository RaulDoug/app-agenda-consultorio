import React from 'react';
import { LocalAppointmentWithDetails } from '../types';
import { STATUS_TOKENS } from '../../../theme/tokens';
import { AppointmentLocalRepository, appointmentLocalRepo } from '../../../db/repositories/appointment-local-repository';

interface AppointmentDetailsDrawerProps {
  isOpen: boolean;
  appointment: LocalAppointmentWithDetails | null;
  onClose: () => void;
  appointmentRepo?: AppointmentLocalRepository;
  onStatusChanged: (updated: LocalAppointmentWithDetails) => void;
  onOpenReschedule: (appointment: LocalAppointmentWithDetails) => void;
}

export const AppointmentDetailsDrawer: React.FC<AppointmentDetailsDrawerProps> = ({
  isOpen,
  appointment,
  onClose,
  appointmentRepo = appointmentLocalRepo,
  onStatusChanged,
  onOpenReschedule,
}) => {
  if (!isOpen || !appointment) return null;

  const statusToken = STATUS_TOKENS[appointment.status] || STATUS_TOKENS.PENDING;

  const formatDateTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleUpdateStatus = async (newStatus: any) => {
    try {
      const updated = await appointmentRepo.updateStatus(appointment.id, newStatus);
      onStatusChanged({
        ...appointment,
        status: updated.status,
      });
    } catch (err) {
      console.error('Erro ao atualizar status do agendamento:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-drawer-title"
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up sm:animate-fade-in">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusToken.badgeBg} ${statusToken.badgeText}`}
            >
              {statusToken.label}
            </span>
            {appointment.is_extra_fit && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-200 text-amber-900">
                ⚡ Encaixe
              </span>
            )}
            <h3 id="details-drawer-title" className="font-bold text-slate-900 text-base mt-1">
              {appointment.patient_name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Informações da Consulta */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-sm">
          {/* Horário */}
          <div className="flex items-center gap-2 text-slate-700">
            <span className="text-slate-400">🕒</span>
            <span className="font-medium">
              {formatDateTime(appointment.start_time)} até {new Date(appointment.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* WhatsApp */}
          {appointment.patient_whatsapp && (
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 font-mono">
                {appointment.patient_whatsapp}
              </span>
              <a
                href={`https://wa.me/55${appointment.patient_whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded transition"
              >
                Abrir WhatsApp
              </a>
            </div>
          )}

          {/* Procedimentos */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Procedimentos / Serviços
            </h4>
            <div className="space-y-1">
              {appointment.procedures && appointment.procedures.length > 0 ? (
                appointment.procedures.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 text-xs"
                  >
                    <span className="font-medium text-slate-800">{p.name}</span>
                    <span className="font-mono text-slate-600">
                      R$ {(p.default_price_cents / 100).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">
                  {appointment.notes || 'Atendimento Geral'}
                </p>
              )}
            </div>
          </div>

          {/* Observações */}
          {appointment.notes && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Observações
              </h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {appointment.notes}
              </p>
            </div>
          )}

          {/* Ações de Gestão de Status */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ações Rápidas
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleUpdateStatus('CONFIRMED')}
                className="py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition"
              >
                ✓ Confirmar Presença
              </button>

              <button
                type="button"
                onClick={() => onOpenReschedule(appointment)}
                className="py-2 px-3 text-xs font-semibold rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 transition"
              >
                🗓️ Remarcar Consulta
              </button>

              <button
                type="button"
                onClick={() => handleUpdateStatus('NO_SHOW')}
                className="py-2 px-3 text-xs font-semibold rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 transition"
              >
                ⚠️ Paciente Faltou
              </button>

              <button
                type="button"
                onClick={() => handleUpdateStatus('COMPLETED')}
                className="py-2 px-3 text-xs font-semibold rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 transition"
              >
                ✔️ Concluir Atendimento
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleUpdateStatus('CANCELLED')}
              className="w-full py-2 text-xs font-medium text-slate-500 hover:text-rose-600 transition text-center"
            >
              Cancelar este agendamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
