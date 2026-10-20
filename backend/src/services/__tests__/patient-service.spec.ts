import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientService } from '../patient-service.js';
import { PatientRepository } from '../../repositories/patient-repository.js';

describe('PatientService — Regras de Negócio de Pacientes', () => {
  let service: PatientService;
  let mockRepo: PatientRepository;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    } as unknown as PatientRepository;

    service = new PatientService(mockRepo);
  });

  describe('createPatient', () => {
    it('deve cadastrar paciente com dados válidos e trim aplicado', async () => {
      const mockResult: any = {
        id: 'patient-123',
        tenant_id: 'tenant-1',
        name: 'Carlos Oliveira',
        whatsapp: '11988887777',
        notes: 'Sem histórico de alergias',
        is_active: true,
      };
      (mockRepo.create as any).mockResolvedValue(mockResult);

      const res = await service.createPatient('tenant-1', {
        name: '  Carlos Oliveira  ',
        whatsapp: '  11988887777  ',
        notes: '  Sem histórico de alergias  ',
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        'tenant-1',
        {
          name: 'Carlos Oliveira',
          whatsapp: '11988887777',
          notes: 'Sem histórico de alergias',
        },
        undefined
      );
      expect(res).toEqual(mockResult);
    });

    it('deve rejeitar cadastro sem nome ou com nome em branco', async () => {
      await expect(service.createPatient('tenant-1', { name: '   ', whatsapp: '11988887777' }))
        .rejects.toThrow('Nome do paciente é obrigatório.');
    });

    it('deve rejeitar cadastro sem whatsapp ou com whatsapp em branco', async () => {
      await expect(service.createPatient('tenant-1', { name: 'Mariana', whatsapp: '   ' }))
        .rejects.toThrow('WhatsApp do paciente é obrigatório.');
    });

    it('deve rejeitar chamada sem tenantId', async () => {
      await expect(service.createPatient('', { name: 'Mariana', whatsapp: '11988887777' }))
        .rejects.toThrow('Tenant ID é obrigatório.');
    });
  });

  describe('updatePatient', () => {
    it('deve rejeitar atualização com nome vazio', async () => {
      await expect(service.updatePatient('tenant-1', 'p-1', { name: '   ' }))
        .rejects.toThrow('Nome do paciente não pode ser vazio.');
    });

    it('deve rejeitar atualização com whatsapp vazio', async () => {
      await expect(service.updatePatient('tenant-1', 'p-1', { whatsapp: '   ' }))
        .rejects.toThrow('WhatsApp do paciente não pode ser vazio.');
    });

    it('deve delegar atualização sanitizada ao repositório', async () => {
      (mockRepo.update as any).mockResolvedValue({ id: 'p-1', name: 'Nome Atualizado' });

      const res = await service.updatePatient('tenant-1', 'p-1', {
        name: '  Nome Atualizado  ',
      });

      expect(mockRepo.update).toHaveBeenCalledWith('tenant-1', 'p-1', {
        name: 'Nome Atualizado',
      });
      expect(res).toBeDefined();
    });
  });

  describe('deletePatient', () => {
    it('deve chamar softDelete com tenantId e id', async () => {
      (mockRepo.softDelete as any).mockResolvedValue(true);

      const res = await service.deletePatient('tenant-1', 'p-1');
      expect(mockRepo.softDelete).toHaveBeenCalledWith('tenant-1', 'p-1');
      expect(res).toBe(true);
    });
  });
});
