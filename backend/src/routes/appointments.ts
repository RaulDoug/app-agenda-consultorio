import { Router } from 'express';
import {
  AppointmentRepository,
  DoubleBookingConflictError,
} from '../repositories/appointment-repository.js';
import { authMiddleware } from '../middlewares/auth.js';

export const appointmentsRouter = Router();
const appointmentRepo = new AppointmentRepository();

appointmentsRouter.use(authMiddleware);

// Listagem de agendamentos
appointmentsRouter.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const { start_date, end_date, patient_id, status } = req.query;

    const appointments = await appointmentRepo.findAll(tenantId, {
      startDate: start_date as string | undefined,
      endDate: end_date as string | undefined,
      patientId: patient_id as string | undefined,
      status: status as string | undefined,
    });

    res.json(appointments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Busca por ID
appointmentsRouter.get('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const appointment = await appointmentRepo.findById(tenantId, req.params.id);

    if (!appointment) {
      res.status(404).json({ error: 'Agendamento não encontrado.' });
      return;
    }

    res.json(appointment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Criação atômica de agendamento com múltiplos procedimentos
appointmentsRouter.post('/', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const { patient_id, start_time, procedure_ids, confirm_overtime, notes, id } = req.body;

    if (!patient_id || !start_time || !procedure_ids || !Array.isArray(procedure_ids) || procedure_ids.length === 0) {
      res.status(400).json({
        error: 'Campos patient_id, start_time e procedure_ids (não vazio) são obrigatórios.',
      });
      return;
    }

    const appointment = await appointmentRepo.createWithItems(
      tenantId,
      {
        patient_id,
        start_time,
        procedure_ids,
        confirm_overtime,
        notes,
      },
      id
    );

    res.status(201).json(appointment);
  } catch (err: any) {
    if (err instanceof DoubleBookingConflictError || err.statusCode === 409) {
      res.status(409).json({ error: err.message });
      return;
    }

    res.status(400).json({ error: err.message });
  }
});

// Atualização de agendamento
appointmentsRouter.put('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const updated = await appointmentRepo.update(tenantId, req.params.id, req.body);

    if (!updated) {
      res.status(404).json({ error: 'Agendamento não encontrado.' });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Soft Delete de agendamento
appointmentsRouter.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const success = await appointmentRepo.softDelete(tenantId, req.params.id);

    if (!success) {
      res.status(404).json({ error: 'Agendamento não encontrado.' });
      return;
    }

    res.json({ message: 'Agendamento desativado com sucesso (Soft Delete).' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
