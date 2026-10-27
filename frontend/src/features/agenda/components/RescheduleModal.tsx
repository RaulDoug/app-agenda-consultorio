import React, { useState, useMemo, useEffect } from 'react';
import { LocalAppointmentWithDetails, BusinessHoursConfig, DEFAULT_BUSINESS_HOURS } from '../types.js';
import { AppointmentLocalRepository, appointmentLocalRepo } from '../../../db/repositories/appointment-local-repository.js';
import { DEFAULT_BUSINESS_HOURS as getWeeklyDefaults } from '../../../db/repositories/settings-local-repository.js';
import type { LocalBusinessHours } from '../../../db/types.js';

interface RescheduleModalProps {
  isOpen: boolean;
  appointment: LocalAppointmentWithDetails | null;
  onClose: () => void;
  appointmentRepo?: AppointmentLocalRepository;
  businessHours?: BusinessHoursConfig;
  weeklyBusinessHours?: LocalBusinessHours[];
  existingAppointments?: LocalAppointmentWithDetails[];
  onRescheduled: (updatedAppointment: any) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  appointment,
  onClose,
  appointmentRepo = appointmentLocalRepo,
  businessHours = DEFAULT_BUSINESS_HOURS,
  weeklyBusinessHours,
  existingAppointments = [],
  onRescheduled,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedTimeStr, setSelectedTimeStr] = useState<string>('09:00');
  const [allowExtraFit, setAllowExtraFit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dbHours, setDbHours] = useState<LocalBusinessHours[]>([]);

  // Carrega horários configurados no banco local caso existam
  useEffect(() => {
    if (isOpen && appointment?.tenant_id) {
      appointmentRepo?.db?.business_hours
        ?.where('tenant_id')
        .equals(appointment.tenant_id)
        .toArray()
        .then((data) => {
          if (data && data.length > 0) {
            setDbHours(data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, appointment?.tenant_id, appointmentRepo]);

  // Reset de envio, erros e inicialização da data do agendamento (AC-095)
  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setErrorMsg('');
      setAllowExtraFit(false);
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
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Obter duração atual da consulta em minutos
  const durationMs = useMemo(() => {
    if (!appointment) return 30 * 60 * 1000;
    const currentStart = new Date(appointment.start_time).getTime();
    const currentEnd = new Date(appointment.end_time).getTime();
    return Math.max(30 * 60 * 1000, currentEnd - currentStart);
  }, [appointment]);

  // Detecta se a data/horário selecionados configuram Encaixe (AC-199)
  const { requiresExtraFit, extraFitReason } = useMemo(() => {
    if (!appointment) return { requiresExtraFit: false, extraFitReason: '' };

    const [hStr, mStr] = selectedTimeStr.split(':');
    const h = parseInt(hStr || '09', 10);
    const m = parseInt(mStr || '00', 10);

    const slotStartMinutes = h * 60 + m;
    const durationMinutes = Math.round(durationMs / (60 * 1000));
    const slotEndMinutes = slotStartMinutes + durationMinutes;

    const dayOfWeek = selectedDate.getDay();
    const effectiveWeekly = weeklyBusinessHours && weeklyBusinessHours.length > 0
      ? weeklyBusinessHours
      : (dbHours.length > 0 ? dbHours : getWeeklyDefaults(appointment.tenant_id));

    const dayConfig = effectiveWeekly.find((w) => w.day_of_week === dayOfWeek);

    // 1. Dia Fechado (ex: Domingo ou Sábado caso desmarcado)
    if (dayConfig && !dayConfig.is_open) {
      const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      return {
        requiresExtraFit: true,
        extraFitReason: `O consultório não possui expediente regular aos ${dayNames[dayOfWeek]}s.`,
      };
    }

    // 2. Fora do expediente específico do dia (ex: Sábado após as 12:00)
    if (dayConfig) {
      const [sh, sm] = dayConfig.start_time.split(':').map((v) => parseInt(v, 10));
      const [eh, em] = dayConfig.end_time.split(':').map((v) => parseInt(v, 10));
      const dayStartMin = sh * 60 + (sm || 0);
      const dayEndMin = eh * 60 + (em || 0);

      if (slotStartMinutes < dayStartMin || slotEndMinutes > dayEndMin) {
        const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
        return {
          requiresExtraFit: true,
          extraFitReason: `Horário fora do expediente de ${dayNames[dayOfWeek]} (${dayConfig.start_time} às ${dayConfig.end_time}).`,
        };
      }

      // 3. Intervalo de almoço do dia (se houver)
      if (dayConfig.break_start_time && dayConfig.break_end_time) {
        const [lsh, lsm] = dayConfig.break_start_time.split(':').map((v) => parseInt(v, 10));
        const [leh, lem] = dayConfig.break_end_time.split(':').map((v) => parseInt(v, 10));
        const lunchStartMin = lsh * 60 + (lsm || 0);
        const lunchEndMin = leh * 60 + (lem || 0);

        if (slotStartMinutes < lunchEndMin && slotEndMinutes > lunchStartMin) {
          return {
            requiresExtraFit: true,
            extraFitReason: `Horário coincide com o intervalo de almoço (${dayConfig.break_start_time} às ${dayConfig.break_end_time}).`,
          };
        }
      }
    } else {
      // Fallback para Domingo caso não encontre dayConfig
      if (dayOfWeek === 0) {
        return {
          requiresExtraFit: true,
          extraFitReason: 'O consultório não possui expediente regular aos domingos.',
        };
      }

      // Fallback para businessHours geral
      const businessStartMin = businessHours.startHour * 60;
      const businessEndMin = businessHours.endHour * 60;
      if (slotStartMinutes < businessStartMin || slotEndMinutes > businessEndMin) {
        return {
          requiresExtraFit: true,
          extraFitReason: `Horário fora do expediente normal do consultório (${String(businessHours.startHour).padStart(2, '0')}:00 às ${String(businessHours.endHour).padStart(2, '0')}:00).`,
        };
      }

      // Intervalo de almoço geral
      const lunchStartMin = businessHours.lunchStartHour * 60;
      const lunchEndMin = businessHours.lunchEndHour * 60;
      if (slotStartMinutes < lunchEndMin && slotEndMinutes > lunchStartMin) {
        return {
          requiresExtraFit: true,
          extraFitReason: `Horário coincide com o intervalo de almoço (${String(businessHours.lunchStartHour).padStart(2, '0')}:00 às ${String(businessHours.lunchEndHour).padStart(2, '0')}:00).`,
        };
      }
    }

    // 4. Choque de horário com outra consulta ativa
    const getLocalDateStr = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const conflict = existingAppointments.find((app) => {
      if (app.id === appointment.id || app.status === 'CANCELLED') return false;
      try {
        const otherStart = new Date(app.start_time);
        const otherEnd = new Date(app.end_time);
        if (getLocalDateStr(otherStart) !== getLocalDateStr(selectedDate)) return false;

        const otherStartMin = otherStart.getHours() * 60 + otherStart.getMinutes();
        const otherEndMin = otherEnd.getHours() * 60 + otherEnd.getMinutes();

        return otherStartMin < slotEndMinutes && otherEndMin > slotStartMinutes;
      } catch {
        return false;
      }
    });

    if (conflict) {
      return {
        requiresExtraFit: true,
        extraFitReason: `Choque de horário com a consulta de ${conflict.patient_name || 'outro paciente'}.`,
      };
    }

    return { requiresExtraFit: false, extraFitReason: '' };
  }, [selectedDate, selectedTimeStr, durationMs, businessHours, weeklyBusinessHours, dbHours, existingAppointments, appointment]);

  if (!isOpen || !appointment) return null;

  // Gerar opções de horários de 30m das 08:00 às 18:00
  const availableSlots: string[] = [];
  const startH = Math.min(8, businessHours.startHour);
  const endH = Math.max(18, businessHours.endHour);
  for (let h = startH; h < endH; h++) {
    availableSlots.push(`${String(h).padStart(2, '0')}:00`);
    availableSlots.push(`${String(h).padStart(2, '0')}:30`);
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (requiresExtraFit && !allowExtraFit) {
      setErrorMsg('É necessário autorizar o encaixe para confirmar a remarcação neste horário.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const [hoursStr, minutesStr] = selectedTimeStr.split(':');
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      // Constrói novo início mantendo o dia selecionado e horário escolhido
      const newStart = new Date(selectedDate);
      newStart.setHours(hours, minutes, 0, 0);

      // Novo término calculado a partir da duração prévia
      const newEnd = new Date(newStart.getTime() + durationMs);

      const updated = await appointmentRepo.rescheduleAppointment(
        appointment.id,
        newStart.toISOString(),
        newEnd.toISOString(),
        'CONFIRMED',
        Boolean(requiresExtraFit) // Passa flag de encaixe caso configurado
      );

      onRescheduled({
        ...appointment,
        ...updated,
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
        status: updated?.status || 'CONFIRMED',
        is_extra_fit: Boolean(requiresExtraFit),
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
            <div
              data-testid="reschedule-error-msg"
              className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg"
            >
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

          {/* Alerta de Encaixe sob Conflito / Expediente (AC-199) */}
          {requiresExtraFit && (
            <div
              data-testid="reschedule-extra-fit-warning"
              className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900 animate-fade-in"
            >
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <span role="img" aria-label="Aviso">⚡</span>
                <span>Aviso de Encaixe / Horário Extra</span>
              </div>
              <p>{extraFitReason}</p>
              <label className="flex items-center gap-2 font-semibold cursor-pointer pt-1">
                <input
                  type="checkbox"
                  data-testid="reschedule-allow-extra-fit-checkbox"
                  checked={allowExtraFit}
                  onChange={(e) => setAllowExtraFit(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-amber-300 focus:ring-teal-500"
                />
                <span>Permitir Encaixe / Horário Extra neste horário</span>
              </label>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-2 ${
                isSubmitting
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white active:scale-95'
              }`}
            >
              {isSubmitting ? 'Remarcando...' : 'Confirmar Remarcação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
