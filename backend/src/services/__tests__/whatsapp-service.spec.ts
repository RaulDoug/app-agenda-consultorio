import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WhatsappService } from '../whatsapp-service.js';
import type { WhatsappRepository } from '../../repositories/whatsapp-repository.js';
import type { IEvolutionClient } from '../../whatsapp/evolution-client.js';

describe('WhatsappService — Sessão, Mensagens e Settings', () => {
  let service: WhatsappService;
  let mockRepo: any;
  let mockEvolutionClient: any;

  const tenantId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    mockRepo = {
      getTenant: vi.fn(),
      updateTenantConnection: vi.fn(),
      logMessage: vi.fn(),
      ensureDefaultSettings: vi.fn(),
      upsertSettings: vi.fn(),
      listMessages: vi.fn(),
    };

    mockEvolutionClient = {
      getConnectionState: vi.fn(),
      getQrCode: vi.fn(),
      logoutInstance: vi.fn(),
      sendTextMessage: vi.fn(),
    };

    service = new WhatsappService(mockRepo as unknown as WhatsappRepository, mockEvolutionClient as IEvolutionClient);
  });

  describe('getSession', () => {
    it('deve retornar conectado quando tenant já estiver com whatsapp_connected = true', async () => {
      mockRepo.getTenant.mockResolvedValue({
        id: tenantId,
        whatsapp_instance_name: 'sorriso_instance',
        whatsapp_connected: true,
      });

      const res = await service.getSession(tenantId);
      expect(res.connected).toBe(true);
      expect(res.state).toBe('open');
      expect(res.instanceName).toBe('sorriso_instance');
    });

    it('deve sincronizar com Evolution API quando no banco estiver desconectado mas Evolution reportar open', async () => {
      mockRepo.getTenant.mockResolvedValue({
        id: tenantId,
        whatsapp_instance_name: 'sorriso_instance',
        whatsapp_connected: false,
      });
      mockEvolutionClient.getConnectionState.mockResolvedValue({ state: 'open' });

      const res = await service.getSession(tenantId);
      expect(res.connected).toBe(true);
      expect(res.state).toBe('open');
      expect(mockRepo.updateTenantConnection).toHaveBeenCalledWith(tenantId, true);
    });

    it('deve retornar QR code quando instância estiver desconectada', async () => {
      mockRepo.getTenant.mockResolvedValue({
        id: tenantId,
        whatsapp_instance_name: 'sorriso_instance',
        whatsapp_connected: false,
      });
      mockEvolutionClient.getConnectionState.mockResolvedValue({ state: 'close' });
      mockEvolutionClient.getQrCode.mockResolvedValue({ base64: 'fake-qr-code' });

      const res = await service.getSession(tenantId);
      expect(res.connected).toBe(false);
      expect(res.state).toBe('close');
      expect(res.qrcode).toBe('data:image/png;base64,fake-qr-code');
    });
  });

  describe('sendMessage', () => {
    it('deve normalizar telefone, disparar via Evolution API e gravar no histórico auditável', async () => {
      mockRepo.getTenant.mockResolvedValue({
        id: tenantId,
        whatsapp_instance_name: 'sorriso_instance',
      });
      mockEvolutionClient.sendTextMessage.mockResolvedValue({
        id: 'msg-evo-123',
        status: 'SENT',
      });
      mockRepo.logMessage.mockResolvedValue({
        id: 'msg-db-uuid',
      });

      const res = await service.sendMessage(tenantId, {
        number: '31999998888',
        text: 'Olá paciente!',
      });

      expect(res.success).toBe(true);
      expect(res.messageId).toBe('msg-db-uuid');
      expect(mockEvolutionClient.sendTextMessage).toHaveBeenCalledWith({
        instanceName: 'sorriso_instance',
        number: '5531999998888',
        text: 'Olá paciente!',
      });
      expect(mockRepo.logMessage).toHaveBeenCalledWith(tenantId, expect.objectContaining({
        direction: 'OUTBOUND',
        phone: '5531999998888',
        message_text: 'Olá paciente!',
        status: 'SENT',
        evolution_message_id: 'msg-evo-123',
      }));
    });
  });

  describe('Settings', () => {
    it('deve delegar getSettings para ensureDefaultSettings no repositório', async () => {
      const sampleSettings = { tenant_id: tenantId, confirmation_hour: 9 };
      mockRepo.ensureDefaultSettings.mockResolvedValue(sampleSettings);

      const res = await service.getSettings(tenantId);
      expect(res).toEqual(sampleSettings);
      expect(mockRepo.ensureDefaultSettings).toHaveBeenCalledWith(tenantId);
    });

    it('deve delegar updateSettings para upsertSettings no repositório', async () => {
      const updateInput = { confirmation_hour: 8 };
      mockRepo.upsertSettings.mockResolvedValue({ tenant_id: tenantId, ...updateInput });

      const res = await service.updateSettings(tenantId, updateInput);
      expect(res.confirmation_hour).toBe(8);
      expect(mockRepo.upsertSettings).toHaveBeenCalledWith(tenantId, updateInput);
    });
  });
});
