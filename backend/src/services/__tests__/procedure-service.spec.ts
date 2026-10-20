import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcedureService } from '../procedure-service.js';
import { ProcedureRepository } from '../../repositories/procedure-repository.js';

describe('ProcedureService — Regras de Negócio de Procedimentos', () => {
  let service: ProcedureService;
  let mockRepo: ProcedureRepository;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    } as unknown as ProcedureRepository;

    service = new ProcedureService(mockRepo);
  });

  describe('createProcedure', () => {
    it('deve cadastrar procedimento com preço, custo e duração válidos', async () => {
      const mockResult: any = {
        id: 'proc-1',
        tenant_id: 'tenant-1',
        name: 'Clareamento Dental',
        default_duration_minutes: 60,
        default_price_cents: 50000,
        cost_cents: 8000,
        is_active: true,
      };
      (mockRepo.create as any).mockResolvedValue(mockResult);

      const res = await service.createProcedure('tenant-1', {
        name: '  Clareamento Dental  ',
        default_duration_minutes: 60,
        default_price_cents: 50000,
        cost_cents: 8000,
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        'tenant-1',
        {
          name: 'Clareamento Dental',
          default_duration_minutes: 60,
          default_price_cents: 50000,
          cost_cents: 8000,
        },
        undefined
      );
      expect(res).toEqual(mockResult);
    });

    it('deve rejeitar cadastro sem nome ou com nome vazio', async () => {
      await expect(service.createProcedure('tenant-1', {
        name: '   ',
        default_duration_minutes: 30,
        default_price_cents: 10000,
      })).rejects.toThrow('Nome do procedimento é obrigatório.');
    });

    it('deve rejeitar cadastro com duração menor ou igual a zero', async () => {
      await expect(service.createProcedure('tenant-1', {
        name: 'Consulta',
        default_duration_minutes: 0,
        default_price_cents: 10000,
      })).rejects.toThrow('Duração do procedimento deve ser maior que zero.');
    });

    it('deve rejeitar cadastro com preço negativo', async () => {
      await expect(service.createProcedure('tenant-1', {
        name: 'Consulta',
        default_duration_minutes: 30,
        default_price_cents: -50,
      })).rejects.toThrow('Preço do procedimento não pode ser negativo.');
    });

    it('deve rejeitar cadastro com custo negativo', async () => {
      await expect(service.createProcedure('tenant-1', {
        name: 'Consulta',
        default_duration_minutes: 30,
        default_price_cents: 10000,
        cost_cents: -100,
      })).rejects.toThrow('Custo do procedimento não pode ser negativo.');
    });
  });

  describe('updateProcedure', () => {
    it('deve rejeitar atualização com duração inválida', async () => {
      await expect(service.updateProcedure('tenant-1', 'proc-1', {
        default_duration_minutes: -10,
      })).rejects.toThrow('Duração do procedimento deve ser maior que zero.');
    });

    it('deve rejeitar atualização com custo negativo', async () => {
      await expect(service.updateProcedure('tenant-1', 'proc-1', {
        cost_cents: -500,
      })).rejects.toThrow('Custo do procedimento não pode ser negativo.');
    });

    it('deve delegar atualização sanitizada ao repositório', async () => {
      (mockRepo.update as any).mockResolvedValue({ id: 'proc-1', cost_cents: 2500 });

      const res = await service.updateProcedure('tenant-1', 'proc-1', {
        cost_cents: 2500,
      });

      expect(mockRepo.update).toHaveBeenCalledWith('tenant-1', 'proc-1', {
        cost_cents: 2500,
      });
      expect(res).toBeDefined();
    });
  });
});
