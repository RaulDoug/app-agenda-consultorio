import type { BusinessHours } from '@cliniassist/shared';

export interface TimeInterval {
  start_time: Date | string;
  end_time: Date | string;
}

export interface SmartReturnParams {
  targetDate: Date | string;
  durationMinutes: number;
  businessHours: BusinessHours[];
  existingAppointments?: TimeInterval[];
  scheduleBlocks?: TimeInterval[];
  count?: number;
  stepMinutes?: number;
  maxDaysToSearch?: number;
}

function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map((val) => parseInt(val, 10));
  return hours * 60 + minutes;
}

function isSlotAvailable(
  slotStart: Date,
  slotEnd: Date,
  config: BusinessHours,
  busyIntervals: Array<{ start: number; end: number }>
): boolean {
  if (!config.is_open) return false;

  const startMs = slotStart.getTime();
  const endMs = slotEnd.getTime();

  const slotStartMinutes = slotStart.getHours() * 60 + slotStart.getMinutes();
  const slotEndMinutes = slotEnd.getHours() * 60 + slotEnd.getMinutes();

  const openMinutes = timeStringToMinutes(config.start_time);
  const closeMinutes = timeStringToMinutes(config.end_time);

  // Deve estar dentro do horário de funcionamento
  if (slotStartMinutes < openMinutes || slotEndMinutes > closeMinutes) {
    return false;
  }

  // Não pode colidir com almoço
  if (config.break_start_time && config.break_end_time) {
    const breakStart = timeStringToMinutes(config.break_start_time);
    const breakEnd = timeStringToMinutes(config.break_end_time);

    if (slotStartMinutes < breakEnd && slotEndMinutes > breakStart) {
      return false;
    }
  }

  // Não pode colidir com agendamentos ou bloqueios existentes
  for (const busy of busyIntervals) {
    if (startMs < busy.end && endMs > busy.start) {
      return false;
    }
  }

  return true;
}

export function suggestSmartReturnSlots(params: SmartReturnParams): Date[] {
  const targetDate = new Date(params.targetDate);
  const durationMinutes = params.durationMinutes;
  const count = params.count ?? 3;
  const stepMinutes = params.stepMinutes ?? 15;
  const maxDaysToSearch = params.maxDaysToSearch ?? 7;

  if (isNaN(targetDate.getTime())) {
    throw new Error('Data alvo de retorno inválida.');
  }

  if (durationMinutes <= 0) {
    throw new Error('A duração da consulta deve ser maior que zero.');
  }

  // Normaliza ocupações existentes em timestamps ms
  const busyIntervals: Array<{ start: number; end: number }> = [];

  const allBusy = [
    ...(params.existingAppointments ?? []),
    ...(params.scheduleBlocks ?? []),
  ];

  for (const interval of allBusy) {
    const start = new Date(interval.start_time).getTime();
    const end = new Date(interval.end_time).getTime();
    if (!isNaN(start) && !isNaN(end)) {
      busyIntervals.push({ start, end });
    }
  }

  const durationMs = durationMinutes * 60 * 1000;
  const targetMs = targetDate.getTime();
  const candidates: Array<{ date: Date; distance: number }> = [];

  // Pesquisa dias: dia alvo (offset 0), +1, -1, +2, -2 ... até maxDaysToSearch
  const offsets: number[] = [0];
  for (let i = 1; i <= maxDaysToSearch; i++) {
    offsets.push(i);
    offsets.push(-i);
  }

  for (const dayOffset of offsets) {
    const currentDay = new Date(targetDate);
    currentDay.setDate(targetDate.getDate() + dayOffset);

    const dayOfWeek = currentDay.getDay();
    const config = params.businessHours.find((bh) => bh.day_of_week === dayOfWeek);

    if (!config || !config.is_open) continue;

    const openMin = timeStringToMinutes(config.start_time);
    const closeMin = timeStringToMinutes(config.end_time);

    // Itera ao longo do dia em passos de stepMinutes
    for (let m = openMin; m + durationMinutes <= closeMin; m += stepMinutes) {
      const slotStart = new Date(currentDay);
      slotStart.setHours(Math.floor(m / 60), m % 60, 0, 0);

      const slotEnd = new Date(slotStart.getTime() + durationMs);

      if (isSlotAvailable(slotStart, slotEnd, config, busyIntervals)) {
        const distance = Math.abs(slotStart.getTime() - targetMs);
        candidates.push({ date: slotStart, distance });
      }
    }
  }

  // Ordena por distância temporal em relação ao targetDate.
  // Em caso de empate, prioriza horários posteriores ao target
  candidates.sort((a, b) => {
    if (a.distance !== b.distance) {
      return a.distance - b.distance;
    }
    return a.date.getTime() - b.date.getTime();
  });

  // Remove eventuais duplicatas de timestamp
  const seen = new Set<number>();
  const results: Date[] = [];

  for (const c of candidates) {
    const time = c.date.getTime();
    if (!seen.has(time)) {
      seen.add(time);
      results.push(c.date);
      if (results.length === count) break;
    }
  }

  return results;
}
