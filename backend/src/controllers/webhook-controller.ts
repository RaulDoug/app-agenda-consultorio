import type { Request, Response } from 'express';
import { WebhookService } from '../services/webhook-service.js';

export class WebhookController {
  constructor(private webhookService: WebhookService = new WebhookService()) {}

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const rawUrlEvent = (req.params as any)?.event;

      const result = await this.webhookService.handleWebhook(payload, rawUrlEvent);

      if (result.status === 'processed') {
        res.status(result.statusCode).json({
          status: 'processed',
          ...result.data,
        });
        return;
      }

      res.status(result.statusCode).json({
        status: result.status,
        ...result.data,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
