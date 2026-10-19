import { CliniAssistLocalDB, localDb } from '../local-db.js';
import { enqueueMutation } from '../outbox.js';
import type { LocalProcedure } from '../types.js';

export interface CreateProcedureInput {
  id?: string;
  tenant_id: string;
  name: string;
  default_duration_minutes: number;
  default_price_cents: number;
}

export const DEFAULT_PROCEDURES_SEEDS: (Omit<CreateProcedureInput, 'tenant_id'> & { id: string })[] = [
  {
    id: 'seed-proc-consulta-inicial',
    name: 'Consulta Inicial / Avaliação',
    default_duration_minutes: 30,
    default_price_cents: 15000, // R$ 150,00
  },
  {
    id: 'seed-proc-atendimento-padrao',
    name: 'Atendimento Padrão',
    default_duration_minutes: 30,
    default_price_cents: 20000, // R$ 200,00
  },
  {
    id: 'seed-proc-retorno-revisao',
    name: 'Retorno / Revisão',
    default_duration_minutes: 30,
    default_price_cents: 0, // Cortesia / Retorno
  },
  {
    id: 'seed-proc-especializado',
    name: 'Procedimento Especializado',
    default_duration_minutes: 60,
    default_price_cents: 35000, // R$ 350,00
  },
];

export class ProcedureLocalRepository {
  constructor(private db: CliniAssistLocalDB = localDb) {}

  async createProcedure(input: CreateProcedureInput): Promise<LocalProcedure> {
    const now = new Date().toISOString();
    const procedure: LocalProcedure = {
      id: input.id || crypto.randomUUID(),
      tenant_id: input.tenant_id,
      name: input.name.trim(),
      default_duration_minutes: input.default_duration_minutes || 30,
      default_price_cents: input.default_price_cents || 0,
      is_active: true,
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

  async listProcedures(tenantId: string): Promise<LocalProcedure[]> {
    let procs = await this.db.procedures
      .where('tenant_id')
      .equals(tenantId)
      .filter((p) => p.is_active)
      .sortBy('name');

    // Se estiver vazio, popula com os padrões genéricos de forma atômica e idempotente
    if (procs.length === 0) {
      await this.db.transaction('rw', [this.db.procedures, this.db.sync_outbox], async () => {
        const count = await this.db.procedures.where('tenant_id').equals(tenantId).count();
        if (count === 0) {
          const now = new Date().toISOString();
          for (const seed of DEFAULT_PROCEDURES_SEEDS) {
            const procId = `${tenantId}-${seed.id}`;
            const procedure: LocalProcedure = {
              id: procId,
              tenant_id: tenantId,
              name: seed.name.trim(),
              default_duration_minutes: seed.default_duration_minutes || 30,
              default_price_cents: seed.default_price_cents || 0,
              is_active: true,
              created_at: now,
              updated_at: now,
            };
            await this.db.procedures.put(procedure);
          }
        }
      });

      procs = await this.db.procedures
        .where('tenant_id')
        .equals(tenantId)
        .filter((p) => p.is_active)
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
