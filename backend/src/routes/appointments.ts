import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment-controller.js';
import { authMiddleware } from '../middlewares/auth.js';

export const appointmentsRouter = Router();
const controller = new AppointmentController();

appointmentsRouter.use(authMiddleware);

// Rotas de Agendamentos (CRUD completo com validação tripla de conflitos e encaixe)
appointmentsRouter.get('/', (req, res) => controller.list(req, res));
appointmentsRouter.get('/:id', (req, res) => controller.getById(req, res));
appointmentsRouter.post('/', (req, res) => controller.create(req, res));
appointmentsRouter.put('/:id', (req, res) => controller.update(req, res));
appointmentsRouter.delete('/:id', (req, res) => controller.delete(req, res));
