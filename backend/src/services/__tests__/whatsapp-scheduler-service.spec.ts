import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WhatsappSchedulerService } from '../whatsapp-scheduler-service.js';
import type { WhatsappRepository } from '../../repositories/whatsapp-repository.js';
import { InMemoryConfirmationQueue } from '../../whatsapp/queue.js';

describe('WhatsappSchedulerService — Varredura Diária e Agendamento em Lote', () => {
  let scheduler: WhatsappSchedulerService;
  let mockRepo: any;
  let queue: InMemoryConfirmationQueue;

  const tenantId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    queue = new InMemoryConfirmationQueue();
    mockRepo = {
      ensureDefaultSettings: vi.fn(),
      findPendingAppointmentsForConfirmation: vi.fn(),
      db: {
        query: vi.fn(),
      },
    };

    scheduler = new WhatsappSchedulerService(mockRepo as unknown as WhatsappRepository, queue);
  });

  describe('scheduleBatchForTenant', () => {
    it('deve calcular data D+1, buscar consultas e enfileirar jobs com jitter anti-ban', async () => {
      mockRepo.ensureDefaultSettings.mockResolvedValue({
        tenant_id: tenantId,
        confirmation_days_ahead: 1,
      });

      const referenceDate = new Date('2026-10-20T09:00:00.000Z');
      const sampleCandidates = [
        {
          appointmentId: 'app-1',
          tenantId,
          instanceName: 'sorriso_instance',
          phone: '5511999991111',
          patientName: 'Lucas Lima',
          appointmentStartTime: '2026-10-21T10:00:00.000Z',
        },
        {
          appointmentId: 'app-2',
          tenantId,
          instanceName: 'sorriso_instance',
          phone: '5511999992222',
          patientName: 'Mariana Souza',
          appointmentStartTime: '2026-10-21T11:00:00.000Z',
        },
      ];

      mockRepo.findPendingAppointmentsForConfirmation.mockResolvedValue(sampleCandidates);

      const res = await scheduler.scheduleBatchForTenant(tenantId, { referenceDate });

      expect(res.scheduledCount).toBe(2);
      expect(res.enqueuedJobs).toHaveLength(2);
      expect(res.enqueuedJobs[0].patientName).toBe('Lucas Lima');
      expect(res.enqueuedJobs[1].patientName).toBe('Mariana Souza');

      // Verifica se chamou o repo com idempotência ativada (12 horas)
      expect(mockRepo.findPendingAppointmentsForConfirmation).toHaveBeenCalledWith(
        tenantId,
        expect.any(Date),
        { ignoreRecentlyNotifiedHours: 12 }
      );

      // Checa fila
      const pendingJobs = await queue.getPendingJobs();
      expect(pendingJobs).toHaveLength(2);
    });

    it('deve ignorar filtro de 12h quando force = true for especificado', async () => {
      mockRepo.ensureDefaultSettings.mockResolvedValue({
        tenant_id: tenantId,
        confirmation_days_ahead: 1,
      });
      mockRepo.findPendingAppointmentsForConfirmation.mockResolvedValue([]);

      await scheduler.scheduleBatchForTenant(tenantId, { force: true });

      expect(mockRepo.findPendingAppointmentsForConfirmation).toHaveBeenCalledWith(
        tenantId,
        expect.any(Date),
        { ignoreRecentlyNotifiedHours: undefined }
      );
    });
  });

  describe('runDailyConfirmationScan', () => {
    it('deve rejeitar execução quando fora da janela comercial (ex: 22h)', async () => {
      const lateNightDate = new Date('2026-10-20T22:00:00.000-03:00');

      await expect(
        scheduler.runDailyConfirmationScan(lateNightDate)
      ).rejects.toThrow(/fora da janela comercial/);
    });

    it('deve processar tenants ativos e conectados dentro da janela comercial', async () => {
      const morningDate = new Date('2026-10-20T09:00:00.000-03:00');

      mockRepo.db.query.mockResolvedValue({
        rows: [{ id: tenantId, name: 'Clínica Sorriso' }],
      });
      mockRepo.ensureDefaultSettings.mockResolvedValue({
        tenant_id: tenantId,
        confirmation_days_ahead: 1,
      });
      mockRepo.findPendingAppointmentsForConfirmation.mockResolvedValue([]);

      const scanResult = await scheduler.runDailyConfirmationScan(morningDate);

      expect(scanResult.processedTenants).toBe(1);
      expect(scanResult.results[tenantId]).toBeDefined();
    });
  });
});
