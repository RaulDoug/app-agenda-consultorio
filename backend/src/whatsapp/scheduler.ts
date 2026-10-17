import {
  type IConfirmationQueue,
  type ConfirmationJobData,
  type EnqueuedJobRecord,
} from './queue.js';
import { getCivilDateInSaoPaulo } from '../domain/timezone.js';

export interface AppointmentConfirmationCandidate {
  appointmentId: string;
  tenantId: string;
  instanceName: string;
  phone: string;
  patientName: string;
  appointmentStartTime: string; // ISO 8601
}

export interface BatchScheduleResult {
  scheduledCount: number;
  skippedSameDayCount: number;
  skippedSameDayAppointments: string[];
  enqueuedJobs: Array<{ appointmentId: string; delayMs: number }>;
}

export interface ReconnectionResult {
  resumed: boolean;
  activeJobsCount: number;
  expiredJobsCount: number;
  dentistAlerts: string[];
}

/**
 * Retorna se a data/hora atual está dentro da janela comercial permitida (08:00 às 20:00 no fuso de São Paulo).
 */
export function isWithinCommercialWindow(date: Date = new Date()): boolean {
  // Converte para hora em São Paulo (UTC-3)
  const spDateStr = date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour12: false });
  const timePart = spDateStr.split(', ')[1] || '';
  const hour = parseInt(timePart.split(':')[0], 10);

  return hour >= 8 && hour < 20;
}

/**
 * Retorna true se a consulta estiver agendada para o MESMO dia civil da data de referência.
 */
export function isSameDayAppointment(appointmentStartTime: string, referenceDate: Date = new Date()): boolean {
  const appointmentCivilDate = getCivilDateInSaoPaulo(new Date(appointmentStartTime));
  const referenceCivilDate = getCivilDateInSaoPaulo(referenceDate);

  return appointmentCivilDate === referenceCivilDate;
}

/**
 * Gera atrasos incrementais com jitter randômico entre minJitter e maxJitter segundos para cada job subsequente.
 */
export function calculateJitterDelays(
  count: number,
  minJitterSec: number = 20,
  maxJitterSec: number = 50
): number[] {
  const delays: number[] = [];
  let accumulatedMs = 0;

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      delays.push(0);
    } else {
      const randomSeconds = Math.floor(Math.random() * (maxJitterSec - minJitterSec + 1)) + minJitterSec;
      accumulatedMs += randomSeconds * 1000;
      delays.push(accumulatedMs);
    }
  }

  return delays;
}

/**
 * Agenda o lote de confirmações com jitter humanizado e salvaguarda temporal contra disparos no mesmo dia da consulta.
 */
export async function scheduleConfirmationBatch(
  candidates: AppointmentConfirmationCandidate[],
  queue: IConfirmationQueue,
  options?: {
    referenceDate?: Date;
    minJitterSec?: number;
    maxJitterSec?: number;
  }
): Promise<BatchScheduleResult> {
  const refDate = options?.referenceDate || new Date();
  const minJitter = options?.minJitterSec ?? 20;
  const maxJitter = options?.maxJitterSec ?? 50;

  const validCandidates: AppointmentConfirmationCandidate[] = [];
  const skippedSameDay: string[] = [];

  // Salvaguarda: NUNCA disparar confirmação no próprio dia da consulta (apenas 24h a 48h antes)
  for (const candidate of candidates) {
    if (isSameDayAppointment(candidate.appointmentStartTime, refDate)) {
      skippedSameDay.push(candidate.appointmentId);
    } else {
      validCandidates.push(candidate);
    }
  }

  const delays = calculateJitterDelays(validCandidates.length, minJitter, maxJitter);
  const enqueuedJobs: Array<{ appointmentId: string; delayMs: number }> = [];

  for (let i = 0; i < validCandidates.length; i++) {
    const candidate = validCandidates[i];
    const delay = delays[i];

    const jobData: ConfirmationJobData = {
      appointmentId: candidate.appointmentId,
      tenantId: candidate.tenantId,
      instanceName: candidate.instanceName,
      phone: candidate.phone,
      patientName: candidate.patientName,
      appointmentStartTime: candidate.appointmentStartTime,
      createdAt: new Date().toISOString(),
    };

    await queue.addJob(`confirm-${candidate.appointmentId}`, jobData, { delay });
    enqueuedJobs.push({ appointmentId: candidate.appointmentId, delayMs: delay });
  }

  return {
    scheduledCount: validCandidates.length,
    skippedSameDayCount: skippedSameDay.length,
    skippedSameDayAppointments: skippedSameDay,
    enqueuedJobs,
  };
}

/**
 * Trata o evento de reconexão do WhatsApp (CONNECTION_ESTABLISHED) aplicando salvaguardas de expiração.
 */
export async function handleConnectionRestored(
  queue: IConfirmationQueue,
  options?: {
    currentTime?: Date;
  }
): Promise<ReconnectionResult> {
  const now = options?.currentTime || new Date();
  const alerts: string[] = [];

  // 1. Verifica se a hora atual está fora da janela comercial permitida (08:00 às 20:00)
  const isWithinWindow = isWithinCommercialWindow(now);

  const pendingJobs = await queue.getPendingJobs();
  let expiredCount = 0;
  let activeCount = 0;

  for (const job of pendingJobs) {
    // Salvaguarda 1: Se a consulta já é HOJE ou já passou -> job expirado
    const isSameOrPastDay = isSameDayAppointment(job.data.appointmentStartTime, now) ||
      new Date(job.data.appointmentStartTime).getTime() <= now.getTime();

    // Salvaguarda 2: Se reconectou fora da janela comercial (ex: 22h) -> não pode disparar automaticamente
    if (isSameOrPastDay || !isWithinWindow) {
      expiredCount++;
      const reason = isSameOrPastDay
        ? 'o horário da consulta já é hoje ou já ocorreu'
        : 'a reconexão ocorreu fora da janela comercial permitida (08:00 às 20:00)';
      alerts.push(
        `Alerta: Disparo para ${job.data.patientName} (${job.data.phone}) abortado porque ${reason}.`
      );
    } else {
      activeCount++;
    }
  }

  // Se estiver fora da janela comercial, mantém pausado para não acordar pacientes
  if (!isWithinWindow || expiredCount > 0 && activeCount === 0) {
    await queue.pause();
    return {
      resumed: false,
      activeJobsCount: activeCount,
      expiredJobsCount: expiredCount,
      dentistAlerts: alerts,
    };
  }

  // Se dentro da janela e com jobs válidos, retoma a fila automaticamente
  await queue.resume();
  return {
    resumed: true,
    activeJobsCount: activeCount,
    expiredJobsCount: expiredCount,
    dentistAlerts: alerts,
  };
}
