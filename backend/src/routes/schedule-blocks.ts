import { Router } from 'express';
import { ScheduleBlockController } from '../controllers/schedule-block-controller.js';
import { authMiddleware } from '../middlewares/auth.js';

export const scheduleBlocksRouter = Router();
const controller = new ScheduleBlockController();

scheduleBlocksRouter.use(authMiddleware);

// Rotas de Bloqueios de Agenda (CRUD completo com Soft-Delete)
scheduleBlocksRouter.get('/', (req, res) => controller.list(req, res));
scheduleBlocksRouter.get('/:id', (req, res) => controller.getById(req, res));
scheduleBlocksRouter.post('/', (req, res) => controller.create(req, res));
scheduleBlocksRouter.put('/:id', (req, res) => controller.update(req, res));
scheduleBlocksRouter.delete('/:id', (req, res) => controller.delete(req, res));
