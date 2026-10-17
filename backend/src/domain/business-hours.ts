import type { BusinessHours } from '@odontoflow/shared';

export interface BusinessHoursValidationResult {
  allowed: boolean;
  outside_business_hours: boolean;
  is_overtime: boolean;
  warning?: string;
  reason?: string;
}

export interface BusinessHoursValidationOptions {
  confirm_overtime?: boolean;
}

function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map((val) => parseInt(val, 10));
  return hours * 60 + minutes;
}

function getMinutesOfDay(date: Date): number {
  // Pega horas e minutos locais
  return date.getHours() * 60 + date.getMinutes();
}

export function validateBusinessHours(
  startTimeInput: Date | string,
  endTimeInput: Date | string,
  businessHoursList: BusinessHours[],
  options?: BusinessHoursValidationOptions
): BusinessHoursValidationResult {
  const startTime = new Date(startTimeInput);
  const endTime = new Date(endTimeInput);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new Error('Horário de início ou término inválido.');
  }

  if (endTime.getTime() <= startTime.getTime()) {
    throw new Error('O horário de término deve ser posterior ao horário de início.');
  }

  const dayOfWeek = startTime.getDay(); // 0=Domingo, 1=Segunda ... 6=Sábado
  const config = businessHoursList.find((bh) => bh.day_of_week === dayOfWeek);

  const confirmOvertime = Boolean(options?.confirm_overtime);

  // Se não houver configuração ou o dia estiver fechado
  if (!config || !config.is_open) {
    if (confirmOvertime) {
      return {
        allowed: true,
        outside_business_hours: true,
        is_overtime: true,
        warning: 'Agendamento em dia sem expediente confirmado como encaixe extraordinário.',
      };
    }
    return {
      allowed: false,
      outside_business_hours: true,
      is_overtime: false,
      warning: 'Este horário está fora do expediente regular (consultório fechado neste dia).',
      reason: 'Dia sem expediente regular.',
    };
  }

  const startMinutes = getMinutesOfDay(startTime);
  const endMinutes = getMinutesOfDay(endTime);
  const openMinutes = timeStringToMinutes(config.start_time);
  const closeMinutes = timeStringToMinutes(config.end_time);

  let isOutside = false;
  let reason = '';

  // Verifica limites de abertura e fechamento
  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    isOutside = true;
    reason = `Fora do horário regular (${config.start_time} às ${config.end_time}).`;
  }

  // Verifica colisão com intervalo de almoço
  if (config.break_start_time && config.break_end_time) {
    const breakStartMinutes = timeStringToMinutes(config.break_start_time);
    const breakEndMinutes = timeStringToMinutes(config.break_end_time);

    // Colisão ocorre se o agendamento se sobrepõe ao intervalo
    const overlapsBreak = startMinutes < breakEndMinutes && endMinutes > breakStartMinutes;
    if (overlapsBreak) {
      isOutside = true;
      reason = `Conflito com intervalo de almoço (${config.break_start_time} às ${config.break_end_time}).`;
    }
  }

  if (!isOutside) {
    return {
      allowed: true,
      outside_business_hours: false,
      is_overtime: false,
    };
  }

  // Horário fora de expediente
  if (confirmOvertime) {
    return {
      allowed: true,
      outside_business_hours: true,
      is_overtime: true,
      warning: '⚠️ Este horário está fora do expediente regular. Agendamento confirmado como encaixe extraordinário.',
    };
  }

  return {
    allowed: false,
    outside_business_hours: true,
    is_overtime: false,
    warning: '⚠️ Este horário está fora do expediente regular.',
    reason,
  };
}
