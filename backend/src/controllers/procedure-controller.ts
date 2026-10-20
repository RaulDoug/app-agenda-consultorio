import type { Request, Response } from 'express';
import { ProcedureService } from '../services/procedure-service.js';

export class ProcedureController {
  constructor(private procedureService: ProcedureService = new ProcedureService()) {}

  async list(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const search = req.query.search as string | undefined;
      const includeInactive = req.query.includeInactive === 'true';

      const procedures = await this.procedureService.listProcedures(tenantId, { search, includeInactive });
      res.status(200).json(procedures);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao listar procedimentos.' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;

      const procedure = await this.procedureService.getProcedureById(tenantId, id);
      if (!procedure) {
        res.status(404).json({ error: 'Procedimento não encontrado.' });
        return;
      }

      res.status(200).json(procedure);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao buscar procedimento.' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { name, default_duration_minutes, default_price_cents, cost_cents, id } = req.body;

      const procedure = await this.procedureService.createProcedure(
        tenantId,
        { name, default_duration_minutes, default_price_cents, cost_cents },
        id
      );
      res.status(201).json(procedure);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao cadastrar procedimento.' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;

      const updated = await this.procedureService.updateProcedure(tenantId, id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Procedimento não encontrado.' });
        return;
      }

      res.status(200).json(updated);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao atualizar procedimento.' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;

      const success = await this.procedureService.deleteProcedure(tenantId, id);
      if (!success) {
        res.status(404).json({ error: 'Procedimento não encontrado.' });
        return;
      }

      res.status(200).json({ message: 'Procedimento desativado com sucesso (Soft Delete).' });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao desativar procedimento.' });
    }
  }
}
