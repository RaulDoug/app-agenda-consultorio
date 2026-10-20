import { Router } from 'express';
import { PatientController } from '../controllers/patient-controller.js';
import { authMiddleware } from '../middlewares/auth.js';

import { ReportsController } from '../controllers/reports-controller.js';

export const patientsRouter = Router();
const patientController = new PatientController();
const reportsController = new ReportsController();

patientsRouter.use(authMiddleware);

// Rotas de Pacientes (Clientes)
patientsRouter.get('/', (req, res) => patientController.list(req, res));
patientsRouter.get('/:id/appointments-history', (req, res) =>
  reportsController.getPatientHistory(req, res)
);
patientsRouter.get('/:id', (req, res) => patientController.getById(req, res));
patientsRouter.post('/', (req, res) => patientController.create(req, res));
patientsRouter.put('/:id', (req, res) => patientController.update(req, res));
patientsRouter.delete('/:id', (req, res) => patientController.delete(req, res));
