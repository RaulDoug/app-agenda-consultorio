export interface Patient {
  id: string;
  tenant_id: string;
  name: string;
  whatsapp: string;
  notes?: string | null;
  is_active: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePatientDTO {
  name: string;
  whatsapp: string;
  notes?: string | null;
}

export interface UpdatePatientDTO {
  name?: string;
  whatsapp?: string;
  notes?: string | null;
  is_active?: boolean;
}
