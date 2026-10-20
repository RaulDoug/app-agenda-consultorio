import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { ProcedureController } from '../procedure-controller.js';
import { ProcedureService } from '../../services/procedure-service.js';

describe('ProcedureController — Tratamento HTTP e Códigos de Status', () => {
  let controller: ProcedureController;
  let mockService: ProcedureService;
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
      createProcedure: vi.fn(),
      getProcedureById: vi.fn(),
      listProcedures: vi.fn(),
      updateProcedure: vi.fn(),
      deleteProcedure: vi.fn(),
    } as unknown as ProcedureService;

    controller = new ProcedureController(mockService);
  });

  describe('create', () => {
    it('deve responder 201 ao cadastrar procedimento com sucesso', async () => {
      req = {
        tenantId: 'tenant-1',
        body: {
          name: 'Profilaxia',
          default_duration_minutes: 30,
          default_price_cents: 15000,
          cost_cents: 2000,
        },
      };
      (mockService.createProcedure as any).mockResolvedValue({ id: 'proc-1', name: 'Profilaxia' });

      await controller.create(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ id: 'proc-1', name: 'Profilaxia' });
    });

    it('deve responder 400 em caso de erro de validação do service', async () => {
      req = { tenantId: 'tenant-1', body: {} };
      const err: any = new Error('Duração do procedimento deve ser maior que zero.');
      err.statusCode = 400;
      (mockService.createProcedure as any).mockRejectedValue(err);

      await controller.create(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Duração do procedimento deve ser maior que zero.' });
    });
  });

  describe('getById', () => {
    it('deve responder 404 quando o procedimento não for encontrado', async () => {
      req = { tenantId: 'tenant-1', params: { id: 'nao-existe' } };
      (mockService.getProcedureById as any).mockResolvedValue(null);

      await controller.getById(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Procedimento não encontrado.' });
    });
  });

  describe('delete', () => {
    it('deve responder 200 ao desativar procedimento com sucesso', async () => {
      req = { tenantId: 'tenant-1', params: { id: 'proc-1' } };
      (mockService.deleteProcedure as any).mockResolvedValue(true);

      await controller.delete(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Procedimento desativado com sucesso (Soft Delete).' });
    });
  });
});
