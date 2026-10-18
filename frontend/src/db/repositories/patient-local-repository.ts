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

export class PatientLocalRepository {
  constructor(private db: CliniAssistLocalDB = localDb) {}

  async createPatient(input: CreatePatientInput): Promise<LocalPatient> {
    const now = new Date().toISOString();
    const patient: LocalPatient = {
      id: input.id || crypto.randomUUID(),
      tenant_id: input.tenant_id,
      name: input.name.trim(),
      whatsapp: input.whatsapp.replace(/\D/g, ''),
      notes: input.notes || null,
      is_active: true,
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
}

export const patientLocalRepo = new PatientLocalRepository();
