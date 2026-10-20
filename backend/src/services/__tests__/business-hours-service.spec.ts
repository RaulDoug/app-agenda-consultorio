import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BusinessHoursService } from '../business-hours-service.js';
import { BusinessHoursRepository } from '../../repositories/business-hours-repository.js';

describe('BusinessHoursService — Validações de Consistência e Disponibilidade de Expediente', () => {
  let service: BusinessHoursService;
  let mockRepo: BusinessHoursRepository;

  beforeEach(() => {
    mockRepo = {
      findByTenant: vi.fn(),
      findByDay: vi.fn(),
      upsertDay: vi.fn(),
      upsertBatch: vi.fn(),
      ensureDefaultHours: vi.fn(),
    } as unknown as BusinessHoursRepository;

    service = new BusinessHoursService(mockRepo);
  });

  describe('updateBusinessHours', () => {
    it('deve rejeitar day_of_week fora do intervalo 0 a 6', async () => {
      await expect(service.updateBusinessHours('tenant-1', {
        day_of_week: 7,
        is_open: true,
      })).rejects.toThrow('day_of_week deve estar entre 0 (Domingo) e 6 (Sábado).');
    });

    it('deve rejeitar horário de término anterior ou igual ao início', async () => {
      await expect(service.updateBusinessHours('tenant-1', {
        day_of_week: 1,
        is_open: true,
        start_time: '18:00',
        end_time: '08:00',
      })).rejects.toThrow('O horário de término deve ser posterior ao horário de início.');
    });

    it('deve rejeitar intervalo de almoço com término anterior ao início', async () => {
      await expect(service.updateBusinessHours('tenant-1', {
        day_of_week: 1,
        is_open: true,
        start_time: '08:00',
        end_time: '18:00',
        break_start_time: '14:00',
        break_end_time: '13:00',
      })).rejects.toThrow('O término do intervalo de almoço deve ser posterior ao início.');
    });

    it('deve rejeitar intervalo de almoço que extrapola o horário de expediente', async () => {
      await expect(service.updateBusinessHours('tenant-1', {
        day_of_week: 1,
        is_open: true,
        start_time: '08:00',
        end_time: '18:00',
        break_start_time: '07:30',
        break_end_time: '13:00',
      })).rejects.toThrow('O intervalo de almoço deve estar contido dentro do horário de expediente.');
    });

    it('deve delegar upsertBatch quando os horários forem consistentes', async () => {
      (mockRepo.upsertBatch as any).mockResolvedValue([{ day_of_week: 1, is_open: true }]);

      const res = await service.updateBusinessHours('tenant-1', [
        {
          day_of_week: 1,
          is_open: true,
          start_time: '08:00',
          end_time: '18:00',
          break_start_time: '12:00',
          break_end_time: '13:30',
        },
      ]);

      expect(mockRepo.upsertBatch).toHaveBeenCalled();
      expect(res).toBeDefined();
    });
  });

  describe('checkSlotAvailability', () => {
    it('deve apontar indisponibilidade quando o consultório estiver fechado no dia', async () => {
      (mockRepo.findByDay as any).mockResolvedValue({
        day_of_week: 0,
        is_open: false,
      });

      // Domingo
      const start = new Date('2026-10-25T10:00:00.000Z');
      const end = new Date('2026-10-25T11:00:00.000Z');

      const check = await service.checkSlotAvailability('tenant-1', start, end);
      expect(check.available).toBe(false);
      expect(check.conflictType).toBe('OUTSIDE_HOURS');
    });

    it('deve apontar indisponibilidade quando colidir com intervalo de almoço', async () => {
      (mockRepo.findByDay as any).mockResolvedValue({
        day_of_week: 1,
        is_open: true,
        start_time: '08:00',
        end_time: '18:00',
        break_start_time: '12:00',
        break_end_time: '13:30',
      });

      // Segunda 12:30 às 13:00 (dentro do almoço)
      const start = new Date('2026-10-26T12:30:00.000Z');
      const end = new Date('2026-10-26T13:00:00.000Z');

      const check = await service.checkSlotAvailability('tenant-1', start, end);
      expect(check.available).toBe(false);
      expect(check.conflictType).toBe('BREAK_TIME');
      expect(check.message).toContain('intervalo de almoço');
    });

    it('deve retornar disponível para horário regular de expediente', async () => {
      (mockRepo.findByDay as any).mockResolvedValue({
        day_of_week: 1,
        is_open: true,
        start_time: '08:00',
        end_time: '18:00',
        break_start_time: '12:00',
        break_end_time: '13:30',
      });

      // Segunda 14:00 às 15:00
      const start = new Date('2026-10-26T14:00:00.000Z');
      const end = new Date('2026-10-26T15:00:00.000Z');

      const check = await service.checkSlotAvailability('tenant-1', start, end);
      expect(check.available).toBe(true);
    });
  });
});
