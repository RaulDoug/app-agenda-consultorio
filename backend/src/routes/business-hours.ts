import { Router } from 'express';
import { BusinessHoursController } from '../controllers/business-hours-controller.js';
import { authMiddleware } from '../middlewares/auth.js';

export const businessHoursRouter = Router();
const controller = new BusinessHoursController();

businessHoursRouter.use(authMiddleware);

// Rotas de Horários de Atendimento (Sem exclusão - apenas consulta e edição/upsert)
businessHoursRouter.get('/', (req, res) => controller.list(req, res));
businessHoursRouter.put('/', (req, res) => controller.update(req, res));
