import type { ScheduleBlock } from '@cliniassist/shared';
import {
  ScheduleBlockRepository,
  type CreateScheduleBlockDTO,
  type UpdateScheduleBlockDTO,
} from '../repositories/schedule-block-repository.js';

export class ScheduleBlockService {
  constructor(private repo: ScheduleBlockRepository = new ScheduleBlockRepository()) {}

  async listBlocks(
    tenantId: string,
    options?: { startDate?: string; endDate?: string }
  ): Promise<ScheduleBlock[]> {
    if (!tenantId) {
      throw new Error('Tenant ID é obrigatório.');
    }
    return this.repo.findAll(tenantId, options);
  }

  async getBlockById(tenantId: string, id: string): Promise<ScheduleBlock | null> {
    if (!tenantId || !id) {
      const error: any = new Error('Identificadores inválidos.');
      error.statusCode = 400;
      throw error;
    }
    return this.repo.findById(tenantId, id);
  }

  async createBlock(
    tenantId: string,
    data: CreateScheduleBlockDTO,
    customId?: string
  ): Promise<ScheduleBlock> {
    if (!tenantId) {
      throw new Error('Tenant ID é obrigatório.');
    }

    const title = data.title ? data.title.trim() : '';
    if (!title) {
      const error: any = new Error('Título do bloqueio é obrigatório.');
      error.statusCode = 400;
      throw error;
    }

    if (!data.start_time || !data.end_time) {
      const error: any = new Error('start_time e end_time são obrigatórios.');
      error.statusCode = 400;
      throw error;
    }

    const start = new Date(data.start_time);
    const end = new Date(data.end_time);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const error: any = new Error('Datas de início ou término inválidas.');
      error.statusCode = 400;
      throw error;
    }

    if (end.getTime() <= start.getTime()) {
      const error: any = new Error('O término do bloqueio deve ser posterior ao início.');
      error.statusCode = 400;
      throw error;
    }

    return this.repo.create(
      tenantId,
      {
        title,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      },
      customId
    );
  }

  async updateBlock(
    tenantId: string,
    id: string,
    data: UpdateScheduleBlockDTO
  ): Promise<ScheduleBlock | null> {
    if (!tenantId || !id) {
      const error: any = new Error('Identificadores inválidos.');
      error.statusCode = 400;
      throw error;
    }

    const existing = await this.repo.findById(tenantId, id);
    if (!existing) {
      return null;
    }

    const updates: UpdateScheduleBlockDTO = {};

    if (data.title !== undefined) {
      const title = data.title.trim();
      if (!title) {
        const error: any = new Error('Título do bloqueio não pode ser vazio.');
        error.statusCode = 400;
        throw error;
      }
      updates.title = title;
    }

    const finalStart = data.start_time ? new Date(data.start_time) : new Date(existing.start_time);
    const finalEnd = data.end_time ? new Date(data.end_time) : new Date(existing.end_time);

    if (isNaN(finalStart.getTime()) || isNaN(finalEnd.getTime())) {
      const error: any = new Error('Datas de início ou término inválidas.');
      error.statusCode = 400;
      throw error;
    }

    if (finalEnd.getTime() <= finalStart.getTime()) {
      const error: any = new Error('O término do bloqueio deve ser posterior ao início.');
      error.statusCode = 400;
      throw error;
    }

    if (data.start_time !== undefined) {
      updates.start_time = finalStart.toISOString();
    }
    if (data.end_time !== undefined) {
      updates.end_time = finalEnd.toISOString();
    }

    return this.repo.update(tenantId, id, updates);
  }

  async deleteBlock(tenantId: string, id: string): Promise<boolean> {
    if (!tenantId || !id) {
      const error: any = new Error('Identificadores inválidos.');
      error.statusCode = 400;
      throw error;
    }
    return this.repo.softDelete(tenantId, id);
  }

  /**
   * Checa se o intervalo colide com algum bloqueio ativo da agenda.
   * Retorna os dados do primeiro bloqueio encontrado para exibição ao usuário.
   */
  async checkBlockConflict(
    tenantId: string,
    startTimeIso: string,
    endTimeIso: string
  ): Promise<{ hasConflict: boolean; blockTitle?: string; block?: ScheduleBlock }> {
    const overlapping = await this.repo.findOverlapping(tenantId, startTimeIso, endTimeIso);
    if (overlapping.length > 0) {
      return {
        hasConflict: true,
        blockTitle: overlapping[0].title,
        block: overlapping[0],
      };
    }
    return { hasConflict: false };
  }
}
