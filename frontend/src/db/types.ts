/**
 * Tipos de entidades armazenadas no banco local IndexedDB (Dexie.js) do CliniAssist
 */

export interface LocalPatient {
  id: string;
  tenant_id: string;
  name: string;
  whatsapp: string;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalProcedure {
  id: string;
  tenant_id: string;
  name: string;
  default_duration_minutes: number;
  default_price_cents: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RESCHEDULE_REQUESTED'
  | 'MESSAGE_RECEIVED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED';

export interface LocalAppointment {
  id: string;
  tenant_id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  is_extra_fit: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocalAppointmentItem {
  id: string;
  appointment_id: string;
  procedure_id: string;
  effective_price_cents: number;
  duration_minutes: number;
}

export interface LocalFinancialTransaction {
  id: string;
  tenant_id: string;
  appointment_id?: string | null;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description?: string | null;
  amount_cents: number;
  payment_method?: string | null;
  status: 'PAID' | 'PENDING';
  due_date: string;
  payment_date?: string | null;
  installment_number: number;
  total_installments: number;
  is_active: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocalBusinessHours {
  id: string;
  tenant_id: string;
  day_of_week: number;
  is_open: boolean;
  start_time: string;
  end_time: string;
  break_start_time?: string | null;
  break_end_time?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocalScheduleBlock {
  id: string;
  tenant_id: string;
  title: string;
  start_time: string;
  end_time: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type OutboxEntity =
  | 'patients'
  | 'procedures'
  | 'appointments'
  | 'appointment_items'
  | 'financial_transactions'
  | 'business_hours'
  | 'schedule_blocks';

export type OutboxOperation = 'INSERT' | 'UPDATE' | 'DELETE';
export type OutboxStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface SyncOutboxItem {
  id: string;
  client_mutation_id: string;
  entity: OutboxEntity;
  record_id: string;
  operation: OutboxOperation;
  payload: any;
  status: OutboxStatus;
  retry_count: number;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncMetadata {
  key: string;
  value: string;
}
