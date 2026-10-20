import type { Patient, CreatePatientDTO, UpdatePatientDTO } from '@cliniassist/shared';
import { PatientRepository } from '../repositories/patient-repository.js';

export class PatientService {
  constructor(private patientRepo: PatientRepository = new PatientRepository()) {}

  async createPatient(tenantId: string, data: CreatePatientDTO, customId?: string): Promise<Patient> {
    if (!tenantId) {
      throw new Error('Tenant ID é obrigatório.');
    }

    const name = data.name ? data.name.trim() : '';
    if (!name) {
      const error: any = new Error('Nome do paciente é obrigatório.');
      error.statusCode = 400;
      throw error;
    }

    const whatsapp = data.whatsapp ? data.whatsapp.trim() : '';
    if (!whatsapp) {
      const error: any = new Error('WhatsApp do paciente é obrigatório.');
      error.statusCode = 400;
      throw error;
    }

    return this.patientRepo.create(
      tenantId,
      {
        name,
        whatsapp,
        notes: data.notes?.trim() || null,
      },
      customId
    );
  }

  async getPatientById(tenantId: string, id: string): Promise<Patient | null> {
    if (!tenantId || !id) {
      const error: any = new Error('Identificadores inválidos.');
      error.statusCode = 400;
      throw error;
    }
    return this.patientRepo.findById(tenantId, id);
  }

  async listPatients(
    tenantId: string,
    options?: { search?: string; includeInactive?: boolean }
  ): Promise<Patient[]> {
    if (!tenantId) {
      throw new Error('Tenant ID é obrigatório.');
    }
    return this.patientRepo.findAll(tenantId, options);
  }

  async updatePatient(tenantId: string, id: string, data: UpdatePatientDTO): Promise<Patient | null> {
    if (!tenantId || !id) {
      const error: any = new Error('Identificadores inválidos.');
      error.statusCode = 400;
      throw error;
    }

    const updates: UpdatePatientDTO = {};

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) {
        const error: any = new Error('Nome do paciente não pode ser vazio.');
        error.statusCode = 400;
        throw error;
      }
      updates.name = name;
    }

    if (data.whatsapp !== undefined) {
      const whatsapp = data.whatsapp.trim();
      if (!whatsapp) {
        const error: any = new Error('WhatsApp do paciente não pode ser vazio.');
        error.statusCode = 400;
        throw error;
      }
      updates.whatsapp = whatsapp;
    }

    if (data.notes !== undefined) {
      updates.notes = data.notes?.trim() || null;
    }

    if (data.is_active !== undefined) {
      updates.is_active = Boolean(data.is_active);
    }

    return this.patientRepo.update(tenantId, id, updates);
  }

  async deletePatient(tenantId: string, id: string): Promise<boolean> {
    if (!tenantId || !id) {
      const error: any = new Error('Identificadores inválidos.');
      error.statusCode = 400;
      throw error;
    }
    return this.patientRepo.softDelete(tenantId, id);
  }
}
