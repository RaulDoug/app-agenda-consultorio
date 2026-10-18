export type ReturnPeriod = '15d' | '30d' | '6m';

export interface SmartReturnSlotOption {
  dateTime: Date;
  timeStr: string;
  dateStr: string;
}

export interface SmartReturnCalculation {
  targetDate: Date;
  preferredTimeStr: string;
  isPreferredAvailable: boolean;
  wasAdjustedFromSunday: boolean;
  suggestedAlternatives: SmartReturnSlotOption[];
}

export function calculateTargetReturnDate(baseDate: Date, period: ReturnPeriod): { date: Date; wasSunday: boolean } {
  const target = new Date(baseDate);

  if (period === '15d') {
    target.setDate(target.getDate() + 15);
  } else if (period === '30d') {
    target.setDate(target.getDate() + 30);
  } else if (period === '6m') {
    target.setMonth(target.getMonth() + 6);
  }

  // Se cair em domingo (0), avança para a segunda-feira seguinte
  let wasSunday = false;
  if (target.getDay() === 0) {
    target.setDate(target.getDate() + 1);
    wasSunday = true;
  }

  return { date: target, wasSunday };
}

export function evaluateSmartReturn(
  baseDate: Date,
  period: ReturnPeriod,
  preferredTimeStr: string,
  existingAppointments: Array<{ start_time: string; end_time: string; status?: string }>,
  durationMinutes = 30
): SmartReturnCalculation {
  const { date: targetDate, wasSunday } = calculateTargetReturnDate(baseDate, period);
  const targetDateIsoStr = targetDate.toISOString().split('T')[0];

  const [prefH, prefM] = preferredTimeStr.split(':').map((s) => parseInt(s, 10));
  const prefTotalMinutes = (prefH || 9) * 60 + (prefM || 0);

  // Filtra agendamentos existentes no dia alvo
  const dayAppointments = existingAppointments.filter((app) => {
    if (app.status === 'CANCELLED') return false;
    try {
      return new Date(app.start_time).toISOString().split('T')[0] === targetDateIsoStr;
    } catch {
      return false;
    }
  });

  const checkSlotBusy = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map((s) => parseInt(s, 10));
    const startM = h * 60 + m;
    const endM = startM + durationMinutes;

    return dayAppointments.some((app) => {
      const appDate = new Date(app.start_time);
      const appStartM = appDate.getHours() * 60 + appDate.getMinutes();
      const appEndM = appStartM + durationMinutes;
      return startM < appEndM && endM > appStartM;
    });
  };

  const isPreferredAvailable = !checkSlotBusy(preferredTimeStr);

  // Gera slots de 30m no expediente regular (08:00 às 18:00, almoço 12-13h)
  const candidateSlots: string[] = [];
  for (let h = 8; h < 18; h++) {
    if (h === 12) continue; // Pula horário de almoço
    candidateSlots.push(`${String(h).padStart(2, '0')}:00`);
    candidateSlots.push(`${String(h).padStart(2, '0')}:30`);
  }

  // Filtra apenas os livres
  const freeSlots = candidateSlots.filter((slotStr) => !checkSlotBusy(slotStr));

  // Ordena pela menor distância em minutos em relação ao horário preferido
  const sortedFreeSlots = [...freeSlots].sort((a, b) => {
    const [hA, mA] = a.split(':').map((s) => parseInt(s, 10));
    const [hB, mB] = b.split(':').map((s) => parseInt(s, 10));
    const distA = Math.abs(hA * 60 + mA - prefTotalMinutes);
    const distB = Math.abs(hB * 60 + mB - prefTotalMinutes);
    return distA - distB;
  });

  const top3Alternatives: SmartReturnSlotOption[] = sortedFreeSlots.slice(0, 3).map((slotStr) => {
    const [h, m] = slotStr.split(':').map((s) => parseInt(s, 10));
    const d = new Date(targetDate);
    d.setHours(h, m, 0, 0);
    return {
      dateTime: d,
      timeStr: slotStr,
      dateStr: targetDateIsoStr,
    };
  });

  return {
    targetDate,
    preferredTimeStr,
    isPreferredAvailable,
    wasAdjustedFromSunday: wasSunday,
    suggestedAlternatives: top3Alternatives,
  };
}
