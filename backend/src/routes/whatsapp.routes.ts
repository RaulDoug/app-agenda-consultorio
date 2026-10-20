import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { WhatsappController } from '../controllers/whatsapp-controller.js';

export const whatsappRoutes = Router();

const whatsappController = new WhatsappController();

// Todas as rotas de gerenciamento de WhatsApp requerem autenticação
whatsappRoutes.use(authMiddleware);

whatsappRoutes.get('/session', (req: Request, res: Response) =>
  whatsappController.getSession(req, res)
);

whatsappRoutes.post('/connect', (req: Request, res: Response) =>
  whatsappController.connect(req, res)
);

whatsappRoutes.post('/disconnect', (req: Request, res: Response) =>
  whatsappController.disconnect(req, res)
);

whatsappRoutes.post('/send', (req: Request, res: Response) =>
  whatsappController.sendMessage(req, res)
);

whatsappRoutes.get('/settings', (req: Request, res: Response) =>
  whatsappController.getSettings(req, res)
);

whatsappRoutes.put('/settings', (req: Request, res: Response) =>
  whatsappController.updateSettings(req, res)
);

whatsappRoutes.post('/batch-confirmations/trigger', (req: Request, res: Response) =>
  whatsappController.triggerBatch(req, res)
);

whatsappRoutes.get('/messages', (req: Request, res: Response) =>
  whatsappController.listMessages(req, res)
);
