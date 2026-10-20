import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScheduleBlockService } from '../schedule-block-service.js';
import { ScheduleBlockRepository } from '../../repositories/schedule-block-repository.js';

describe('ScheduleBlockService — Validações de Bloqueio e Detecção de Conflitos', () => {
  let service: ScheduleBlockService;
  let mockRepo: ScheduleBlockRepository;

  beforeEach(() => {
    mockRepo = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      findOverlapping: vi.fn(),
    } as unknown as ScheduleBlockRepository;

    service = new ScheduleBlockService(mockRepo);
  });

  describe('createBlock', () => {
    it('deve cadastrar bloqueio com datas válidas e término posterior ao início', async () => {
      const mockResult: any = {
        id: 'block-1',
        title: 'Manutenção do Compressor',
        start_time: '2026-11-20T10:00:00.000Z',
        end_time: '2026-11-20T12:00:00.000Z',
      };
      (mockRepo.create as any).mockResolvedValue(mockResult);

      const res = await service.createBlock('tenant-1', {
        title: '  Manutenção do Compressor  ',
        start_time: '2026-11-20T10:00:00.000Z',
        end_time: '2026-11-20T12:00:00.000Z',
      });

      expect(mockRepo.create).toHaveBeenCalled();
      expect(res).toEqual(mockResult);
    });

    it('deve rejeitar criação sem título', async () => {
      await expect(service.createBlock('tenant-1', {
        title: '   ',
        start_time: '2026-11-20T10:00:00.000Z',
        end_time: '2026-11-20T12:00:00.000Z',
      })).rejects.toThrow('Título do bloqueio é obrigatório.');
    });

    it('deve rejeitar término anterior ou igual ao início', async () => {
      await expect(service.createBlock('tenant-1', {
        title: 'Bloqueio',
        start_time: '2026-11-20T14:00:00.000Z',
        end_time: '2026-11-20T13:00:00.000Z',
      })).rejects.toThrow('O término do bloqueio deve ser posterior ao início.');
    });

    it('deve rejeitar datas inválidas', async () => {
      await expect(service.createBlock('tenant-1', {
        title: 'Bloqueio',
        start_time: 'data-invalida',
        end_time: '2026-11-20T13:00:00.000Z',
      })).rejects.toThrow('Datas de início ou término inválidas.');
    });
  });

  describe('checkBlockConflict', () => {
    it('deve retornar conflito e o título do bloqueio quando houver sobreposição', async () => {
      (mockRepo.findOverlapping as any).mockResolvedValue([
        {
          id: 'b-1',
          title: 'Reunião de Alinhamento Geral',
          start_time: '2026-11-20T14:00:00.000Z',
          end_time: '2026-11-20T16:00:00.000Z',
        },
      ]);

      const conflict = await service.checkBlockConflict(
        'tenant-1',
        '2026-11-20T14:30:00.000Z',
        '2026-11-20T15:00:00.000Z'
      );

      expect(conflict.hasConflict).toBe(true);
      expect(conflict.blockTitle).toBe('Reunião de Alinhamento Geral');
      expect(conflict.block).toBeDefined();
    });

    it('deve retornar hasConflict = false quando não houver sobreposição', async () => {
      (mockRepo.findOverlapping as any).mockResolvedValue([]);

      const conflict = await service.checkBlockConflict(
        'tenant-1',
        '2026-11-20T16:00:00.000Z',
        '2026-11-20T17:00:00.000Z'
      );

      expect(conflict.hasConflict).toBe(false);
      expect(conflict.blockTitle).toBeUndefined();
    });
  });
});
