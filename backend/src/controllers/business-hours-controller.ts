import type { Request, Response } from 'express';
import { BusinessHoursService } from '../services/business-hours-service.js';

export class BusinessHoursController {
  constructor(private service: BusinessHoursService = new BusinessHoursService()) {}

  async list(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const hours = await this.service.listBusinessHours(tenantId);
      res.status(200).json(hours);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao listar expediente.' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const updated = await this.service.updateBusinessHours(tenantId, req.body);
      res.status(200).json(updated);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao salvar expediente.' });
    }
  }
}
