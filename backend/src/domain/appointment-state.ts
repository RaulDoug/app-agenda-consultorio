import type { AppointmentStatus } from '@odontoflow/shared';

const TERMINAL_STATUSES: Set<AppointmentStatus> = new Set(['COMPLETED', 'CANCELLED']);

const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ['CONFIRMED', 'RESCHEDULE_REQUESTED', 'MESSAGE_RECEIVED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'],
  CONFIRMED: ['RESCHEDULE_REQUESTED', 'MESSAGE_RECEIVED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'],
  RESCHEDULE_REQUESTED: ['PENDING', 'CONFIRMED', 'CANCELLED'],
  MESSAGE_RECEIVED: ['CONFIRMED', 'RESCHEDULE_REQUESTED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'],
  NO_SHOW: ['RESCHEDULE_REQUESTED', 'CANCELLED'],
  COMPLETED: [], // Imutável
  CANCELLED: [], // Imutável
};

export interface StatusTransitionResult {
  allowed: boolean;
  reason?: string;
}

export function canTransitionAppointmentStatus(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus
): StatusTransitionResult {
  // Transição para o mesmo status é idempotente / permitida
  if (currentStatus === nextStatus) {
    return { allowed: true };
  }

  // Estados terminais são absolutamente imutáveis
  if (TERMINAL_STATUSES.has(currentStatus)) {
    return {
      allowed: false,
      reason: `Imutabilidade violada: agendamento com status terminal '${currentStatus}' não pode ser alterado para '${nextStatus}'.`,
    };
  }

  const validTargets = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (validTargets.includes(nextStatus)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Transição inválida: não é permitido alterar o status de '${currentStatus}' para '${nextStatus}'.`,
  };
}

export function assertValidStatusTransition(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus
): void {
  const result = canTransitionAppointmentStatus(currentStatus, nextStatus);
  if (!result.allowed) {
    throw new Error(result.reason);
  }
}
