import React from 'react';
import { ViewMode, LocalAppointmentWithDetails, BusinessHoursConfig, DEFAULT_BUSINESS_HOURS } from '../types';
import { AppointmentCard } from './AppointmentCard';

interface ScheduleGridProps {
  currentDate: Date;
  viewMode: ViewMode;
  appointments: LocalAppointmentWithDetails[];
  businessHours?: BusinessHoursConfig;
  onSlotClick?: (date: Date, timeStr: string) => void;
  onAppointmentClick?: (appointment: LocalAppointmentWithDetails) => void;
  onMarkNoShow?: (appointmentId: string) => void;
  onReschedule?: (appointment: LocalAppointmentWithDetails) => void;
  onSelectDate?: (date: Date) => void;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  currentDate,
  viewMode,
  appointments,
  businessHours = DEFAULT_BUSINESS_HOURS,
  onSlotClick,
  onAppointmentClick,
  onMarkNoShow,
  onReschedule,
  onSelectDate,
}) => {
  // Geração de slots de 30 minutos para o dia com suporte a consultas contínuas (AC-091)
  const generateDaySlots = () => {
    const slots: {
      timeStr: string;
      isLunch: boolean;
      isOutOfHours?: boolean;
      appointments: LocalAppointmentWithDetails[];
      spanningAppointments: LocalAppointmentWithDetails[];
    }[] = [];
    const { startHour, endHour, lunchStartHour, lunchEndHour, slotDurationMinutes } = businessHours;

    const startTotalMinutes = startHour * 60;
    const endTotalMinutes = endHour * 60;

    const getLocalDateStr = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const currentDateStr = getLocalDateStr(currentDate);

    for (let m = startTotalMinutes; m < endTotalMinutes; m += slotDurationMinutes) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      const isLunch = h >= lunchStartHour && h < lunchEndHour;
      const slotStartMin = m;
      const slotEndMin = m + slotDurationMinutes;

      // Agendamentos que INICIAM neste slot
      const slotAppointments = appointments.filter((app) => {
        if (app.status === 'CANCELLED') return false;
        try {
          const appDate = new Date(app.start_time);
          const appDateStr = getLocalDateStr(appDate);
          if (appDateStr !== currentDateStr) return false;

          const appHours = appDate.getHours();
          const appMinutes = appDate.getMinutes();
          const appTotalMinutes = appHours * 60 + appMinutes;

          return appTotalMinutes >= slotStartMin && appTotalMinutes < slotEndMin;
        } catch {
          return false;
        }
      });

      // Agendamentos que começaram ANTES e CONTINUAM durante este slot (consultas com duração > 30m)
      const spanningAppointments = appointments.filter((app) => {
        if (app.status === 'CANCELLED') return false;
        try {
          const appStart = new Date(app.start_time);
          const appEnd = new Date(app.end_time);
          const appDateStr = getLocalDateStr(appStart);
          if (appDateStr !== currentDateStr) return false;

          const appStartMin = appStart.getHours() * 60 + appStart.getMinutes();
          const appEndMin = appEnd.getHours() * 60 + appEnd.getMinutes();

          return appStartMin < slotStartMin && appEndMin > slotStartMin;
        } catch {
          return false;
        }
      });

      slots.push({
        timeStr,
        isLunch,
        isOutOfHours: false,
        appointments: slotAppointments,
        spanningAppointments,
      });
    }

    // Identificar agendamentos do dia fora do expediente regular (AC-198)
    const outOfHoursSlotsMap = new Map<number, {
      timeStr: string;
      isLunch: boolean;
      isOutOfHours: boolean;
      appointments: LocalAppointmentWithDetails[];
      spanningAppointments: LocalAppointmentWithDetails[];
    }>();

    appointments.forEach((app) => {
      if (app.status === 'CANCELLED') return;
      try {
        const appDate = new Date(app.start_time);
        if (getLocalDateStr(appDate) !== currentDateStr) return;
        const appTotalMin = appDate.getHours() * 60 + appDate.getMinutes();

        // Se o agendamento inicia fora do expediente padrão
        if (appTotalMin < startTotalMinutes || appTotalMin >= endTotalMinutes) {
          const alignedSlotMin = Math.floor(appTotalMin / slotDurationMinutes) * slotDurationMinutes;
          if (!outOfHoursSlotsMap.has(alignedSlotMin)) {
            const h = Math.floor(alignedSlotMin / 60);
            const min = alignedSlotMin % 60;
            const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
            outOfHoursSlotsMap.set(alignedSlotMin, {
              timeStr,
              isLunch: false,
              isOutOfHours: true,
              appointments: [],
              spanningAppointments: [],
            });
          }
          outOfHoursSlotsMap.get(alignedSlotMin)!.appointments.push(app);
        }
      } catch {}
    });

    const allSlots = [...slots, ...Array.from(outOfHoursSlotsMap.values())].sort((a, b) => {
      const [hA, mA] = a.timeStr.split(':').map(Number);
      const [hB, mB] = b.timeStr.split(':').map(Number);
      return hA * 60 + mA - (hB * 60 + mB);
    });

    return allSlots;
  };

  // Renderização da Visão Diária (padrão)
  const renderDayView = () => {
    const slots = generateDaySlots();

    return (
      <div className="space-y-2 mt-4" data-testid="schedule-day-view">
        {slots.map((slot) => {
          const hasStarting = slot.appointments.length > 0;
          const hasSpanning = slot.spanningAppointments.length > 0;
          const isOccupied = hasStarting || hasSpanning;

          if (slot.isLunch && !isOccupied) {
            return (
              <div
                key={slot.timeStr}
                data-testid={`lunch-slot-${slot.timeStr}`}
                className="flex items-center gap-3 p-3 bg-amber-50/70 border border-dashed border-amber-200 rounded-xl text-amber-800"
              >
                <span className="font-mono text-xs font-semibold w-14 shrink-0 text-amber-700">
                  {slot.timeStr}
                </span>
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span role="img" aria-label="Almoço">🍽️</span>
                  <span>Intervalo de Almoço</span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={slot.timeStr}
              data-testid={slot.isOutOfHours ? `out-of-hours-slot-${slot.timeStr}` : `schedule-slot-${slot.timeStr}`}
              className={`flex items-start gap-3 p-2 rounded-xl border transition ${
                slot.isOutOfHours
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="w-16 shrink-0 pt-2 font-mono text-xs font-semibold text-slate-500 flex flex-col">
                <span>{slot.timeStr}</span>
                {slot.isOutOfHours && (
                  <span className="text-[9px] font-sans font-bold text-amber-700 leading-tight mt-0.5">
                    Extra
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 min-h-[44px] flex flex-col justify-center gap-2">
                {hasStarting &&
                  slot.appointments.map((app) => (
                    <AppointmentCard
                      key={app.id}
                      appointment={app}
                      onClick={onAppointmentClick}
                      onMarkNoShow={onMarkNoShow}
                      onReschedule={onReschedule}
                    />
                  ))}

                {hasSpanning &&
                  slot.spanningAppointments.map((app) => {
                    const isCompleted = app.status === 'COMPLETED';
                    return (
                      <div
                        key={`spanning-${app.id}-${slot.timeStr}`}
                        onClick={() => onAppointmentClick?.(app)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition w-full min-w-0 cursor-pointer ${
                          isCompleted
                            ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100/80'
                            : 'border-teal-200 bg-teal-50/70 text-teal-900 hover:bg-teal-100/70'
                        }`}
                        title={
                          isCompleted
                            ? `Atendimento concluído: ${app.patient_name}`
                            : `Em atendimento contínuo: ${app.patient_name}`
                        }
                        data-status={app.status}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isCompleted ? 'bg-slate-400' : 'bg-teal-500'
                            }`}
                          />
                          <span className="text-xs font-medium truncate">
                            {isCompleted ? 'Concluído: ' : 'Em atendimento: '}
                            <strong className={`font-bold ${isCompleted ? 'text-slate-800' : ''}`}>
                              {app.patient_name}
                            </strong>
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-mono shrink-0 whitespace-nowrap ${
                            isCompleted ? 'text-slate-500' : 'text-teal-700'
                          }`}
                        >
                          até {new Date(app.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}

                {!isOccupied && (
                  <button
                    type="button"
                    onClick={() => onSlotClick?.(currentDate, slot.timeStr)}
                    className="w-full text-left py-2 px-3 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 hover:text-teal-700 hover:border-teal-300 hover:bg-teal-50/40 transition flex items-center justify-between min-h-[44px]"
                    aria-label={`Agendar às ${slot.timeStr}`}
                  >
                    <span>+ Horário Vago</span>
                    <span className="text-[11px] text-slate-300 font-sans">Toque para agendar</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderização da Visão Semanal
  const renderWeekView = () => {
    // 7 dias partindo do início da semana (segunda-feira)
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mt-4" data-testid="schedule-week-view">
        {weekDays.map((day) => {
          const dayStr = day.toISOString().split('T')[0];
          const isToday = new Date().toISOString().split('T')[0] === dayStr;
          const isSelected = currentDate.toISOString().split('T')[0] === dayStr;

          const dayAppointments = appointments.filter((app) => {
            try {
              return new Date(app.start_time).toISOString().split('T')[0] === dayStr;
            } catch {
              return false;
            }
          });

          return (
            <div
              key={dayStr}
              onClick={() => onSelectDate?.(day)}
              className={`flex flex-col p-3 rounded-xl border transition cursor-pointer ${
                isSelected
                  ? 'border-teal-500 bg-teal-50/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-600 uppercase">
                  {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isToday ? 'bg-teal-600 text-white' : 'text-slate-800'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              <div className="mt-2 space-y-1.5 flex-1">
                {dayAppointments.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-2 text-center">Nenhum atendimento</p>
                ) : (
                  dayAppointments.slice(0, 4).map((app) => (
                    <div
                      key={app.id}
                      className="text-xs p-1.5 rounded bg-slate-50 border border-slate-200 truncate"
                    >
                      <span className="font-semibold text-slate-700">
                        {new Date(app.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>{' '}
                      - {app.patient_name}
                    </div>
                  ))
                )}
                {dayAppointments.length > 4 && (
                  <span className="text-[10px] text-teal-700 font-medium block text-center">
                    +{dayAppointments.length - 4} mais
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderização da Visão Mensal
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));

    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-4" data-testid="schedule-month-view">
        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-400 mb-2">
          <span>Dom</span>
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span>Sáb</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {/* Espaçamento inicial para o primeiro dia */}
          {Array.from({ length: firstDayOfMonth.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[48px] rounded-lg bg-slate-50/50" />
          ))}

          {daysArray.map((day) => {
            const dayStr = day.toISOString().split('T')[0];
            const isSelected = currentDate.toISOString().split('T')[0] === dayStr;
            const isToday = new Date().toISOString().split('T')[0] === dayStr;

            const dayAppointmentsCount = appointments.filter((app) => {
              try {
                return new Date(app.start_time).toISOString().split('T')[0] === dayStr;
              } catch {
                return false;
              }
            }).length;

            return (
              <button
                key={dayStr}
                type="button"
                onClick={() => onSelectDate?.(day)}
                className={`min-h-[48px] p-1.5 rounded-lg border text-left flex flex-col justify-between transition ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50 text-teal-900 font-bold'
                    : 'border-slate-100 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <span
                  className={`text-xs inline-block rounded-full w-5 h-5 text-center leading-5 ${
                    isToday ? 'bg-teal-600 text-white font-bold' : ''
                  }`}
                >
                  {day.getDate()}
                </span>
                {dayAppointmentsCount > 0 && (
                  <span className="text-[10px] font-semibold text-teal-700 bg-teal-100 px-1 py-0.5 rounded text-center">
                    {dayAppointmentsCount} {dayAppointmentsCount === 1 ? 'cons.' : 'cons.'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}
    </div>
  );
};
