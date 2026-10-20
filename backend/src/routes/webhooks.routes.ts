import { Router, type Request, type Response } from 'express';
import { WebhookController } from '../controllers/webhook-controller.js';

export const webhooksRoutes = Router();

const webhookController = new WebhookController();

/**
 * Endpoint de Webhook da Evolution API para recepção de mensagens e eventos de instância
 * POST /api/webhooks/whatsapp
 */
webhooksRoutes.post(
  ['/whatsapp', '/whatsapp/:event', '/whatsapp/:event/:sub'],
  (req: Request, res: Response) => webhookController.handleWebhook(req, res)
);
