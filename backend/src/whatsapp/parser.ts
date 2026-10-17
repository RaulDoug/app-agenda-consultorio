import type { AppointmentStatus } from '@odontoflow/shared';

export type ParsedMessageClassification =
  | 'CONFIRMED'
  | 'RESCHEDULE_REQUESTED'
  | 'MESSAGE_RECEIVED';

export interface ParseMessageInput {
  text?: string | null;
  messageType?: 'text' | 'audio' | 'image' | 'document' | 'video' | 'sticker' | 'unknown';
  mediaUrl?: string | null;
  rawPayload?: any;
}

export interface ParseResult {
  classification: ParsedMessageClassification;
  confidence: number;
  isAudioOrMedia: boolean;
  rawText: string;
}

export interface StatusTransitionResult {
  newStatus: AppointmentStatus;
  changedMind: boolean;
  requiresAttention: boolean;
  reason?: string;
}

// Handler extensível para resposta a áudios/mídias (Opção A com facilidade de evolução)
export type MediaResponseHook = (input: ParseMessageInput) => Promise<string | null>;

let activeMediaResponseHook: MediaResponseHook | null = null;

export function registerMediaResponseHook(hook: MediaResponseHook | null): void {
  activeMediaResponseHook = hook;
}

export function getActiveMediaResponseHook(): MediaResponseHook | null {
  return activeMediaResponseHook;
}

// Expressões canônicas de confirmação
const CONFIRMATION_PATTERNS = [
  /^1\b/,
  /\b(sim|confirmar|confirmado|confirmada|confirmo|positivo|certo|estarei|vou sim|ok|beleza|combinado)\b/i,
  /[👍👌✅]/u,
];

// Expressões canônicas de remarcação / cancelamento
const RESCHEDULE_PATTERNS = [
  /^2\b/,
  /\b(remarcar|reagendar|não posso|nao posso|não poderei|nao poderei|não consigo|nao consigo|cancelar|desmarcar|trocar|mudar|adiar|outro dia|outro horário|outro horario|infelizmente não|infelizmente nao)\b/i,
  /[👎❌]/u,
];

/**
 * Classifica semanticamente o conteúdo da mensagem recebida do paciente.
 */
export function parsePatientMessage(input: ParseMessageInput | string): ParseResult {
  const normalizedInput: ParseMessageInput =
    typeof input === 'string'
      ? { text: input, messageType: 'text' }
      : input;

  const messageType = normalizedInput.messageType || 'text';
  const text = (normalizedInput.text || '').trim();

  // 1. Mensagens de Áudio ou Mídia
  if (messageType === 'audio' || messageType === 'image' || messageType === 'video' || messageType === 'document') {
    return {
      classification: 'MESSAGE_RECEIVED',
      confidence: 1.0,
      isAudioOrMedia: true,
      rawText: text,
    };
  }

  if (!text) {
    return {
      classification: 'MESSAGE_RECEIVED',
      confidence: 0.5,
      isAudioOrMedia: false,
      rawText: '',
    };
  }

  // 2. Confirmação
  const isConfirmation = CONFIRMATION_PATTERNS.some((pattern) => pattern.test(text));
  const isReschedule = RESCHEDULE_PATTERNS.some((pattern) => pattern.test(text));

  // Se tem padrões conflitantes ou texto longo com ressalvas, prioriza remarcação ou mensagem livre
  if (isConfirmation && !isReschedule) {
    return {
      classification: 'CONFIRMED',
      confidence: 0.95,
      isAudioOrMedia: false,
      rawText: text,
    };
  }

  if (isReschedule) {
    return {
      classification: 'RESCHEDULE_REQUESTED',
      confidence: 0.95,
      isAudioOrMedia: false,
      rawText: text,
    };
  }

  // 3. Texto livre / dúvidas gerais -> notificação para secretária/dentista
  return {
    classification: 'MESSAGE_RECEIVED',
    confidence: 0.7,
    isAudioOrMedia: false,
    rawText: text,
  };
}

/**
 * Valida e calcula a transição de estado da consulta após a mensagem do paciente,
 * incluindo detecção de quando o paciente "muda de ideia" (ex: confirma e depois remarca).
 */
export function resolveStatusTransition(
  currentStatus: AppointmentStatus,
  classification: ParsedMessageClassification
): StatusTransitionResult {
  // Imutabilidade de consultas concluídas ou canceladas
  if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
    return {
      newStatus: currentStatus,
      changedMind: false,
      requiresAttention: true,
      reason: `Consulta já finalizada no estado ${currentStatus}. Status imutável.`,
    };
  }

  // Paciente muda de ideia: já havia confirmado, mas agora pede remarcação
  if (currentStatus === 'CONFIRMED' && classification === 'RESCHEDULE_REQUESTED') {
    return {
      newStatus: 'RESCHEDULE_REQUESTED',
      changedMind: true,
      requiresAttention: true,
      reason: 'Paciente havia confirmado anteriormente, mas solicitou reagendamento.',
    };
  }

  // Paciente estava com remarcação solicitada e confirma novamente
  if (currentStatus === 'RESCHEDULE_REQUESTED' && classification === 'CONFIRMED') {
    return {
      newStatus: 'CONFIRMED',
      changedMind: true,
      requiresAttention: false,
      reason: 'Paciente reconsiderou e confirmou a consulta.',
    };
  }

  // Fluxo normal a partir de PENDING
  if (classification === 'CONFIRMED') {
    return {
      newStatus: 'CONFIRMED',
      changedMind: false,
      requiresAttention: false,
    };
  }

  if (classification === 'RESCHEDULE_REQUESTED') {
    return {
      newStatus: 'RESCHEDULE_REQUESTED',
      changedMind: false,
      requiresAttention: true,
    };
  }

  // MESSAGE_RECEIVED (dúvida ou áudio)
  return {
    newStatus: 'MESSAGE_RECEIVED',
    changedMind: false,
    requiresAttention: true,
    reason: 'Paciente enviou dúvida em texto ou áudio.',
  };
}
