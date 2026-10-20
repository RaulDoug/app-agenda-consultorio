import type { BusinessHours } from '@cliniassist/shared';
import {
  BusinessHoursRepository,
  type UpsertBusinessHoursDTO,
} from '../repositories/business-hours-repository.js';

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
  return h * 60 + m;
}

export class BusinessHoursService {
  constructor(private repo: BusinessHoursRepository = new BusinessHoursRepository()) {}

  async listBusinessHours(tenantId: string): Promise<BusinessHours[]> {
    if (!tenantId) {
      throw new Error('Tenant ID é obrigatório.');
    }
    return this.repo.findByTenant(tenantId);
  }

  async getBusinessHoursForDay(tenantId: string, dayOfWeek: number): Promise<BusinessHours | null> {
    if (!tenantId) {
      throw new Error('Tenant ID é obrigatório.');
    }
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      const error: any = new Error('day_of_week deve estar entre 0 (Domingo) e 6 (Sábado).');
      error.statusCode = 400;
      throw error;
    }
    const persisted = await this.repo.findByDay(tenantId, dayOfWeek);
    if (persisted) {
      return persisted;
    }

    // Fallback padrão seguro caso o consultório ainda não tenha customizado o dia
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    return {
      id: `default-${dayOfWeek}`,
      tenant_id: tenantId,
      day_of_week: dayOfWeek,
      is_open: !isWeekend,
      start_time: '08:00',
      end_time: '18:00',
      break_start_time: isWeekend ? null : '12:00',
      break_end_time: isWeekend ? null : '13:30',
    };
  }

  async updateBusinessHours(
    tenantId: string,
    input: UpsertBusinessHoursDTO | UpsertBusinessHoursDTO[]
  ): Promise<BusinessHours[]> {
    if (!tenantId) {
      throw new Error('Tenant ID é obrigatório.');
    }

    const hoursList = Array.isArray(input) ? input : [input];
    if (hoursList.length === 0) {
      const error: any = new Error('Nenhum horário fornecido.');
      error.statusCode = 400;
      throw error;
    }

    for (const h of hoursList) {
      if (typeof h.day_of_week !== 'number' || h.day_of_week < 0 || h.day_of_week > 6) {
        const error: any = new Error('day_of_week deve estar entre 0 (Domingo) e 6 (Sábado).');
        error.statusCode = 400;
        throw error;
      }

      if (h.is_open) {
        if (!h.start_time || !h.end_time) {
          const error: any = new Error('start_time e end_time são obrigatórios para dias com expediente.');
          error.statusCode = 400;
          throw error;
        }

        const startMin = timeToMinutes(h.start_time);
        const endMin = timeToMinutes(h.end_time);

        if (endMin <= startMin) {
          const error: any = new Error('O horário de término deve ser posterior ao horário de início.');
          error.statusCode = 400;
          throw error;
        }

        if (h.break_start_time && h.break_end_time) {
          const breakStart = timeToMinutes(h.break_start_time);
          const breakEnd = timeToMinutes(h.break_end_time);

          if (breakEnd <= breakStart) {
            const error: any = new Error('O término do intervalo de almoço deve ser posterior ao início.');
            error.statusCode = 400;
            throw error;
          }

          if (breakStart < startMin || breakEnd > endMin) {
            const error: any = new Error('O intervalo de almoço deve estar contido dentro do horário de expediente.');
            error.statusCode = 400;
            throw error;
          }
        }
      }
    }

    return this.repo.upsertBatch(tenantId, hoursList);
  }

  /**
   * Valida se um horário desejado colide com o expediente ou almoço do consultório.
   */
  async checkSlotAvailability(
    tenantId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ available: boolean; conflictType?: 'OUTSIDE_HOURS' | 'BREAK_TIME'; message?: string }> {
    const dayOfWeek = startTime.getUTCDay();
    const config = await this.getBusinessHoursForDay(tenantId, dayOfWeek);

    if (!config || !config.is_open) {
      return {
        available: false,
        conflictType: 'OUTSIDE_HOURS',
        message: 'O consultório está fechado neste dia da semana.',
      };
    }

    const appStartMin = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
    const appEndMin = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();

    const openStartMin = timeToMinutes(config.start_time);
    const openEndMin = timeToMinutes(config.end_time);

    if (appStartMin < openStartMin || appEndMin > openEndMin) {
      return {
        available: false,
        conflictType: 'OUTSIDE_HOURS',
        message: `Horário fora do expediente do consultório (${config.start_time} às ${config.end_time}).`,
      };
    }

    if (config.break_start_time && config.break_end_time) {
      const breakStart = timeToMinutes(config.break_start_time);
      const breakEnd = timeToMinutes(config.break_end_time);

      if (appStartMin < breakEnd && appEndMin > breakStart) {
        return {
          available: false,
          conflictType: 'BREAK_TIME',
          message: `Horário conflitante com o intervalo de almoço do consultório (${config.break_start_time} às ${config.break_end_time}).`,
        };
      }
    }

    return { available: true };
  }
}
