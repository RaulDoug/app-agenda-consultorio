export type WhatsappMessageDirection = 'OUTBOUND' | 'INBOUND';

export type WhatsappMessageStatus =
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'RECEIVED';

export interface TenantWhatsappSettings {
  id?: string;
  tenant_id: string;
  confirmation_message_template: string;
  confirmation_reply_template: string;
  reschedule_reply_template: string;
  welcome_fallback_reply_template: string;
  confirmation_hour: number; // Ex: 9 (09:00)
  confirmation_days_ahead: number; // Ex: 1 (D+1)
  auto_reply_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateTenantWhatsappSettingsInput {
  confirmation_message_template?: string;
  confirmation_reply_template?: string;
  reschedule_reply_template?: string;
  welcome_fallback_reply_template?: string;
  confirmation_hour?: number;
  confirmation_days_ahead?: number;
  auto_reply_enabled?: boolean;
}

export interface WhatsappMessageRecord {
  id: string;
  tenant_id: string;
  appointment_id?: string | null;
  patient_id?: string | null;
  direction: WhatsappMessageDirection;
  phone: string;
  message_text: string;
  status: WhatsappMessageStatus;
  evolution_message_id?: string | null;
  created_at: string;
}

export interface CreateWhatsappMessageInput {
  appointment_id?: string | null;
  patient_id?: string | null;
  direction: WhatsappMessageDirection;
  phone: string;
  message_text: string;
  status: WhatsappMessageStatus;
  evolution_message_id?: string | null;
}

export interface BatchConfirmationTriggerResult {
  scheduledCount: number;
  skippedCount: number;
  skippedSameDayCount: number;
  skippedRecentlyNotifiedCount: number;
  skippedAppointments: string[];
  enqueuedJobs: Array<{
    appointmentId: string;
    patientName: string;
    phone: string;
    delayMs: number;
  }>;
}

export type WhatsappQueueItemCategory =
  | 'PENDING_QUEUE'
  | 'AWAITING_REPLY'
  | 'CONFIRMED'
  | 'RESCHEDULE_REQUESTED'
  | 'HUMAN_ATTENTION';

export interface WhatsappQueueItem {
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  phone: string;
  appointment_start_time: string;
  appointment_end_time: string;
  appointment_status: string;
  queue_category: WhatsappQueueItemCategory;
  queue_order: number;
  queue_excluded: boolean;
  custom_message?: string | null;
  preview_message: string;
  last_outbound_at?: string | null;
  last_inbound_text?: string | null;
  last_inbound_at?: string | null;
  enqueued_job_id?: string | null;
  enqueued_delay_ms?: number | null;
}

export interface WhatsappQueueListResponse {
  items: WhatsappQueueItem[];
  queue_paused: boolean;
  pending_jobs_count: number;
  counts: {
    total: number;
    pending_queue: number;
    awaiting_reply: number;
    confirmed: number;
    reschedule_requested: number;
    human_attention: number;
  };
}
