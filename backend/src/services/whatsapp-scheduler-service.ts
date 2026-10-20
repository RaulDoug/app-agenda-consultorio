import { WhatsappRepository } from '../repositories/whatsapp-repository.js';
import {
  getConfirmationQueue,
  type IConfirmationQueue,
} from '../whatsapp/queue.js';
import {
  scheduleConfirmationBatch,
  isWithinCommercialWindow,
  type BatchScheduleResult,
} from '../whatsapp/scheduler.js';
import type { BatchConfirmationTriggerResult } from '@cliniassist/shared';

export interface ScheduleBatchOptions {
  referenceDate?: Date;
  force?: boolean;
}

export class WhatsappSchedulerService {
  private customRepo?: WhatsappRepository;
  private customQueue?: IConfirmationQueue;

  constructor(repo?: WhatsappRepository, queue?: IConfirmationQueue) {
    this.customRepo = repo;
    this.customQueue = queue;
  }

  private get repo(): WhatsappRepository {
    return this.customRepo || new WhatsappRepository();
  }

  private get queue(): IConfirmationQueue {
    return this.customQueue || getConfirmationQueue();
  }

  /**
   * Executa a varredura e agendamento em lote de confirmações para um consultório específico.
   * Aplica idempotência de 12 horas para evitar disparos duplicados (a menos que force = true).
   */
  async scheduleBatchForTenant(
    tenantId: string,
    options?: ScheduleBatchOptions
  ): Promise<BatchConfirmationTriggerResult> {
    const refDate = options?.referenceDate || new Date();
    const settings = await this.repo.ensureDefaultSettings(tenantId);

    // Calcula a data da consulta com base na antecedência configurada (ex: D+1)
    const daysAhead = settings.confirmation_days_ahead || 1;
    const targetDate = new Date(refDate);
    targetDate.setDate(targetDate.getDate() + daysAhead);

    // Busca consultas PENDING no dia alvo, aplicando idempotência de 12h
    const ignoreHours = options?.force ? undefined : 12;
    const candidates = await this.repo.findPendingAppointmentsForConfirmation(
      tenantId,
      targetDate,
      { ignoreRecentlyNotifiedHours: ignoreHours }
    );

    // Enfileira os candidatos no BullMQ com jitter humanizado e spintax
    const batchResult: BatchScheduleResult = await scheduleConfirmationBatch(
      candidates,
      this.queue,
      { referenceDate: refDate }
    );

    const enqueuedDetails = batchResult.enqueuedJobs.map((job) => {
      const candidate = candidates.find((c) => c.appointmentId === job.appointmentId);
      return {
        appointmentId: job.appointmentId,
        patientName: candidate?.patientName || '',
        phone: candidate?.phone || '',
        delayMs: job.delayMs,
      };
    });

    return {
      scheduledCount: batchResult.scheduledCount,
      skippedCount: batchResult.skippedSameDayCount,
      skippedSameDayCount: batchResult.skippedSameDayCount,
      skippedRecentlyNotifiedCount: 0,
      skippedAppointments: batchResult.skippedSameDayAppointments,
      enqueuedJobs: enqueuedDetails,
    };
  }

  /**
   * Executa a varredura diária matinal automática em todos os consultórios com WhatsApp conectado.
   */
  async runDailyConfirmationScan(referenceDate?: Date): Promise<{
    processedTenants: number;
    totalScheduled: number;
    results: Record<string, BatchConfirmationTriggerResult>;
  }> {
    const now = referenceDate || new Date();

    if (!isWithinCommercialWindow(now)) {
      throw new Error('Disparo de confirmações bloqueado: fora da janela comercial permitida (08:00 às 20:00).');
    }

    // Busca tenants ativos e conectados ao WhatsApp
    const tenantsRes = await (this.repo as any).db.query(
      `SELECT id, name FROM tenants WHERE whatsapp_connected = true AND is_active = true`
    );

    const results: Record<string, BatchConfirmationTriggerResult> = {};
    let totalScheduled = 0;

    for (const tenant of tenantsRes.rows) {
      try {
        const batchRes = await this.scheduleBatchForTenant(tenant.id, { referenceDate: now });
        results[tenant.id] = batchRes;
        totalScheduled += batchRes.scheduledCount;
      } catch (err: any) {
        console.warn(`[Scheduler] Falha ao processar lote para tenant ${tenant.id}:`, err.message);
      }
    }

    return {
      processedTenants: tenantsRes.rows.length,
      totalScheduled,
      results,
    };
  }
}
