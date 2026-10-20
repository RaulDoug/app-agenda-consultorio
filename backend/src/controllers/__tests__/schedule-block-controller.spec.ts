import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { ScheduleBlockController } from '../schedule-block-controller.js';
import { ScheduleBlockService } from '../../services/schedule-block-service.js';

describe('ScheduleBlockController — Tratamento HTTP e Códigos de Status', () => {
  let controller: ScheduleBlockController;
  let mockService: ScheduleBlockService;
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
      listBlocks: vi.fn(),
      getBlockById: vi.fn(),
      createBlock: vi.fn(),
      updateBlock: vi.fn(),
      deleteBlock: vi.fn(),
      checkBlockConflict: vi.fn(),
    } as unknown as ScheduleBlockService;

    controller = new ScheduleBlockController(mockService);
  });

  describe('create', () => {
    it('deve responder 201 ao criar bloqueio de agenda com sucesso', async () => {
      req = {
        tenantId: 'tenant-1',
        body: {
          title: 'Treinamento de Biossegurança',
          start_time: '2026-11-25T08:00:00.000Z',
          end_time: '2026-11-25T11:00:00.000Z',
        },
      };
      (mockService.createBlock as any).mockResolvedValue({
        id: 'block-1',
        title: 'Treinamento de Biossegurança',
      });

      await controller.create(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        id: 'block-1',
        title: 'Treinamento de Biossegurança',
      });
    });

    it('deve responder 400 em caso de erro de validação temporal', async () => {
      req = { tenantId: 'tenant-1', body: {} };
      const err: any = new Error('Título do bloqueio é obrigatório.');
      err.statusCode = 400;
      (mockService.createBlock as any).mockRejectedValue(err);

      await controller.create(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Título do bloqueio é obrigatório.' });
    });
  });

  describe('update', () => {
    it('deve responder 200 ao atualizar bloqueio', async () => {
      req = {
        tenantId: 'tenant-1',
        params: { id: 'block-1' },
        body: { title: 'Novo Título' },
      };
      (mockService.updateBlock as any).mockResolvedValue({ id: 'block-1', title: 'Novo Título' });

      await controller.update(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ id: 'block-1', title: 'Novo Título' });
    });
  });

  describe('delete', () => {
    it('deve responder 200 ao remover bloqueio via soft-delete', async () => {
      req = { tenantId: 'tenant-1', params: { id: 'block-1' } };
      (mockService.deleteBlock as any).mockResolvedValue(true);

      await controller.delete(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Bloqueio removido com sucesso (Soft Delete).' });
    });
  });
});
