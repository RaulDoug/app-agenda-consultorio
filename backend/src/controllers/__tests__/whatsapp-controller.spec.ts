import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WhatsappController } from '../whatsapp-controller.js';
import type { Request, Response } from 'express';

describe('WhatsappController — Validações HTTP e Status Codes', () => {
  let controller: WhatsappController;
  let mockWhatsappService: any;
  let mockSchedulerService: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let resStatus: number;
  let resJson: any;

  const tenantId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    resStatus = 200;
    resJson = null;

    mockReq = {
      tenantId,
      body: {},
      query: {},
      params: {},
    };

    mockRes = {
      status: vi.fn().mockImplementation((code: number) => {
        resStatus = code;
        return mockRes as Response;
      }),
      json: vi.fn().mockImplementation((data: any) => {
        resJson = data;
        return mockRes as Response;
      }),
    };

    mockWhatsappService = {
      getSession: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      sendMessage: vi.fn(),
      getSettings: vi.fn(),
      updateSettings: vi.fn(),
      listMessages: vi.fn(),
    };

    mockSchedulerService = {
      scheduleBatchForTenant: vi.fn(),
    };

    controller = new WhatsappController(mockWhatsappService, mockSchedulerService);
  });

  describe('getSession', () => {
    it('deve responder 200 com os dados de sessão', async () => {
      mockWhatsappService.getSession.mockResolvedValue({
        connected: true,
        instanceName: 'sorriso_instance',
        state: 'open',
      });

      await controller.getSession(mockReq as Request, mockRes as Response);

      expect(resStatus).toBe(200);
      expect(resJson.connected).toBe(true);
      expect(mockWhatsappService.getSession).toHaveBeenCalledWith(tenantId);
    });

    it('deve responder 500 em caso de exceção no service', async () => {
      mockWhatsappService.getSession.mockRejectedValue(new Error('Falha interna'));

      await controller.getSession(mockReq as Request, mockRes as Response);

      expect(resStatus).toBe(500);
      expect(resJson.error).toBe('Erro ao consultar status do WhatsApp.');
    });
  });

  describe('sendMessage', () => {
    it('deve rejeitar com 400 se number ou text faltarem', async () => {
      mockReq.body = { number: '' };

      await controller.sendMessage(mockReq as Request, mockRes as Response);

      expect(resStatus).toBe(400);
      expect(resJson.error).toContain('obrigatórios');
    });

    it('deve responder 200 com sucesso no envio', async () => {
      mockReq.body = { number: '5511999998888', text: 'Olá!' };
      mockWhatsappService.sendMessage.mockResolvedValue({
        success: true,
        messageId: 'msg-1',
      });

      await controller.sendMessage(mockReq as Request, mockRes as Response);

      expect(resStatus).toBe(200);
      expect(resJson.success).toBe(true);
    });
  });

  describe('triggerBatch', () => {
    it('deve responder 200 com o resumo de jobs agendados e ignorados', async () => {
      mockReq.body = { force: true };
      mockSchedulerService.scheduleBatchForTenant.mockResolvedValue({
        scheduledCount: 5,
        skippedCount: 1,
        enqueuedJobs: [],
      });

      await controller.triggerBatch(mockReq as Request, mockRes as Response);

      expect(resStatus).toBe(200);
      expect(resJson.scheduledCount).toBe(5);
      expect(mockSchedulerService.scheduleBatchForTenant).toHaveBeenCalledWith(tenantId, { force: true });
    });
  });

  describe('getSettings e updateSettings', () => {
    it('deve responder 200 ao buscar settings', async () => {
      mockWhatsappService.getSettings.mockResolvedValue({ confirmation_hour: 9 });

      await controller.getSettings(mockReq as Request, mockRes as Response);

      expect(resStatus).toBe(200);
      expect(resJson.confirmation_hour).toBe(9);
    });

    it('deve responder 200 ao atualizar settings', async () => {
      mockReq.body = { confirmation_hour: 8 };
      mockWhatsappService.updateSettings.mockResolvedValue({ confirmation_hour: 8 });

      await controller.updateSettings(mockReq as Request, mockRes as Response);

      expect(resStatus).toBe(200);
      expect(resJson.confirmation_hour).toBe(8);
    });
  });
});
