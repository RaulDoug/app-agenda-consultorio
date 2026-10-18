import { LocalAppointment, LocalPatient, LocalProcedure, LocalAppointmentItem } from '../../db/types';

export type ViewMode = 'day' | 'week' | 'month';

export interface LocalAppointmentWithDetails {
  id: string;
  tenant_id: string;
  patient_id: string;
  patient_name: string;
  patient_whatsapp?: string;
  start_time: string;
  end_time: string;
  status: LocalAppointment['status'];
  is_extra_fit: boolean;
  notes?: string | null;
  items?: LocalAppointmentItem[];
  procedures?: LocalProcedure[];
}

export interface TimeSlot {
  timeStr: string; // Ex: "08:00", "08:30"
  hour: number;
  minute: number;
  isLunchTime: boolean;
  isOutOfHours: boolean;
  appointments: LocalAppointmentWithDetails[];
}

export interface BusinessHoursConfig {
  startHour: number; // Ex: 8
  startMinute: number; // Ex: 0
  endHour: number; // Ex: 18
  endMinute: number; // Ex: 0
  lunchStartHour: number; // Ex: 12
  lunchStartMinute: number; // Ex: 0
  lunchEndHour: number; // Ex: 13
  lunchEndMinute: number; // Ex: 0
  slotDurationMinutes: number; // 30 por padrão
}

export const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  startHour: 8,
  startMinute: 0,
  endHour: 18,
  endMinute: 0,
  lunchStartHour: 12,
  lunchStartMinute: 0,
  lunchEndHour: 13,
  lunchEndMinute: 0,
  slotDurationMinutes: 30,
};
