import type { Request, Response } from 'express';
import { PatientService } from '../services/patient-service.js';

export class PatientController {
  constructor(private patientService: PatientService = new PatientService()) {}

  async list(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const search = req.query.search as string | undefined;
      const includeInactive = req.query.includeInactive === 'true';

      const patients = await this.patientService.listPatients(tenantId, { search, includeInactive });
      res.status(200).json(patients);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao listar pacientes.' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;

      const patient = await this.patientService.getPatientById(tenantId, id);
      if (!patient) {
        res.status(404).json({ error: 'Paciente não encontrado.' });
        return;
      }

      res.status(200).json(patient);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao buscar paciente.' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { name, whatsapp, notes, id } = req.body;

      const patient = await this.patientService.createPatient(tenantId, { name, whatsapp, notes }, id);
      res.status(201).json(patient);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao cadastrar paciente.' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;

      const updated = await this.patientService.updatePatient(tenantId, id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Paciente não encontrado.' });
        return;
      }

      res.status(200).json(updated);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao atualizar paciente.' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;

      const success = await this.patientService.deletePatient(tenantId, id);
      if (!success) {
        res.status(404).json({ error: 'Paciente não encontrado.' });
        return;
      }

      res.status(200).json({ message: 'Paciente desativado com sucesso (Soft Delete).' });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao desativar paciente.' });
    }
  }
}
