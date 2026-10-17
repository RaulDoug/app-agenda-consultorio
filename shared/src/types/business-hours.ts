export interface BusinessHours {
  id: string;
  tenant_id: string;
  day_of_week: number; // 0=Domingo, 1=Segunda ... 6=Sábado
  is_open: boolean;
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  break_start_time?: string | null; // HH:mm
  break_end_time?: string | null;   // HH:mm
  created_at?: string;
}

export interface ScheduleBlock {
  id: string;
  tenant_id: string;
  title: string;
  start_time: string; // ISO 8601
  end_time: string;   // ISO 8601
  deleted_at?: string | null;
  created_at?: string;
}

export interface TimeSlot {
  start_time: string | Date;
  end_time: string | Date;
}
