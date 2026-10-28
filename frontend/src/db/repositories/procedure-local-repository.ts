import { CliniAssistLocalDB, localDb } from '../local-db.js';
import { enqueueMutation } from '../outbox.js';
import type { LocalProcedure } from '../types.js';

export interface CreateProcedureInput {
  id?: string;
  tenant_id: string;
  name: string;
  default_duration_minutes: number;
  default_price_cents: number;
  cost_cents?: number;
}

export interface UpdateProcedureInput {
  name?: string;
  default_duration_minutes?: number;
  default_price_cents?: number;
  cost_cents?: number;
  is_active?: boolean;
}

export const DEFAULT_PROCEDURES_SEEDS: (Omit<CreateProcedureInput, 'tenant_id'> & { id: string })[] = [
  {
    id: 'seed-proc-consulta-inicial',
    name: 'Consulta Inicial / Avaliação',
    default_duration_minutes: 30,
    default_price_cents: 15000, // R$ 150,00
    cost_cents: 0,
  },
  {
    id: 'seed-proc-atendimento-padrao',
    name: 'Atendimento Padrão',
    default_duration_minutes: 30,
    default_price_cents: 20000, // R$ 200,00
    cost_cents: 2000,
  },
  {
    id: 'seed-proc-retorno-revisao',
    name: 'Retorno / Revisão',
    default_duration_minutes: 30,
    default_price_cents: 0, // Cortesia / Retorno
    cost_cents: 0,
  },
  {
    id: 'seed-proc-especializado',
    name: 'Procedimento Especializado',
    default_duration_minutes: 60,
    default_price_cents: 35000, // R$ 350,00
    cost_cents: 5000,
  },
];

export class ProcedureLocalRepository {
  constructor(private db: CliniAssistLocalDB = localDb) {}

  async createProcedure(input: CreateProcedureInput): Promise<LocalProcedure> {
    if (!input.name || !input.name.trim()) {
      throw new Error('Informe o nome do procedimento.');
    }
    if (input.default_duration_minutes !== undefined && input.default_duration_minutes <= 0) {
      throw new Error('A duração padrão deve ser maior que zero minutos.');
    }
    if (input.default_price_cents !== undefined && input.default_price_cents < 0) {
      throw new Error('O preço padrão não pode ser negativo.');
    }
    if (input.cost_cents !== undefined && input.cost_cents < 0) {
      throw new Error('O custo operacional não pode ser negativo.');
    }

    const now = new Date().toISOString();
    const procedure: LocalProcedure = {
      id: input.id || crypto.randomUUID(),
      tenant_id: input.tenant_id,
      name: input.name.trim(),
      default_duration_minutes: input.default_duration_minutes || 30,
      default_price_cents: input.default_price_cents !== undefined ? input.default_price_cents : 0,
      cost_cents: input.cost_cents !== undefined ? Math.max(0, input.cost_cents) : 0,
      is_active: true,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    };

    await this.db.transaction('rw', [this.db.procedures, this.db.sync_outbox], async () => {
      await this.db.procedures.put(procedure);
      await enqueueMutation(this.db, {
        entity: 'procedures',
        recordId: procedure.id,
        operation: 'INSERT',
        payload: procedure,
      });
    });

    return procedure;
  }

  async updateProcedure(id: string, updates: UpdateProcedureInput): Promise<LocalProcedure> {
    const existing = await this.db.procedures.get(id);
    if (!existing) {
      throw new Error(`Procedimento com id ${id} não encontrado no banco local.`);
    }

    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error('Informe o nome do procedimento.');
    }
    if (updates.default_duration_minutes !== undefined && updates.default_duration_minutes <= 0) {
      throw new Error('A duração padrão deve ser maior que zero minutos.');
    }
    if (updates.default_price_cents !== undefined && updates.default_price_cents < 0) {
      throw new Error('O preço padrão não pode ser negativo.');
    }
    if (updates.cost_cents !== undefined && updates.cost_cents < 0) {
      throw new Error('O custo operacional não pode ser negativo.');
    }

    const now = new Date().toISOString();
    const targetIsActive = updates.is_active !== undefined ? updates.is_active : existing.is_active;
    const updated: LocalProcedure = {
      ...existing,
      ...updates,
      name: updates.name !== undefined ? updates.name.trim() : existing.name,
      default_duration_minutes:
        updates.default_duration_minutes !== undefined ? updates.default_duration_minutes : existing.default_duration_minutes,
      default_price_cents:
        updates.default_price_cents !== undefined ? updates.default_price_cents : existing.default_price_cents,
      cost_cents: updates.cost_cents !== undefined ? Math.max(0, updates.cost_cents) : (existing.cost_cents ?? 0),
      is_active: targetIsActive,
      deleted_at: targetIsActive ? null : (existing.deleted_at || now),
      updated_at: now,
    };

    await this.db.transaction('rw', [this.db.procedures, this.db.sync_outbox], async () => {
      await this.db.procedures.put(updated);
      await enqueueMutation(this.db, {
        entity: 'procedures',
        recordId: id,
        operation: 'UPDATE',
        payload: updated,
      });
    });

    return updated;
  }

  async reactivateProcedure(id: string): Promise<LocalProcedure> {
    const existing = await this.db.procedures.get(id);
    if (!existing) {
      throw new Error(`Procedimento com id ${id} não encontrado no banco local.`);
    }

    const now = new Date().toISOString();
    const updated: LocalProcedure = {
      ...existing,
      is_active: true,
      deleted_at: null,
      updated_at: now,
    };

    await this.db.transaction('rw', [this.db.procedures, this.db.sync_outbox], async () => {
      await this.db.procedures.put(updated);
      await enqueueMutation(this.db, {
        entity: 'procedures',
        recordId: id,
        operation: 'UPDATE',
        payload: {
          ...updated,
          is_active: true,
          deleted_at: null,
          updated_at: now,
        },
      });
    });

    return updated;
  }

  async deleteProcedure(id: string): Promise<void> {
    const existing = await this.db.procedures.get(id);
    if (!existing) {
      throw new Error(`Procedimento com id ${id} não encontrado no banco local.`);
    }

    const now = new Date().toISOString();
    const updated: LocalProcedure = {
      ...existing,
      is_active: false,
      deleted_at: now,
      updated_at: now,
    };

    await this.db.transaction('rw', [this.db.procedures, this.db.sync_outbox], async () => {
      await this.db.procedures.put(updated);
      await enqueueMutation(this.db, {
        entity: 'procedures',
        recordId: id,
        operation: 'DELETE',
        payload: {
          id,
          tenant_id: existing.tenant_id,
          name: existing.name,
          default_duration_minutes: existing.default_duration_minutes,
          default_price_cents: existing.default_price_cents,
          cost_cents: existing.cost_cents || 0,
          is_active: false,
          deleted_at: now,
          updated_at: now,
        },
      });
    });
  }

  async listProcedures(tenantId: string, options?: { includeInactive?: boolean }): Promise<LocalProcedure[]> {
    let procs = await this.db.procedures
      .where('tenant_id')
      .equals(tenantId)
      .filter((p) => (options?.includeInactive ? true : p.is_active && !p.deleted_at))
      .sortBy('name');

    // Se estiver vazio, popula com os padrões genéricos de forma atômica e idempotente
    if (procs.length === 0) {
      await this.db.transaction('rw', [this.db.procedures, this.db.sync_outbox], async () => {
        const count = await this.db.procedures
          .where('tenant_id')
          .equals(tenantId)
          .count();

        if (count === 0) {
          const now = new Date().toISOString();
          for (const seed of DEFAULT_PROCEDURES_SEEDS) {
            const procId = crypto.randomUUID();
            const procedure: LocalProcedure = {
              id: procId,
              tenant_id: tenantId,
              name: seed.name.trim(),
              default_duration_minutes: seed.default_duration_minutes || 30,
              default_price_cents: seed.default_price_cents || 0,
              cost_cents: seed.cost_cents || 0,
              is_active: true,
              deleted_at: null,
              created_at: now,
              updated_at: now,
            };
            await this.db.procedures.put(procedure);
            await enqueueMutation(this.db, {
              entity: 'procedures',
              recordId: procedure.id,
              operation: 'INSERT',
              payload: procedure,
            });
          }
        }
      });

      procs = await this.db.procedures
        .where('tenant_id')
        .equals(tenantId)
        .filter((p) => (options?.includeInactive ? true : p.is_active && !p.deleted_at))
        .sortBy('name');
    }

    // Deduplicação defensiva por nome para sanitizar duplicatas pré-existentes
    const seenNames = new Set<string>();
    const deduplicated: LocalProcedure[] = [];
    for (const proc of procs) {
      const normalizedName = proc.name.trim().toLowerCase();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        deduplicated.push(proc);
      }
    }

    return deduplicated;
  }

  async getProcedureById(id: string): Promise<LocalProcedure | undefined> {
    return await this.db.procedures.get(id);
  }
}

export const procedureLocalRepo = new ProcedureLocalRepository();
