import type {
  Appointment,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
} from '@cliniassist/shared';
import { calculateDiscountDistribution, type ProcedurePricingItem } from '@cliniassist/shared';
import {
  AppointmentRepository,
  type PreparedAppointmentItem,
} from '../repositories/appointment-repository.js';
import { BusinessHoursService } from './business-hours-service.js';
import { ScheduleBlockService } from './schedule-block-service.js';
import { ProcedureRepository } from '../repositories/procedure-repository.js';

export class AppointmentConflictError extends Error {
  readonly statusCode = 409;
  constructor(
    public readonly code: 'SCHEDULE_BLOCK' | 'DOUBLE_BOOKING' | 'BREAK_TIME' | 'OUTSIDE_HOURS',
    message: string,
    public readonly blockTitle?: string
  ) {
    super(message);
    this.name = 'AppointmentConflictError';
  }
}

export class AppointmentService {
  constructor(
    private appointmentRepo: AppointmentRepository = new AppointmentRepository(),
    private businessHoursService: BusinessHoursService = new BusinessHoursService(),
    private scheduleBlockService: ScheduleBlockService = new ScheduleBlockService(),
    private procedureRepo: ProcedureRepository = new ProcedureRepository()
  ) {}

  async createAppointment(
    tenantId: string,
    data: CreateAppointmentDTO,
    customId?: string
  ): Promise<Appointment> {
    if (!tenantId) {
      throw new Error('Tenant ID é obrigatório.');
    }

    if (!data.patient_id) {
      const error: any = new Error('patient_id é obrigatório.');
      error.statusCode = 400;
      throw error;
    }

    if (!data.start_time) {
      const error: any = new Error('start_time é obrigatório.');
      error.statusCode = 400;
      throw error;
    }

    if (!data.procedure_ids || !Array.isArray(data.procedure_ids) || data.procedure_ids.length === 0) {
      const error: any = new Error('Pelo menos um procedimento é obrigatório para o agendamento.');
      error.statusCode = 400;
      throw error;
    }

    const startDate = new Date(data.start_time);
    if (isNaN(startDate.getTime())) {
      const error: any = new Error('Data de início do agendamento é inválida.');
      error.statusCode = 400;
      throw error;
    }

    // 1. Busca procedimentos para obter duração e preços
    const procedures = await Promise.all(
      data.procedure_ids.map(async (pid) => {
        const proc = await this.procedureRepo.findById(tenantId, pid);
        if (!proc) {
          const error: any = new Error(`Procedimento ${pid} não encontrado ou inativo.`);
          error.statusCode = 400;
          throw error;
        }
        return proc;
      })
    );

    // 2. Calcula duração total e data/hora de término
    const totalDurationMinutes = procedures.reduce(
      (sum, p) => sum + Number(p.default_duration_minutes || 30),
      0
    );
    const endDate = new Date(startDate.getTime() + totalDurationMinutes * 60 * 1000);
    const startTimeIso = startDate.toISOString();
    const endTimeIso = endDate.toISOString();

    // 3. Validação Tripla de Conflitos quando não for Encaixe (confirm_overtime: false)
    if (!data.confirm_overtime) {
      // 3.1 Conflito com Bloqueios de Agenda (retorna título do bloqueio)
      const blockConflict = await this.scheduleBlockService.checkBlockConflict(
        tenantId,
        startTimeIso,
        endTimeIso
      );
      if (blockConflict.hasConflict) {
        throw new AppointmentConflictError(
          'SCHEDULE_BLOCK',
          `Horário indisponível devido ao bloqueio de agenda: '${blockConflict.blockTitle}'. Marque a opção de encaixe para forçar o agendamento.`,
          blockConflict.blockTitle
        );
      }

      // 3.2 Conflito com Horário de Expediente ou Almoço
      const hoursCheck = await this.businessHoursService.checkSlotAvailability(
        tenantId,
        startDate,
        endDate
      );
      if (!hoursCheck.available) {
        throw new AppointmentConflictError(
          hoursCheck.conflictType || 'OUTSIDE_HOURS',
          `${hoursCheck.message} Marque a opção de encaixe para forçar o agendamento.`
        );
      }

      // 3.3 Conflito com Outro Paciente Agendado (Double Booking)
      const overlappingAppointments = await this.appointmentRepo.findConflictingAppointments(
        tenantId,
        startTimeIso,
        endTimeIso
      );
      if (overlappingAppointments.length > 0) {
        throw new AppointmentConflictError(
          'DOUBLE_BOOKING',
          'Já existe um paciente agendado neste intervalo de horário (Double Booking). Marque a opção de encaixe para forçar o agendamento.'
        );
      }
    }

    // 4. Rateio e Descontos (R$ ou %, inclusive valor zerado)
    const pricingItems: ProcedurePricingItem[] = procedures.map((p) => ({
      procedureId: p.id,
      priceCents: Number(p.default_price_cents || 0),
    }));

    let discountParam: any = 0;
    if (data.discount) {
      if (data.discount.type === 'PERCENTAGE') {
        discountParam = { discountPercent: data.discount.value };
      } else if (data.discount.type === 'FIXED') {
        discountParam = { discountCents: data.discount.value };
      }
    }

    const distribution = calculateDiscountDistribution(pricingItems, discountParam);

    const preparedItems: PreparedAppointmentItem[] = distribution.items.map((it, idx) => {
      const originalProc = procedures[idx];
      return {
        procedure_id: it.procedureId,
        effective_price_cents: it.effectivePriceCents,
        cost_cents: Number(originalProc.cost_cents || 0),
        duration_minutes: Number(originalProc.default_duration_minutes || 30),
      };
    });

    return this.appointmentRepo.createWithItems(
      tenantId,
      data,
      customId,
      preparedItems,
      distribution.totalEffectiveCents
    );
  }

  async getAppointmentById(tenantId: string, id: string): Promise<Appointment | null> {
    if (!tenantId || !id) {
      const error: any = new Error('Identificadores inválidos.');
      error.statusCode = 400;
      throw error;
    }
    return this.appointmentRepo.findById(tenantId, id);
  }

  async listAppointments(
    tenantId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      patientId?: string;
      status?: string;
    }
  ): Promise<Appointment[]> {
    if (!tenantId) {
      throw new Error('Tenant ID é obrigatório.');
    }
    return this.appointmentRepo.findAll(tenantId, options);
  }

  async updateAppointment(
    tenantId: string,
    id: string,
    data: UpdateAppointmentDTO
  ): Promise<Appointment | null> {
    if (!tenantId || !id) {
      const error: any = new Error('Identificadores inválidos.');
      error.statusCode = 400;
      throw error;
    }

    const existing = await this.appointmentRepo.findById(tenantId, id);
    if (!existing) {
      return null;
    }

    // Regra D-09: Se o status está sendo alterado para CANCELLED, dispara cancelamento com estorno
    if (data.status === 'CANCELLED') {
      await this.appointmentRepo.cancelOrDeleteWithFinancialReversal(tenantId, id, false);
      return this.appointmentRepo.findById(tenantId, id);
    }

    let effectiveStartTime = existing.start_time;
    let effectiveEndTime = existing.end_time;
    let procedures = existing.items || [];
    let preparedItems: PreparedAppointmentItem[] | undefined;
    let computedTotal: number | undefined;

    // Se houve alteração de procedimentos
    if (data.procedure_ids && Array.isArray(data.procedure_ids) && data.procedure_ids.length > 0) {
      const fetchedProcs = await Promise.all(
        data.procedure_ids.map(async (pid) => {
          const proc = await this.procedureRepo.findById(tenantId, pid);
          if (!proc) {
            const error: any = new Error(`Procedimento ${pid} não encontrado.`);
            error.statusCode = 400;
            throw error;
          }
          return proc;
        })
      );

      const totalDurationMinutes = fetchedProcs.reduce(
        (sum, p) => sum + Number(p.default_duration_minutes || 30),
        0
      );

      const start = new Date(data.start_time || effectiveStartTime);
      const end = new Date(start.getTime() + totalDurationMinutes * 60000);
      effectiveStartTime = start.toISOString();
      effectiveEndTime = end.toISOString();

      const pricingItems: ProcedurePricingItem[] = fetchedProcs.map((p) => ({
        procedureId: p.id,
        priceCents: Number(p.default_price_cents || 0),
      }));

      let discountParam: any = 0;
      if (data.discount) {
        if (data.discount.type === 'PERCENTAGE') {
          discountParam = { discountPercent: data.discount.value };
        } else if (data.discount.type === 'FIXED') {
          discountParam = { discountCents: data.discount.value };
        }
      }

      const distribution = calculateDiscountDistribution(pricingItems, discountParam);
      computedTotal = distribution.totalEffectiveCents;

      preparedItems = distribution.items.map((it, idx) => ({
        procedure_id: it.procedureId,
        effective_price_cents: it.effectivePriceCents,
        cost_cents: Number(fetchedProcs[idx].cost_cents || 0),
        duration_minutes: Number(fetchedProcs[idx].default_duration_minutes || 30),
      }));
    } else if (data.start_time) {
      const start = new Date(data.start_time);
      const currentStart = new Date(existing.start_time);
      const currentEnd = new Date(existing.end_time);
      const durationMs = currentEnd.getTime() - currentStart.getTime();
      const end = new Date(start.getTime() + durationMs);

      effectiveStartTime = start.toISOString();
      effectiveEndTime = end.toISOString();
    }

    // Se houve alteração de horário e confirm_overtime não for true, valida conflitos
    if ((data.start_time || data.procedure_ids) && !data.confirm_overtime) {
      const blockConflict = await this.scheduleBlockService.checkBlockConflict(
        tenantId,
        effectiveStartTime,
        effectiveEndTime
      );
      if (blockConflict.hasConflict) {
        throw new AppointmentConflictError(
          'SCHEDULE_BLOCK',
          `Horário indisponível devido ao bloqueio de agenda: '${blockConflict.blockTitle}'. Marque a opção de encaixe para forçar o agendamento.`,
          blockConflict.blockTitle
        );
      }

      const hoursCheck = await this.businessHoursService.checkSlotAvailability(
        tenantId,
        new Date(effectiveStartTime),
        new Date(effectiveEndTime)
      );
      if (!hoursCheck.available) {
        throw new AppointmentConflictError(
          hoursCheck.conflictType || 'OUTSIDE_HOURS',
          `${hoursCheck.message} Marque a opção de encaixe para forçar o agendamento.`
        );
      }

      const overlapping = await this.appointmentRepo.findConflictingAppointments(
        tenantId,
        effectiveStartTime,
        effectiveEndTime,
        id
      );
      if (overlapping.length > 0) {
        throw new AppointmentConflictError(
          'DOUBLE_BOOKING',
          'Já existe um paciente agendado neste intervalo de horário (Double Booking). Marque a opção de encaixe para forçar o agendamento.'
        );
      }
    }

    const payload: UpdateAppointmentDTO = {
      ...data,
      total_charged_cents: computedTotal !== undefined ? computedTotal : data.total_charged_cents,
    };

    return this.appointmentRepo.updateWithItems(
      tenantId,
      id,
      payload,
      preparedItems,
      effectiveEndTime
    );
  }

  async deleteAppointment(tenantId: string, id: string): Promise<boolean> {
    if (!tenantId || !id) {
      const error: any = new Error('Identificadores inválidos.');
      error.statusCode = 400;
      throw error;
    }
    // Regra D-09: Exclusão com estorno automático de transações financeiras
    return this.appointmentRepo.cancelOrDeleteWithFinancialReversal(tenantId, id, true);
  }
}
