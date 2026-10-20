import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { BusinessHoursController } from '../business-hours-controller.js';
import { BusinessHoursService } from '../../services/business-hours-service.js';

describe('BusinessHoursController — Tratamento HTTP e Códigos de Status', () => {
  let controller: BusinessHoursController;
  let mockService: BusinessHoursService;
  let req: Partial<Request>;
  let res: any;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    res = {
      status: statusMock,
      json: jsonMock,
    };

    mockService = {
      listBusinessHours: vi.fn(),
      updateBusinessHours: vi.fn(),
    } as unknown as BusinessHoursService;

    controller = new BusinessHoursController(mockService);
  });

  describe('list', () => {
    it('deve responder 200 com os horários de atendimento do tenant', async () => {
      req = { tenantId: 'tenant-1' };
      (mockService.listBusinessHours as any).mockResolvedValue([{ day_of_week: 1, is_open: true }]);

      await controller.list(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([{ day_of_week: 1, is_open: true }]);
    });
  });

  describe('update', () => {
    it('deve responder 200 ao atualizar expediente com sucesso', async () => {
      req = {
        tenantId: 'tenant-1',
        body: [{ day_of_week: 1, is_open: true, start_time: '08:00', end_time: '18:00' }],
      };
      (mockService.updateBusinessHours as any).mockResolvedValue([{ day_of_week: 1, is_open: true }]);

      await controller.update(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([{ day_of_week: 1, is_open: true }]);
    });

    it('deve responder 400 em caso de erro de validação de horário', async () => {
      req = { tenantId: 'tenant-1', body: [] };
      const err: any = new Error('Nenhum horário fornecido.');
      err.statusCode = 400;
      (mockService.updateBusinessHours as any).mockRejectedValue(err);

      await controller.update(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Nenhum horário fornecido.' });
    });
  });
});
