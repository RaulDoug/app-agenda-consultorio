import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebhookController } from '../webhook-controller.js';
import type { Request, Response } from 'express';

describe('WebhookController — Processamento HTTP de Webhooks', () => {
  let controller: WebhookController;
  let mockWebhookService: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let resStatus: number;
  let resJson: any;

  beforeEach(() => {
    resStatus = 200;
    resJson = null;

    mockReq = {
      body: {},
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

    mockWebhookService = {
      handleWebhook: vi.fn(),
    };

    controller = new WebhookController(mockWebhookService);
  });

  it('deve repassar payload para o WebhookService e responder status code correspondente', async () => {
    mockReq.body = { event: 'messages.upsert' };
    mockReq.params = { event: 'messages-upsert' };

    mockWebhookService.handleWebhook.mockResolvedValue({
      status: 'processed',
      statusCode: 200,
      data: { new_status: 'CONFIRMED' },
    });

    await controller.handleWebhook(mockReq as Request, mockRes as Response);

    expect(resStatus).toBe(200);
    expect(resJson.status).toBe('processed');
    expect(resJson.new_status).toBe('CONFIRMED');
    expect(mockWebhookService.handleWebhook).toHaveBeenCalledWith(mockReq.body, 'messages-upsert');
  });

  it('deve responder 500 em caso de erro inesperado no processamento', async () => {
    mockWebhookService.handleWebhook.mockRejectedValue(new Error('Erro crítico'));

    await controller.handleWebhook(mockReq as Request, mockRes as Response);

    expect(resStatus).toBe(500);
    expect(resJson.error).toBe('Erro crítico');
  });
});
