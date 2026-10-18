import { CliniAssistLocalDB, localDb } from '../local-db.js';
import { enqueueMutation } from '../outbox.js';
import type { LocalBusinessHours, LocalScheduleBlock } from '../types.js';

export interface BusinessHoursInput {
  id?: string;
  tenant_id: string;
  day_of_week: number;
  is_open: boolean;
  start_time: string;
  end_time: string;
  break_start_time?: string | null;
  break_end_time?: string | null;
}

export interface CreateScheduleBlockInput {
  id?: string;
  tenant_id: string;
  title: string;
  start_time: string;
  end_time: string;
}

export const DEFAULT_BUSINESS_HOURS = (tenantId: string): BusinessHoursInput[] => [
  { tenant_id: tenantId, day_of_week: 0, is_open: false, start_time: '08:00', end_time: '12:00', break_start_time: null, break_end_time: null }, // Domingo
  { tenant_id: tenantId, day_of_week: 1, is_open: true, start_time: '08:00', end_time: '18:00', break_start_time: '12:00', break_end_time: '13:00' }, // Segunda
  { tenant_id: tenantId, day_of_week: 2, is_open: true, start_time: '08:00', end_time: '18:00', break_start_time: '12:00', break_end_time: '13:00' }, // Terça
  { tenant_id: tenantId, day_of_week: 3, is_open: true, start_time: '08:00', end_time: '18:00', break_start_time: '12:00', break_end_time: '13:00' }, // Quarta
  { tenant_id: tenantId, day_of_week: 4, is_open: true, start_time: '08:00', end_time: '18:00', break_start_time: '12:00', break_end_time: '13:00' }, // Quinta
  { tenant_id: tenantId, day_of_week: 5, is_open: true, start_time: '08:00', end_time: '18:00', break_start_time: '12:00', break_end_time: '13:00' }, // Sexta
  { tenant_id: tenantId, day_of_week: 6, is_open: true, start_time: '08:00', end_time: '12:00', break_start_time: null, break_end_time: null }, // Sábado
];

export class SettingsLocalRepository {
  constructor(private db: CliniAssistLocalDB = localDb) {}

  /**
   * Retorna os horários de funcionamento salvos para o tenant, ou inicializa os padrões caso vazio.
   */
  async getBusinessHours(tenantId: string): Promise<LocalBusinessHours[]> {
    const hours = await this.db.business_hours.where('tenant_id').equals(tenantId).toArray();
    if (hours.length > 0) {
      return hours.sort((a, b) => a.day_of_week - b.day_of_week);
    }

    // Inicializa com padrões
    const defaults = DEFAULT_BUSINESS_HOURS(tenantId);
    await this.saveBusinessHours(defaults);
    return this.getBusinessHours(tenantId);
  }

  /**
   * Salva a configuração de expediente da semana, atualizando ou inserindo cada dia e registrando na outbox.
   */
  async saveBusinessHours(inputs: BusinessHoursInput[]): Promise<LocalBusinessHours[]> {
    const now = new Date().toISOString();
    const savedList: LocalBusinessHours[] = [];

    await this.db.transaction('rw', [this.db.business_hours, this.db.sync_outbox], async () => {
      for (const input of inputs) {
        const existing = input.id
          ? await this.db.business_hours.get(input.id)
          : await this.db.business_hours
              .where('[tenant_id+day_of_week]')
              .equals([input.tenant_id, input.day_of_week])
              .first();

        const id = existing?.id || input.id || crypto.randomUUID();
        const operation = existing ? 'UPDATE' : 'INSERT';

        const record: LocalBusinessHours = {
          id,
          tenant_id: input.tenant_id,
          day_of_week: input.day_of_week,
          is_open: input.is_open,
          start_time: input.start_time,
          end_time: input.end_time,
          break_start_time: input.break_start_time || null,
          break_end_time: input.break_end_time || null,
          created_at: existing?.created_at || now,
          updated_at: now,
        };

        await this.db.business_hours.put(record);
        await enqueueMutation(this.db, {
          entity: 'business_hours',
          recordId: record.id,
          operation,
          payload: record,
        });
        savedList.push(record);
      }
    });

    return savedList.sort((a, b) => a.day_of_week - b.day_of_week);
  }

  /**
   * Cadastra um novo bloqueio pontual na agenda (feriado, férias, reunião).
   */
  async createScheduleBlock(input: CreateScheduleBlockInput): Promise<LocalScheduleBlock> {
    const now = new Date().toISOString();
    const block: LocalScheduleBlock = {
      id: input.id || crypto.randomUUID(),
      tenant_id: input.tenant_id,
      title: input.title,
      start_time: input.start_time,
      end_time: input.end_time,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    };

    await this.db.transaction('rw', [this.db.schedule_blocks, this.db.sync_outbox], async () => {
      await this.db.schedule_blocks.add(block);
      await enqueueMutation(this.db, {
        entity: 'schedule_blocks',
        recordId: block.id,
        operation: 'INSERT',
        payload: block,
      });
    });

    return block;
  }

  /**
   * Realiza soft-delete do bloqueio e enfileira na outbox.
   */
  async deleteScheduleBlock(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.transaction('rw', [this.db.schedule_blocks, this.db.sync_outbox], async () => {
      const block = await this.db.schedule_blocks.get(id);
      if (!block) return;

      const updated: LocalScheduleBlock = {
        ...block,
        deleted_at: now,
        updated_at: now,
      };

      await this.db.schedule_blocks.put(updated);
      await enqueueMutation(this.db, {
        entity: 'schedule_blocks',
        recordId: block.id,
        operation: 'UPDATE',
        payload: updated,
      });
    });
  }

  /**
   * Retorna os bloqueios ativos (não deletados) ordenados por data de início.
   */
  async getActiveScheduleBlocks(tenantId: string): Promise<LocalScheduleBlock[]> {
    const blocks = await this.db.schedule_blocks
      .where('tenant_id')
      .equals(tenantId)
      .filter((b) => !b.deleted_at)
      .toArray();

    return blocks.sort((a, b) => a.start_time.localeCompare(b.start_time));
  }
}

export const settingsRepo = new SettingsLocalRepository();
