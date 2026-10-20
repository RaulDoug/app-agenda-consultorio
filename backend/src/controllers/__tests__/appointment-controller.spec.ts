import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { AppointmentController } from '../appointment-controller.js';
import { AppointmentService, AppointmentConflictError } from '../../services/appointment-service.js';

describe('AppointmentController — Tratamento HTTP e Códigos Estruturados de Conflito 409', () => {
  let controller: AppointmentController;
  let mockService: AppointmentService;
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
      listAppointments: vi.fn(),
      getAppointmentById: vi.fn(),
      createAppointment: vi.fn(),
      updateAppointment: vi.fn(),
      deleteAppointment: vi.fn(),
    } as unknown as AppointmentService;

    controller = new AppointmentController(mockService);
  });

  describe('create', () => {
    it('deve responder 201 ao cadastrar agendamento com sucesso', async () => {
      req = {
        tenantId: 'tenant-1',
        body: {
          patient_id: 'p-1',
          start_time: '2026-11-20T10:00:00.000Z',
          procedure_ids: ['proc-1'],
        },
      };
      (mockService.createAppointment as any).mockResolvedValue({ id: 'app-1' });

      await controller.create(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ id: 'app-1' });
    });

    it('D-01: deve responder 409 estruturado com block_title quando houver conflito com bloqueio', async () => {
      req = {
        tenantId: 'tenant-1',
        body: {
          patient_id: 'p-1',
          start_time: '2026-11-20T14:00:00.000Z',
          procedure_ids: ['proc-1'],
        },
      };
      (mockService.createAppointment as any).mockRejectedValue(
        new AppointmentConflictError('SCHEDULE_BLOCK', 'Conflito com bloqueio', 'Reunião de Equipe')
      );

      await controller.create(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Conflito com bloqueio',
        code: 'SCHEDULE_BLOCK',
        block_title: 'Reunião de Equipe',
      });
    });

    it('deve responder 400 em caso de dados inválidos', async () => {
      req = { tenantId: 'tenant-1', body: {} };
      const err: any = new Error('patient_id é obrigatório.');
      err.statusCode = 400;
      (mockService.createAppointment as any).mockRejectedValue(err);

      await controller.create(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'patient_id é obrigatório.' });
    });
  });

  describe('delete', () => {
    it('deve responder 200 ao excluir com estorno financeiro automático', async () => {
      req = { tenantId: 'tenant-1', params: { id: 'app-1' } };
      (mockService.deleteAppointment as any).mockResolvedValue(true);

      await controller.delete(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Soft Delete com estorno financeiro'),
        })
      );
    });
  });
});
