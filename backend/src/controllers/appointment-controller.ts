import type { Request, Response } from 'express';
import {
  AppointmentService,
  AppointmentConflictError,
} from '../services/appointment-service.js';

export class AppointmentController {
  constructor(private service: AppointmentService = new AppointmentService()) {}

  async list(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { start_date, end_date, patient_id, status } = req.query;

      const appointments = await this.service.listAppointments(tenantId, {
        startDate: start_date as string | undefined,
        endDate: end_date as string | undefined,
        patientId: patient_id as string | undefined,
        status: status as string | undefined,
      });

      res.status(200).json(appointments);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao listar agendamentos.' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;

      const appointment = await this.service.getAppointmentById(tenantId, id);
      if (!appointment) {
        res.status(404).json({ error: 'Agendamento não encontrado.' });
        return;
      }

      res.status(200).json(appointment);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao buscar agendamento.' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { patient_id, start_time, procedure_ids, confirm_overtime, discount, notes, id } = req.body || {};

      const appointment = await this.service.createAppointment(
        tenantId,
        {
          patient_id,
          start_time,
          procedure_ids,
          confirm_overtime: Boolean(confirm_overtime),
          discount,
          notes,
        },
        id
      );

      res.status(201).json(appointment);
    } catch (err: any) {
      if (err instanceof AppointmentConflictError || err.statusCode === 409) {
        res.status(409).json({
          error: err.message,
          code: err.code || 'CONFLICT',
          block_title: err.blockTitle,
        });
        return;
      }

      const status = err.statusCode || 400;
      res.status(status).json({ error: err.message || 'Erro ao criar agendamento.' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;

      const updated = await this.service.updateAppointment(tenantId, id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Agendamento não encontrado.' });
        return;
      }

      res.status(200).json(updated);
    } catch (err: any) {
      if (err instanceof AppointmentConflictError || err.statusCode === 409) {
        res.status(409).json({
          error: err.message,
          code: err.code || 'CONFLICT',
          block_title: err.blockTitle,
        });
        return;
      }

      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao atualizar agendamento.' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;

      const success = await this.service.deleteAppointment(tenantId, id);
      if (!success) {
        res.status(404).json({ error: 'Agendamento não encontrado.' });
        return;
      }

      res.status(200).json({ message: 'Agendamento desativado com sucesso (Soft Delete com estorno financeiro automático).' });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao remover agendamento.' });
    }
  }
}
