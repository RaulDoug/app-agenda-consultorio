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

export const DEFAULT_PROCEDURES_SEEDS: Omit<CreateProcedureInput, 'tenant_id'>[] = [
  {
    name: 'Consulta Inicial / Avaliação',
    default_duration_minutes: 30,
    default_price_cents: 15000, // R$ 150,00
  },
  {
    name: 'Atendimento Padrão',
    default_duration_minutes: 30,
    default_price_cents: 20000, // R$ 200,00
  },
  {
    name: 'Retorno / Revisão',
    default_duration_minutes: 30,
    default_price_cents: 0, // Cortesia / Retorno
  },
  {
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
      await this.db.procedures.add(procedure);
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
    const procs = await this.db.procedures
      .where('tenant_id')
      .equals(tenantId)
      .filter((p) => p.is_active)
      .sortBy('name');

    // Se estiver vazio, popula com os padrões genéricos
    if (procs.length === 0) {
      const seeded: LocalProcedure[] = [];
      for (const seed of DEFAULT_PROCEDURES_SEEDS) {
        const p = await this.createProcedure({
          ...seed,
          tenant_id: tenantId,
        });
        seeded.push(p);
      }
      return seeded;
    }

    return procs;
  }

  async getProcedureById(id: string): Promise<LocalProcedure | undefined> {
    return await this.db.procedures.get(id);
  }
}

export const procedureLocalRepo = new ProcedureLocalRepository();
