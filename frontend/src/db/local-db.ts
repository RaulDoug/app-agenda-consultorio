import Dexie, { type Table } from 'dexie';
import type {
  LocalPatient,
  LocalProcedure,
  LocalAppointment,
  LocalAppointmentItem,
  LocalFinancialTransaction,
  LocalBusinessHours,
  LocalScheduleBlock,
  LocalAuthSession,
  SyncOutboxItem,
  SyncMetadata,
} from './types.js';

export class CliniAssistLocalDB extends Dexie {
  patients!: Table<LocalPatient, string>;
  procedures!: Table<LocalProcedure, string>;
  appointments!: Table<LocalAppointment, string>;
  appointment_items!: Table<LocalAppointmentItem, string>;
  financial_transactions!: Table<LocalFinancialTransaction, string>;
  business_hours!: Table<LocalBusinessHours, string>;
  schedule_blocks!: Table<LocalScheduleBlock, string>;
  auth_session!: Table<LocalAuthSession, string>;
  sync_outbox!: Table<SyncOutboxItem, string>;
  sync_metadata!: Table<SyncMetadata, string>;

  constructor(dbName = 'cliniassist_db') {
    super(dbName);

    this.version(1).stores({
      patients: 'id, tenant_id, name, whatsapp, is_active, updated_at',
      procedures: 'id, tenant_id, name, is_active, updated_at',
      appointments: 'id, tenant_id, patient_id, start_time, end_time, status, updated_at, [tenant_id+start_time]',
      appointment_items: 'id, appointment_id, procedure_id',
      financial_transactions: 'id, tenant_id, appointment_id, status, due_date, type, is_active, updated_at, [tenant_id+due_date]',
      business_hours: 'id, tenant_id, day_of_week, [tenant_id+day_of_week]',
      schedule_blocks: 'id, tenant_id, start_time, end_time, deleted_at',
      sync_outbox: 'id, client_mutation_id, status, entity, record_id, created_at, [status+created_at]',
      sync_metadata: 'key',
    });

    this.version(2).stores({
      auth_session: 'key',
    });
  }

  /**
   * Limpa todas as tabelas (utilitário para testes e logout)
   */
  async clearAll(): Promise<void> {
    await this.transaction('rw', this.tables, async () => {
      for (const table of this.tables) {
        await table.clear();
      }
    });
  }
}

export const localDb = new CliniAssistLocalDB();
