import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { PatientController } from '../patient-controller.js';
import { PatientService } from '../../services/patient-service.js';

describe('PatientController — Tratamento HTTP e Códigos de Status', () => {
  let controller: PatientController;
  let mockService: PatientService;
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
      createPatient: vi.fn(),
      getPatientById: vi.fn(),
      listPatients: vi.fn(),
      updatePatient: vi.fn(),
      deletePatient: vi.fn(),
    } as unknown as PatientService;

    controller = new PatientController(mockService);
  });

  describe('list', () => {
    it('deve responder 200 com a lista de pacientes', async () => {
      req = { tenantId: 'tenant-1', query: { search: 'Ana' } };
      (mockService.listPatients as any).mockResolvedValue([{ id: 'p-1', name: 'Ana' }]);

      await controller.list(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([{ id: 'p-1', name: 'Ana' }]);
    });
  });

  describe('create', () => {
    it('deve responder 201 ao criar paciente com sucesso', async () => {
      req = {
        tenantId: 'tenant-1',
        body: { name: 'João', whatsapp: '11999998888' },
      };
      (mockService.createPatient as any).mockResolvedValue({ id: 'p-1', name: 'João' });

      await controller.create(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ id: 'p-1', name: 'João' });
    });

    it('deve responder 400 em caso de erro de validação do service', async () => {
      req = { tenantId: 'tenant-1', body: {} };
      const err: any = new Error('Nome do paciente é obrigatório.');
      err.statusCode = 400;
      (mockService.createPatient as any).mockRejectedValue(err);

      await controller.create(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Nome do paciente é obrigatório.' });
    });
  });

  describe('getById', () => {
    it('deve responder 404 quando o paciente não existir', async () => {
      req = { tenantId: 'tenant-1', params: { id: 'nao-existe' } };
      (mockService.getPatientById as any).mockResolvedValue(null);

      await controller.getById(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Paciente não encontrado.' });
    });
  });

  describe('delete', () => {
    it('deve responder 200 com mensagem ao desativar', async () => {
      req = { tenantId: 'tenant-1', params: { id: 'p-1' } };
      (mockService.deletePatient as any).mockResolvedValue(true);

      await controller.delete(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Paciente desativado com sucesso (Soft Delete).' });
    });
  });
});
