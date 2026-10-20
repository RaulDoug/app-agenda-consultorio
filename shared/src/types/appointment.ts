export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RESCHEDULE_REQUESTED'
  | 'MESSAGE_RECEIVED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED';

export interface AppointmentItem {
  id: string;
  appointment_id: string;
  procedure_id: string;
  effective_price_cents: number;
  cost_cents?: number;
  duration_minutes: number;
}

export interface AppointmentDiscount {
  type: 'PERCENTAGE' | 'FIXED';
  value: number; // percent (0-100) or cents (>= 0)
}

export interface Appointment {
  id: string;
  tenant_id: string;
  patient_id: string;
  start_time: string; // ISO 8601
  end_time: string;   // ISO 8601
  status: AppointmentStatus;
  is_overtime: boolean;
  total_charged_cents?: number | null;
  notes?: string | null;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: AppointmentItem[];
}

export interface CreateAppointmentDTO {
  patient_id: string;
  start_time: string;
  procedure_ids: string[];
  confirm_overtime?: boolean;
  discount?: AppointmentDiscount;
  notes?: string | null;
}

export interface UpdateAppointmentDTO {
  start_time?: string;
  status?: AppointmentStatus;
  procedure_ids?: string[];
  confirm_overtime?: boolean;
  discount?: AppointmentDiscount;
  total_charged_cents?: number | null;
  notes?: string | null;
}

export interface AppointmentConflictResponse {
  code: 'SCHEDULE_BLOCK' | 'DOUBLE_BOOKING' | 'BREAK_TIME' | 'OUTSIDE_HOURS';
  message: string;
  block_title?: string;
  conflict_start?: string;
  conflict_end?: string;
}
