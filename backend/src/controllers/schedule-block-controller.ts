import type { Request, Response } from 'express';
import { ScheduleBlockService } from '../services/schedule-block-service.js';

export class ScheduleBlockController {
  constructor(private service: ScheduleBlockService = new ScheduleBlockService()) {}

  async list(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const blocks = await this.service.listBlocks(tenantId, { startDate, endDate });
      res.status(200).json(blocks);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao listar bloqueios.' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;

      const block = await this.service.getBlockById(tenantId, id);
      if (!block) {
        res.status(404).json({ error: 'Bloqueio não encontrado.' });
        return;
      }

      res.status(200).json(block);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao buscar bloqueio.' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { title, start_time, end_time, id } = req.body || {};

      const created = await this.service.createBlock(
        tenantId,
        { title, start_time, end_time },
        id
      );
      res.status(201).json(created);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao criar bloqueio de agenda.' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;

      const updated = await this.service.updateBlock(tenantId, id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Bloqueio não encontrado ou já removido.' });
        return;
      }

      res.status(200).json(updated);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao atualizar bloqueio.' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;

      const success = await this.service.deleteBlock(tenantId, id);
      if (!success) {
        res.status(404).json({ error: 'Bloqueio não encontrado ou já removido.' });
        return;
      }

      res.status(200).json({ message: 'Bloqueio removido com sucesso (Soft Delete).' });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao remover bloqueio.' });
    }
  }
}
