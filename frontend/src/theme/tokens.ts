/**
 * Tokens de Design do CliniAssist
 * Cores semânticas, estilos de status da agenda e utilitários de acessibilidade
 */

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RESCHEDULE_REQUESTED'
  | 'MESSAGE_RECEIVED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED';

export interface StatusStyle {
  hex: string;
  label: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  cardBg: string;
}

export const STATUS_TOKENS: Record<AppointmentStatus, StatusStyle> = {
  CONFIRMED: {
    hex: '#10B981',
    label: 'Confirmado',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    borderClass: 'border-l-emerald-500',
    cardBg: 'bg-emerald-50/50',
  },
  PENDING: {
    hex: '#F59E0B',
    label: 'Pendente',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    borderClass: 'border-l-amber-500',
    cardBg: 'bg-amber-50/50',
  },
  RESCHEDULE_REQUESTED: {
    hex: '#F97316',
    label: 'Reagendamento Solicitado',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    borderClass: 'border-l-orange-500',
    cardBg: 'bg-orange-50/50',
  },
  MESSAGE_RECEIVED: {
    hex: '#3B82F6',
    label: 'Mensagem Recebida',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    borderClass: 'border-l-blue-500',
    cardBg: 'bg-blue-50/50',
  },
  COMPLETED: {
    hex: '#64748B',
    label: 'Concluído',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-800',
    borderClass: 'border-l-slate-400',
    cardBg: 'bg-slate-50',
  },
  NO_SHOW: {
    hex: '#EF4444',
    label: 'Paciente Faltou',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    borderClass: 'border-l-rose-500',
    cardBg: 'bg-rose-50/50',
  },
  CANCELLED: {
    hex: '#94A3B8',
    label: 'Cancelado',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    borderClass: 'border-l-slate-300',
    cardBg: 'bg-slate-50/50',
  },
};

export const BRAND_COLORS = {
  primary: '#0D9488', // Teal 600
  primaryHover: '#0F766E', // Teal 700
  secondary: '#0284C7', // Sky 600
  surface: '#FFFFFF',
  background: '#F8FAFC',
};
