import { processSpintax } from './spintax.js';

export function formatAppointmentDateTime(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });

  return `${dateStr} às ${timeStr}`;
}

export function buildConfirmationReply(patientName: string, appointmentDate: Date | string): string {
  const formattedDateTime = formatAppointmentDateTime(appointmentDate);
  const firstName = patientName.trim().split(' ')[0] || patientName;

  const template = `{Perfeito|Excelente|Muito obrigado}, ${firstName}! Sua consulta foi confirmada para ${formattedDateTime}. Te esperamos na clínica! 🦷✨`;
  return processSpintax(template);
}

export function buildRescheduleReply(patientName: string): string {
  const firstName = patientName.trim().split(' ')[0] || patientName;
  const template = `{Tudo bem|Entendido|Sem problemas}, ${firstName}! Já registramos sua solicitação de remarcação. Nossa equipe entrará em contato em breve para agendar um novo horário ideal para você. 😊`;
  return processSpintax(template);
}
