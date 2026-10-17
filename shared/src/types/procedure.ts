export interface Procedure {
  id: string;
  tenant_id: string;
  name: string;
  default_duration_minutes: number;
  default_price_cents: number;
  is_active: boolean;
  deleted_at?: string | null;
  created_at?: string;
}

export interface CreateProcedureDTO {
  name: string;
  default_duration_minutes: number;
  default_price_cents: number;
}

export interface UpdateProcedureDTO {
  name?: string;
  default_duration_minutes?: number;
  default_price_cents?: number;
  is_active?: boolean;
}
