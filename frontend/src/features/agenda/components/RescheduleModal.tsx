import React, { useState } from 'react';
import { LocalAppointmentWithDetails } from '../types';
import { AppointmentLocalRepository, appointmentLocalRepo } from '../../../db/repositories/appointment-local-repository';

interface RescheduleModalProps {
  isOpen: boolean;
  appointment: LocalAppointmentWithDetails | null;
  onClose: () => void;
  appointmentRepo?: AppointmentLocalRepository;
  onRescheduled: (updatedAppointment: any) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  appointment,
  onClose,
  appointmentRepo = appointmentLocalRepo,
  onRescheduled,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedTimeStr, setSelectedTimeStr] = useState<string>('09:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset de envio, erros e inicialização da data do agendamento (AC-095)
  React.useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setErrorMsg('');
      if (appointment?.start_time) {
        const appDate = new Date(appointment.start_time);
        setSelectedDate(appDate);
        const h = String(appDate.getHours()).padStart(2, '0');
        const m = String(appDate.getMinutes()).padStart(2, '0');
        setSelectedTimeStr(`${h}:${m}`);
      }
    }
  }, [isOpen, appointment?.id]);

  // Bloqueio de scroll do plano de fundo enquanto o modal estiver aberto (AC-094)
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  // Gerar opções de horários de 30m das 08:00 às 18:00
  const availableSlots: string[] = [];
  for (let h = 8; h < 18; h++) {
    availableSlots.push(`${String(h).padStart(2, '0')}:00`);
    availableSlots.push(`${String(h).padStart(2, '0')}:30`);
  }

  // Obter duração atual da consulta em minutos
  const currentStart = new Date(appointment.start_time).getTime();
  const currentEnd = new Date(appointment.end_time).getTime();
  const durationMs = Math.max(30 * 60 * 1000, currentEnd - currentStart);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const [hStr, mStr] = selectedTimeStr.split(':');
      const h = parseInt(hStr || '09', 10);
      const m = parseInt(mStr || '00', 10);

      const newStart = new Date(selectedDate);
      newStart.setHours(h, m, 0, 0);

      const newEnd = new Date(newStart.getTime() + durationMs);

      const updated = await appointmentRepo.rescheduleAppointment(
        appointment.id,
        newStart.toISOString(),
        newEnd.toISOString(),
        'CONFIRMED'
      );

      onRescheduled({
        ...appointment,
        start_time: updated.start_time,
        end_time: updated.end_time,
        status: updated.status,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao remarcar consulta');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gerar dias do mês selecionado
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 id="reschedule-modal-title" className="font-bold text-slate-900 text-base">
              Remarcar Consulta
            </h3>
            <p className="text-xs text-slate-500">
              {appointment.patient_name}
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

        {/* Formulário com Calendário e Horários */}
        <form onSubmit={handleConfirm} className="p-4 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Calendário Mensal para Seleção da Nova Data */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 capitalize">
                {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date(year, month - 1, 1))}
                  className="p-1 text-slate-500 hover:text-slate-800"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date(year, month + 1, 1))}
                  className="p-1 text-slate-500 hover:text-slate-800"
                >
                  ▶
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[10px] text-slate-400 mb-1">
              <span>D</span>
              <span>S</span>
              <span>T</span>
              <span>Q</span>
              <span>Q</span>
              <span>S</span>
              <span>S</span>
            </div>

            <div className="grid grid-cols-7 gap-1" data-testid="reschedule-calendar-days">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected = selectedDate.getDate() === dayNum;

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => setSelectedDate(new Date(year, month, dayNum))}
                    className={`h-8 rounded-lg text-xs font-semibold transition flex items-center justify-center ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seleção do Novo Horário */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Novo Horário para {selectedDate.toLocaleDateString('pt-BR')}
            </label>
            <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-slate-50/50">
              {availableSlots.map((time) => {
                const isSelected = selectedTimeStr === time;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTimeStr(time)}
                    className={`py-1.5 px-2 rounded text-xs font-mono font-semibold transition ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Remarcando...' : 'Confirmar Remarcação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
