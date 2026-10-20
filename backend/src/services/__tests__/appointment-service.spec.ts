import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentService, AppointmentConflictError } from '../appointment-service.js';
import { AppointmentRepository } from '../../repositories/appointment-repository.js';
import { BusinessHoursService } from '../business-hours-service.js';
import { ScheduleBlockService } from '../schedule-block-service.js';
import { ProcedureRepository } from '../../repositories/procedure-repository.js';

describe('AppointmentService — Validação Tripla de Conflitos, Encaixes e Descontos', () => {
  let service: AppointmentService;
  let mockAppRepo: AppointmentRepository;
  let mockHoursService: BusinessHoursService;
  let mockBlockService: ScheduleBlockService;
  let mockProcedureRepo: ProcedureRepository;

  beforeEach(() => {
    mockAppRepo = {
      createWithItems: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      updateWithItems: vi.fn(),
      findConflictingAppointments: vi.fn().mockResolvedValue([]),
      cancelOrDeleteWithFinancialReversal: vi.fn().mockResolvedValue(true),
      softDelete: vi.fn().mockResolvedValue(true),
    } as unknown as AppointmentRepository;

    mockHoursService = {
      checkSlotAvailability: vi.fn().mockResolvedValue({ available: true }),
    } as unknown as BusinessHoursService;

    mockBlockService = {
      checkBlockConflict: vi.fn().mockResolvedValue({ hasConflict: false }),
    } as unknown as ScheduleBlockService;

    mockProcedureRepo = {
      findById: vi.fn().mockResolvedValue({
        id: 'proc-1',
        name: 'Profilaxia',
        default_duration_minutes: 30,
        default_price_cents: 10000,
        cost_cents: 2000,
      }),
    } as unknown as ProcedureRepository;

    service = new AppointmentService(
      mockAppRepo,
      mockHoursService,
      mockBlockService,
      mockProcedureRepo
    );
  });

  describe('Validação Tripla de Conflitos (quando confirm_overtime = false)', () => {
    it('deve lançar AppointmentConflictError com SCHEDULE_BLOCK e o título do bloqueio', async () => {
      (mockBlockService.checkBlockConflict as any).mockResolvedValue({
        hasConflict: true,
        blockTitle: 'Reunião de Equipe',
      });

      await expect(
        service.createAppointment('tenant-1', {
          patient_id: 'p-1',
          start_time: '2026-11-20T14:00:00.000Z',
          procedure_ids: ['proc-1'],
          confirm_overtime: false,
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'SCHEDULE_BLOCK',
        blockTitle: 'Reunião de Equipe',
        message: expect.stringContaining('Reunião de Equipe'),
      });
    });

    it('deve lançar AppointmentConflictError quando horário colidir com expediente ou almoço', async () => {
      (mockHoursService.checkSlotAvailability as any).mockResolvedValue({
        available: false,
        conflictType: 'BREAK_TIME',
        message: 'Horário conflitante com o intervalo de almoço do consultório.',
      });

      await expect(
        service.createAppointment('tenant-1', {
          patient_id: 'p-1',
          start_time: '2026-11-20T12:30:00.000Z',
          procedure_ids: ['proc-1'],
          confirm_overtime: false,
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'BREAK_TIME',
      });
    });

    it('deve lançar AppointmentConflictError com DOUBLE_BOOKING quando houver outro paciente no horário', async () => {
      (mockAppRepo.findConflictingAppointments as any).mockResolvedValue([{ id: 'existing-app' }]);

      await expect(
        service.createAppointment('tenant-1', {
          patient_id: 'p-1',
          start_time: '2026-11-20T10:00:00.000Z',
          procedure_ids: ['proc-1'],
          confirm_overtime: false,
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'DOUBLE_BOOKING',
      });
    });

    it('deve PERMITIR agendamento em horário bloqueado/ocupado se confirm_overtime = true (Encaixe)', async () => {
      // Bloqueio existente
      (mockBlockService.checkBlockConflict as any).mockResolvedValue({
        hasConflict: true,
        blockTitle: 'Bloqueio Ativo',
      });
      (mockAppRepo.createWithItems as any).mockResolvedValue({
        id: 'new-overtime-app',
        is_overtime: true,
      });

      const res = await service.createAppointment('tenant-1', {
        patient_id: 'p-1',
        start_time: '2026-11-20T14:00:00.000Z',
        procedure_ids: ['proc-1'],
        confirm_overtime: true,
      });

      expect(mockAppRepo.createWithItems).toHaveBeenCalled();
      expect(res.id).toBe('new-overtime-app');
    });
  });

  describe('Cálculo de Descontos e Valores', () => {
    it('deve aplicar desconto percentual e ratear proporcionalmente entre itens', async () => {
      (mockAppRepo.createWithItems as any).mockImplementation((_t: any, _d: any, _c: any, items: any, total: any) => ({
        id: 'app-disc',
        items,
        total_charged_cents: total,
      }));

      const res = await service.createAppointment('tenant-1', {
        patient_id: 'p-1',
        start_time: '2026-11-20T10:00:00.000Z',
        procedure_ids: ['proc-1'],
        discount: { type: 'PERCENTAGE', value: 20 }, // 20% de desconto sobre 10000 = 8000
      });

      expect(res.total_charged_cents).toBe(8000);
      expect(res.items?.[0].effective_price_cents).toBe(8000);
    });

    it('deve permitir agendamento com desconto total de 100% ou fixo zerado (R$ 0,00)', async () => {
      (mockAppRepo.createWithItems as any).mockImplementation((_t: any, _d: any, _c: any, items: any, total: any) => ({
        id: 'app-zero',
        items,
        total_charged_cents: total,
      }));

      const res = await service.createAppointment('tenant-1', {
        patient_id: 'p-1',
        start_time: '2026-11-20T10:00:00.000Z',
        procedure_ids: ['proc-1'],
        discount: { type: 'FIXED', value: 10000 }, // Desconto de 100%
      });

      expect(res.total_charged_cents).toBe(0);
      expect(res.items?.[0].effective_price_cents).toBe(0);
    });
  });

  describe('Cancelamento e Exclusão com Estorno (D-09)', () => {
    it('deve chamar cancelOrDeleteWithFinancialReversal ao cancelar agendamento', async () => {
      (mockAppRepo.findById as any).mockResolvedValue({ id: 'app-1', status: 'PENDING' });

      await service.updateAppointment('tenant-1', 'app-1', { status: 'CANCELLED' });

      expect(mockAppRepo.cancelOrDeleteWithFinancialReversal).toHaveBeenCalledWith('tenant-1', 'app-1', false);
    });

    it('deve chamar cancelOrDeleteWithFinancialReversal ao deletar agendamento', async () => {
      await service.deleteAppointment('tenant-1', 'app-1');

      expect(mockAppRepo.cancelOrDeleteWithFinancialReversal).toHaveBeenCalledWith('tenant-1', 'app-1', true);
    });
  });
});
