import { Router } from 'express';
import { ProcedureController } from '../controllers/procedure-controller.js';
import { authMiddleware } from '../middlewares/auth.js';

export const proceduresRouter = Router();
const procedureController = new ProcedureController();

proceduresRouter.use(authMiddleware);

// Rotas de Procedimentos / Serviços
proceduresRouter.get('/', (req, res) => procedureController.list(req, res));
proceduresRouter.get('/:id', (req, res) => procedureController.getById(req, res));
proceduresRouter.post('/', (req, res) => procedureController.create(req, res));
proceduresRouter.put('/:id', (req, res) => procedureController.update(req, res));
proceduresRouter.delete('/:id', (req, res) => procedureController.delete(req, res));
