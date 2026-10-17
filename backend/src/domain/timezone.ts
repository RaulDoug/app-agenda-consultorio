const SAO_PAULO_TZ = 'America/Sao_Paulo';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SAO_PAULO_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: SAO_PAULO_TZ,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/**
 * Retorna a data civil no formato YYYY-MM-DD no fuso America/Sao_Paulo (UTC-3).
 * Garante que uma consulta às 22:00 UTC-3 (01:00 UTC do dia seguinte) mantenha o dia correto.
 */
export function getCivilDateInSaoPaulo(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    throw new Error('Data inválida para conversão de fuso horário.');
  }
  return dateFormatter.format(date); // en-CA produz YYYY-MM-DD
}

/**
 * Retorna o horário no formato HH:mm:ss no fuso America/Sao_Paulo.
 */
export function getTimeInSaoPaulo(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    throw new Error('Data inválida para conversão de fuso horário.');
  }
  return timeFormatter.format(date);
}

/**
 * Converte uma string local "YYYY-MM-DDTHH:mm:ss" ou "YYYY-MM-DD HH:mm:ss" no fuso America/Sao_Paulo
 * para uma instância de Date com o offset correto (-03:00).
 */
export function parseSaoPauloDateTime(dateTimeStr: string): Date {
  const sanitized = dateTimeStr.trim().replace(' ', 'T');
  // Se já tiver offset ou Z, faz parse direto
  if (sanitized.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(sanitized)) {
    return new Date(sanitized);
  }
  // No Brasil padrão atual (sem horário de verão), o fuso é fixo em -03:00
  return new Date(`${sanitized}-03:00`);
}

/**
 * Compara se duas datas/instantes caem no mesmo dia civil no fuso de São Paulo.
 */
export function isSameCivilDaySaoPaulo(dateA: Date | string, dateB: Date | string): boolean {
  return getCivilDateInSaoPaulo(dateA) === getCivilDateInSaoPaulo(dateB);
}
