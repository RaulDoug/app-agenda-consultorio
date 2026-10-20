import type { Procedure, CreateProcedureDTO, UpdateProcedureDTO } from '@cliniassist/shared';
import { ProcedureRepository } from '../repositories/procedure-repository.js';

export class ProcedureService {
  constructor(private procedureRepo: ProcedureRepository = new ProcedureRepository()) {}

  async createProcedure(tenantId: string, data: CreateProcedureDTO, customId?: string): Promise<Procedure> {
    if (!tenantId) {
      throw new Error('Tenant ID é obrigatório.');
    }

    const name = data.name ? data.name.trim() : '';
    if (!name) {
      const error: any = new Error('Nome do procedimento é obrigatório.');
      error.statusCode = 400;
      throw error;
    }

    if (data.default_duration_minutes === undefined || data.default_duration_minutes <= 0) {
      const error: any = new Error('Duração do procedimento deve ser maior que zero.');
      error.statusCode = 400;
      throw error;
    }

    if (data.default_price_cents === undefined || data.default_price_cents < 0) {
      const error: any = new Error('Preço do procedimento não pode ser negativo.');
      error.statusCode = 400;
      throw error;
    }

    const costCents = data.cost_cents !== undefined ? data.cost_cents : 0;
    if (costCents < 0) {
      const error: any = new Error('Custo do procedimento não pode ser negativo.');
      error.statusCode = 400;
      throw error;
    }

    return this.procedureRepo.create(
      tenantId,
      {
        name,
        default_duration_minutes: Number(data.default_duration_minutes),
        default_price_cents: Number(data.default_price_cents),
        cost_cents: Number(costCents),
      },
      customId
    );
  }

  async getProcedureById(tenantId: string, id: string): Promise<Procedure | null> {
    if (!tenantId || !id) {
      const error: any = new Error('Identificadores inválidos.');
      error.statusCode = 400;
      throw error;
    }
    return this.procedureRepo.findById(tenantId, id);
  }

  async listProcedures(
    tenantId: string,
    options?: { search?: string; includeInactive?: boolean }
  ): Promise<Procedure[]> {
    if (!tenantId) {
      throw new Error('Tenant ID é obrigatório.');
    }
    return this.procedureRepo.findAll(tenantId, options);
  }

  async updateProcedure(tenantId: string, id: string, data: UpdateProcedureDTO): Promise<Procedure | null> {
    if (!tenantId || !id) {
      const error: any = new Error('Identificadores inválidos.');
      error.statusCode = 400;
      throw error;
    }

    const updates: UpdateProcedureDTO = {};

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) {
        const error: any = new Error('Nome do procedimento não pode ser vazio.');
        error.statusCode = 400;
        throw error;
      }
      updates.name = name;
    }

    if (data.default_duration_minutes !== undefined) {
      if (data.default_duration_minutes <= 0) {
        const error: any = new Error('Duração do procedimento deve ser maior que zero.');
        error.statusCode = 400;
        throw error;
      }
      updates.default_duration_minutes = Number(data.default_duration_minutes);
    }

    if (data.default_price_cents !== undefined) {
      if (data.default_price_cents < 0) {
        const error: any = new Error('Preço do procedimento não pode ser negativo.');
        error.statusCode = 400;
        throw error;
      }
      updates.default_price_cents = Number(data.default_price_cents);
    }

    if (data.cost_cents !== undefined) {
      if (data.cost_cents < 0) {
        const error: any = new Error('Custo do procedimento não pode ser negativo.');
        error.statusCode = 400;
        throw error;
      }
      updates.cost_cents = Number(data.cost_cents);
    }

    if (data.is_active !== undefined) {
      updates.is_active = Boolean(data.is_active);
    }

    return this.procedureRepo.update(tenantId, id, updates);
  }

  async deleteProcedure(tenantId: string, id: string): Promise<boolean> {
    if (!tenantId || !id) {
      const error: any = new Error('Identificadores inválidos.');
      error.statusCode = 400;
      throw error;
    }
    return this.procedureRepo.softDelete(tenantId, id);
  }
}
