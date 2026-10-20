import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebhookService } from '../webhook-service.js';
import type { WhatsappRepository } from '../../repositories/whatsapp-repository.js';
import type { IEvolutionClient } from '../../whatsapp/evolution-client.js';
import { InMemoryConfirmationQueue } from '../../whatsapp/queue.js';

describe('WebhookService — Processamento de Eventos e Réplicas', () => {
  let service: WebhookService;
  let mockRepo: any;
  let mockEvolutionClient: any;
  let queue: InMemoryConfirmationQueue;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const instanceName = 'sorriso_instance';
  const patientPhone = '5511999998888';

  beforeEach(() => {
    queue = new InMemoryConfirmationQueue();

    mockRepo = {
      updateTenantConnection: vi.fn(),
      getTenant: vi.fn(),
      findPatientByPhone: vi.fn(),
      findRelevantAppointmentForPatient: vi.fn(),
      logMessage: vi.fn(),
      updateAppointmentStatus: vi.fn(),
      ensureDefaultSettings: vi.fn(),
      db: {
        query: vi.fn(),
      },
    };

    mockEvolutionClient = {
      sendTextMessage: vi.fn().mockResolvedValue({ id: 'msg-replica-123' }),
    };

    service = new WebhookService(
      mockRepo as unknown as WhatsappRepository,
      mockEvolutionClient as IEvolutionClient,
      queue
    );
  });

  describe('Eventos de Conexão (connection.update)', () => {
    it('deve pausar a fila e marcar como desconectado ao receber evento de queda (close)', async () => {
      const payload = {
        event: 'connection.update',
        instance: instanceName,
        data: { state: 'close', statusReason: 'CONNECTION_LOST' },
      };

      const res = await service.handleWebhook(payload);

      expect(res.statusCode).toBe(200);
      expect(res.status).toBe('connection_lost');
      expect(mockRepo.updateTenantConnection).toHaveBeenCalledWith(instanceName, false, true);
      expect(await queue.isPaused()).toBe(true);
    });

    it('deve retomar a fila e marcar como conectado ao receber evento de conexão estabelecida (open)', async () => {
      await queue.pause();

      const payload = {
        event: 'connection.update',
        instance: instanceName,
        data: { state: 'open', statusReason: 'CONNECTION_ESTABLISHED' },
      };

      const res = await service.handleWebhook(payload);

      expect(res.statusCode).toBe(200);
      expect(res.status).toBe('connection_restored');
      expect(mockRepo.updateTenantConnection).toHaveBeenCalledWith(instanceName, true, true);
    });
  });

  describe('Eventos de Mensagens (messages.upsert)', () => {
    it('deve ignorar mensagens enviadas pelo próprio consultório (fromMe: true)', async () => {
      const payload = {
        event: 'messages.upsert',
        data: { key: { fromMe: true } },
      };

      const res = await service.handleWebhook(payload);
      expect(res.status).toBe('ignored_from_me');
    });

    it('deve responder 200 silencioso quando o número não for reconhecido (AC-025)', async () => {
      mockRepo.getTenant.mockResolvedValue({ id: tenantId, whatsapp_instance_name: instanceName });
      mockRepo.findPatientByPhone.mockResolvedValue(null);

      const payload = {
        event: 'messages.upsert',
        instance: instanceName,
        data: {
          key: { remoteJid: `${patientPhone}@s.whatsapp.net`, fromMe: false },
          message: { conversation: 'Olá, qual o endereço?' },
        },
      };

      const res = await service.handleWebhook(payload);
      expect(res.statusCode).toBe(200);
      expect(res.status).toBe('ignored_unknown_number');
    });

    it('deve confirmar consulta, registrar log e disparar réplica humanizada ao receber "1"', async () => {
      mockRepo.getTenant.mockResolvedValue({ id: tenantId, whatsapp_instance_name: instanceName });
      mockRepo.findPatientByPhone.mockResolvedValue({ id: 'pat-1', name: 'Rodrigo Alves' });
      mockRepo.findRelevantAppointmentForPatient.mockResolvedValue({
        id: 'app-1',
        status: 'PENDING',
        start_time: '2026-10-21T14:00:00.000Z',
      });
      mockRepo.ensureDefaultSettings.mockResolvedValue({
        auto_reply_enabled: true,
        confirmation_reply_template: 'Perfeito, {nome}! Sua consulta foi confirmada para {data} às {horario}.',
      });
      mockRepo.logMessage.mockResolvedValue({ id: 'log-1' });

      const payload = {
        event: 'messages.upsert',
        instance: instanceName,
        data: {
          key: { remoteJid: `${patientPhone}@s.whatsapp.net`, fromMe: false },
          message: { conversation: '1' },
        },
      };

      const res = await service.handleWebhook(payload);

      expect(res.status).toBe('processed');
      expect(res.data.new_status).toBe('CONFIRMED');
      expect(res.data.reply_sent).toBe(true);

      // Valida atualização do agendamento
      expect(mockRepo.updateAppointmentStatus).toHaveBeenCalledWith(tenantId, 'app-1', 'CONFIRMED');

      // Valida log da mensagem recebida e da réplica enviada
      expect(mockRepo.logMessage).toHaveBeenCalledTimes(2);

      // Valida envio da réplica pelo client
      expect(mockEvolutionClient.sendTextMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceName,
          number: patientPhone,
          text: expect.stringContaining('Rodrigo'),
        })
      );
    });

    it('deve aplicar réplica de acolhimento humanizada quando paciente enviar dúvida ou áudio (MESSAGE_RECEIVED)', async () => {
      mockRepo.getTenant.mockResolvedValue({ id: tenantId, whatsapp_instance_name: instanceName });
      mockRepo.findPatientByPhone.mockResolvedValue({ id: 'pat-1', name: 'Carla Dias' });
      mockRepo.findRelevantAppointmentForPatient.mockResolvedValue({
        id: 'app-2',
        status: 'PENDING',
        start_time: '2026-10-21T14:00:00.000Z',
      });
      mockRepo.ensureDefaultSettings.mockResolvedValue({
        auto_reply_enabled: true,
        welcome_fallback_reply_template: 'Olá, {nome}! Recebemos sua mensagem. Nossa equipe humana entrará em contato em breve.',
      });
      mockRepo.logMessage.mockResolvedValue({ id: 'log-2' });

      const payload = {
        event: 'messages.upsert',
        instance: instanceName,
        data: {
          key: { remoteJid: `${patientPhone}@s.whatsapp.net`, fromMe: false },
          message: { conversation: 'Qual o valor da limpeza?' },
        },
      };

      const res = await service.handleWebhook(payload);

      expect(res.status).toBe('processed');
      expect(res.data.new_status).toBe('MESSAGE_RECEIVED');
      expect(res.data.requires_attention).toBe(true);
      expect(res.data.reply_sent).toBe(true);

      expect(mockEvolutionClient.sendTextMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('equipe humana'),
        })
      );
    });
  });
});
