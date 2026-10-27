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

// Endpoints da Central de Fila de WhatsApp
whatsappRoutes.get('/queue', (req: Request, res: Response) =>
  whatsappController.getQueue(req, res)
);

whatsappRoutes.post('/queue/:appointmentId/send-now', (req: Request, res: Response) =>
  whatsappController.sendNow(req, res)
);

whatsappRoutes.delete('/queue/:appointmentId', (req: Request, res: Response) =>
  whatsappController.excludeFromQueue(req, res)
);

whatsappRoutes.put('/queue/:appointmentId/message', (req: Request, res: Response) =>
  whatsappController.updateMessage(req, res)
);

whatsappRoutes.put('/queue/reorder', (req: Request, res: Response) =>
  whatsappController.reorder(req, res)
);

whatsappRoutes.post('/queue/pause', (req: Request, res: Response) =>
  whatsappController.setQueuePauseState(req, res)
);

whatsappRoutes.put('/queue/:appointmentId/status', (req: Request, res: Response) =>
  whatsappController.resolveStatus(req, res)
);

whatsappRoutes.post('/queue/:appointmentId/reply', (req: Request, res: Response) =>
  whatsappController.replyQueueItem(req, res)
);
