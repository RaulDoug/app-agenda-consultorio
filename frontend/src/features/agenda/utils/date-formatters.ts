import { ViewMode } from '../types';

/**
 * Retorna o intervalo exato (início e fim) de acordo com o modo de visualização.
 * - 'day': início (00:00:00.000) e término (23:59:59.999) da data especificada.
 * - 'week': segunda-feira (00:00:00.000) a domingo (23:59:59.999) da semana atual.
 * - 'month': primeiro dia (00:00:00.000) ao último dia (23:59:59.999) do mês.
 */
export function getAgendaPeriodRange(currentDate: Date, viewMode: ViewMode): { start: Date; end: Date } {
  if (viewMode === 'day') {
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(currentDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (viewMode === 'week') {
    const start = new Date(currentDate);
    const dayOfWeek = start.getDay();
    // No JS: 0 é domingo, 1 é segunda-feira.
    // Queremos que a semana comece na segunda-feira.
    const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // Month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Formata o período de acordo com a Abordagem A (Direta e Limpa):
 * - Dia: "Ter., 27 de out. de 2026"
 * - Semana: "19 – 25 de out. de 2026" / "26 de out. – 01 de nov. de 2026" / "28 de dez. de 2026 – 03 de jan. de 2027"
 * - Mês: "Outubro de 2026"
 */
export function formatAgendaPeriod(currentDate: Date, viewMode: ViewMode): string {
  if (viewMode === 'day') {
    const raw = currentDate.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    // Capitaliza apenas a primeira letra para não colocar maiúsculas nos 'de'
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  if (viewMode === 'week') {
    const { start, end } = getAgendaPeriodRange(currentDate, 'week');
    const pad = (n: number) => String(n).padStart(2, '0');
    const m1 = start.toLocaleDateString('pt-BR', { month: 'short' });
    const m2 = end.toLocaleDateString('pt-BR', { month: 'short' });
    const y1 = start.getFullYear();
    const y2 = end.getFullYear();

    if (y1 !== y2) {
      return `${pad(start.getDate())} de ${m1} de ${y1} \u2013 ${pad(end.getDate())} de ${m2} de ${y2}`;
    }
    if (start.getMonth() !== end.getMonth()) {
      return `${pad(start.getDate())} de ${m1} \u2013 ${pad(end.getDate())} de ${m2} de ${y1}`;
    }
    return `${pad(start.getDate())} \u2013 ${pad(end.getDate())} de ${m1} de ${y1}`;
  }

  // Month
  const raw = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Conta a quantidade de agendamentos não cancelados dentro do intervalo do período.
 */
export function countAppointmentsInPeriod(
  appointments: Array<{ start_time: string | Date; status: string }>,
  range: { start: Date; end: Date }
): number {
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();

  return appointments.filter((app) => {
    if (app.status === 'CANCELLED') return false;
    try {
      const appMs = new Date(app.start_time).getTime();
      return !Number.isNaN(appMs) && appMs >= startMs && appMs <= endMs;
    } catch {
      return false;
    }
  }).length;
}

/**
 * Retorna o texto formatado para a contagem de atendimentos.
 */
export function formatAppointmentsCount(count: number): string {
  if (count <= 0) {
    return 'Nenhum atendimento';
  }
  if (count === 1) {
    return '1 atendimento';
  }
  return `${count} atendimentos`;
}

