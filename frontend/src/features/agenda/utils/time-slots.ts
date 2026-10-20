import { BusinessHoursConfig, DEFAULT_BUSINESS_HOURS } from '../types.js';

export interface SmartDefaultDateTime {
  date: Date;
  dateStr: string; // "YYYY-MM-DD"
  timeStr: string; // "HH:MM"
  advancedToNextDay: boolean;
}

export function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calcula a data e o horário padrão pré-selecionado para um novo agendamento.
 * 
 * Regras:
 * 1. Nunca traz um horário anterior à hora atual se a data for hoje.
 * 2. Se a hora atual for igual ou posterior ao término do expediente (ex: >= 18:00),
 *    avança para a data do dia seguinte e define o horário como o início do expediente (ex: 08:00).
 * 3. Se a hora atual for anterior ao início do expediente (ex: 06:30), define o início do expediente hoje (08:00).
 * 4. Se a hora atual estiver dentro do expediente:
 *    Arredonda para o próximo slot de 30 minutos (ex: 14:05 -> 14:30; 14:31 -> 15:00).
 *    Se cair no horário de almoço (ex: 12:00 às 13:00), avança para o término do almoço (13:00).
 *    Se o arredondamento atingir ou ultrapassar o fim do expediente (ex: >= 18:00), avança para o dia seguinte às 08:00.
 * 5. Se a data fornecida for uma data futura em relação a hoje (ex: o usuário navegou na agenda para o próximo mês),
 *    mantém essa data futura e define o horário inicial como 08:00.
 */
export function getSmartDefaultAppointmentDateTime(
  now: Date = new Date(),
  baseDate?: Date,
  businessHours: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS
): SmartDefaultDateTime {
  const todayStr = formatDateToYMD(now);
  const targetDate = baseDate ? new Date(baseDate) : new Date(now);
  const targetDateStr = formatDateToYMD(targetDate);

  const startHourStr = String(businessHours.startHour).padStart(2, '0');
  const startMinuteStr = String(businessHours.startMinute).padStart(2, '0');
  const defaultStartTimeStr = `${startHourStr}:${startMinuteStr}`;

  // Se a data selecionada for futura (em relação ao dia de hoje)
  if (targetDateStr > todayStr) {
    return {
      date: targetDate,
      dateStr: targetDateStr,
      timeStr: defaultStartTimeStr,
      advancedToNextDay: false,
    };
  }

  // Se a data for hoje (ou passada, tratando como hoje para agendamento inteligente)
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
  const startTotalMinutes = businessHours.startHour * 60 + businessHours.startMinute;
  const endTotalMinutes = businessHours.endHour * 60 + businessHours.endMinute;
  const lunchStartTotal = businessHours.lunchStartHour * 60 + businessHours.lunchStartMinute;
  const lunchEndTotal = businessHours.lunchEndHour * 60 + businessHours.lunchEndMinute;
  const slotMinutes = businessHours.slotDurationMinutes || 30;

  // Caso: Horário atual já é >= encerramento do consultório
  if (currentTotalMinutes >= endTotalMinutes) {
    const nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + 1);
    return {
      date: nextDay,
      dateStr: formatDateToYMD(nextDay),
      timeStr: defaultStartTimeStr,
      advancedToNextDay: true,
    };
  }

  // Caso: Horário atual é anterior ao início do expediente
  if (currentTotalMinutes < startTotalMinutes) {
    return {
      date: now,
      dateStr: todayStr,
      timeStr: defaultStartTimeStr,
      advancedToNextDay: false,
    };
  }

  // Caso: Dentro do expediente. Arredondar para o próximo slot (teto no múltiplo de slotMinutes)
  let roundedMinutes = Math.ceil(currentTotalMinutes / slotMinutes) * slotMinutes;

  // Se o minuto atual já for exatamente múltiplo, dá um intervalo de 1 slot (ex: às 14:00, sugere 14:30)
  if (roundedMinutes === currentTotalMinutes) {
    roundedMinutes += slotMinutes;
  }

  // Se cair dentro do almoço, ajusta para o término do almoço
  if (roundedMinutes >= lunchStartTotal && roundedMinutes < lunchEndTotal) {
    roundedMinutes = lunchEndTotal;
  }

  // Se o slot arredondado atingir ou passar o fim do expediente, avança para o dia seguinte
  if (roundedMinutes >= endTotalMinutes) {
    const nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + 1);
    return {
      date: nextDay,
      dateStr: formatDateToYMD(nextDay),
      timeStr: defaultStartTimeStr,
      advancedToNextDay: true,
    };
  }

  const h = Math.floor(roundedMinutes / 60);
  const m = roundedMinutes % 60;
  const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  return {
    date: now,
    dateStr: todayStr,
    timeStr,
    advancedToNextDay: false,
  };
}
