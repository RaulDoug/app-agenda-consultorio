import { Router } from 'express';
import { PatientRepository } from '../repositories/patient-repository.js';
import { authMiddleware } from '../middlewares/auth.js';

export const patientsRouter = Router();
const patientRepo = new PatientRepository();

patientsRouter.use(authMiddleware);

// Listagem e busca de pacientes (com proteção SQL injection)
patientsRouter.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const search = req.query.search as string | undefined;
    const patients = await patientRepo.findAll(tenantId, { search });
    res.json(patients);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Busca por ID
patientsRouter.get('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const patient = await patientRepo.findById(tenantId, req.params.id);
    if (!patient) {
      res.status(404).json({ error: 'Paciente não encontrado.' });
      return;
    }
    res.json(patient);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cadastro On-the-Fly de paciente
patientsRouter.post('/', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const { name, whatsapp, notes, id } = req.body;

    if (!name || !whatsapp) {
      res.status(400).json({ error: 'Nome e WhatsApp são obrigatórios.' });
      return;
    }

    const patient = await patientRepo.create(tenantId, { name, whatsapp, notes }, id);
    res.status(201).json(patient);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Atualização de paciente
patientsRouter.put('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const updated = await patientRepo.update(tenantId, req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Paciente não encontrado.' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Soft Delete de paciente (is_active: false, deleted_at)
patientsRouter.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const success = await patientRepo.softDelete(tenantId, req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Paciente não encontrado.' });
      return;
    }
    res.json({ message: 'Paciente desativado com sucesso (Soft Delete).' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
