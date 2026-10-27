import { CliniAssistLocalDB, localDb } from '../local-db.js';
import { enqueueMutation } from '../outbox.js';
import type { LocalPatient } from '../types.js';

export interface CreatePatientInput {
  id?: string;
  tenant_id: string;
  name: string;
  whatsapp: string;
  notes?: string | null;
}

export function normalizePhoneForComparison(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return digits.slice(2);
  }
  return digits;
}

export class PatientLocalRepository {
  constructor(private db: CliniAssistLocalDB = localDb) {}

  get database(): CliniAssistLocalDB {
    return this.db;
  }

  async createPatient(input: CreatePatientInput): Promise<LocalPatient> {
    const cleanPhone = input.whatsapp.replace(/\D/g, '');
    const tenantId = input.tenant_id || (input as any).tenantId || '';

    if (cleanPhone && tenantId) {
      const normPhone = normalizePhoneForComparison(cleanPhone);
      const duplicate = await this.db.patients
        .where('tenant_id')
        .equals(tenantId)
        .filter((p) => p.is_active && normalizePhoneForComparison(p.whatsapp) === normPhone)
        .first();

      if (duplicate) {
        throw new Error(`Já existe um paciente cadastrado com este WhatsApp: "${duplicate.name}".`);
      }
    }

    const now = new Date().toISOString();
    const patient: LocalPatient = {
      id: input.id || crypto.randomUUID(),
      tenant_id: tenantId,
      name: input.name.trim(),
      whatsapp: cleanPhone,
      notes: input.notes || null,
      is_active: true,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    };

    await this.db.transaction('rw', [this.db.patients, this.db.sync_outbox], async () => {
      await this.db.patients.add(patient);
      await enqueueMutation(this.db, {
        entity: 'patients',
        recordId: patient.id,
        operation: 'INSERT',
        payload: patient,
      });
    });

    return patient;
  }

  async updatePatient(id: string, updates: Partial<Omit<LocalPatient, 'id' | 'tenant_id'>>): Promise<LocalPatient> {
    const existing = await this.db.patients.get(id);
    if (!existing) {
      throw new Error(`Paciente com id ${id} não encontrado no banco local.`);
    }

    if (updates.whatsapp !== undefined) {
      const cleanPhone = updates.whatsapp.replace(/\D/g, '');
      const normPhone = normalizePhoneForComparison(cleanPhone);
      const duplicate = await this.db.patients
        .where('tenant_id')
        .equals(existing.tenant_id)
        .filter((p) => p.is_active && p.id !== id && normalizePhoneForComparison(p.whatsapp) === normPhone)
        .first();

      if (duplicate) {
        throw new Error(`Já existe outro paciente cadastrado com este WhatsApp: "${duplicate.name}".`);
      }
      updates.whatsapp = cleanPhone;
    }

    const now = new Date().toISOString();
    const updated: LocalPatient = {
      ...existing,
      ...updates,
      updated_at: now,
    };

    await this.db.transaction('rw', [this.db.patients, this.db.sync_outbox], async () => {
      await this.db.patients.put(updated);
      await enqueueMutation(this.db, {
        entity: 'patients',
        recordId: id,
        operation: 'UPDATE',
        payload: updated,
      });
    });

    return updated;
  }

  async getPatientById(id: string): Promise<LocalPatient | undefined> {
    return await this.db.patients.get(id);
  }

  async listPatients(tenantId: string): Promise<LocalPatient[]> {
    return await this.db.patients
      .where('tenant_id')
      .equals(tenantId)
      .filter((p) => p.is_active)
      .sortBy('name');
  }

  async searchPatients(tenantId: string, query: string): Promise<LocalPatient[]> {
    const q = query.toLowerCase().trim();
    if (!q) return this.listPatients(tenantId);

    return await this.db.patients
      .where('tenant_id')
      .equals(tenantId)
      .filter((p) => p.is_active && (p.name.toLowerCase().includes(q) || p.whatsapp.includes(q)))
      .toArray();
  }

  /**
   * Realiza a exclusão lógica (soft-delete) do paciente, desativando-o e enfileirando mutação DELETE na outbox.
   */
  async deletePatient(id: string): Promise<void> {
    const existing = await this.db.patients.get(id);
    if (!existing) {
      throw new Error(`Paciente com id ${id} não encontrado no banco local.`);
    }

    const now = new Date().toISOString();
    const updated: LocalPatient = {
      ...existing,
      is_active: false,
      deleted_at: now,
      updated_at: now,
    };

    await this.db.transaction('rw', [this.db.patients, this.db.sync_outbox], async () => {
      await this.db.patients.put(updated);
      await enqueueMutation(this.db, {
        entity: 'patients',
        recordId: id,
        operation: 'DELETE',
        payload: {
          id,
          name: existing.name,
          whatsapp: existing.whatsapp,
          is_active: false,
          deleted_at: now,
          updated_at: now,
        },
      });
    });
  }
}

export const patientLocalRepo = new PatientLocalRepository();
