import { type Request, type Response } from 'express';
import { ReportsService } from '../services/reports-service.js';
import type { ReportPeriod } from '@cliniassist/shared';

export class ReportsController {
  constructor(private reportsService: ReportsService = new ReportsService()) {}

  private getTenantId(req: Request, res: Response): string | null {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: 'Token de autenticação não fornecido.' });
      return null;
    }
    return tenantId;
  }

  async getNoShow(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req, res);
      if (!tenantId) return;

      const period = req.query.period as ReportPeriod | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const report = await this.reportsService.getNoShowReport(tenantId, {
        period,
        startDate,
        endDate,
      });

      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getDRE(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req, res);
      if (!tenantId) return;

      const period = req.query.period as ReportPeriod | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const report = await this.reportsService.getDREReport(tenantId, {
        period,
        startDate,
        endDate,
      });

      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getReceivables(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req, res);
      if (!tenantId) return;

      const referenceDate = req.query.referenceDate as string | undefined;
      const report = await this.reportsService.getReceivablesReport(tenantId, referenceDate);

      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getProfitableProcedures(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req, res);
      if (!tenantId) return;

      const period = req.query.period as ReportPeriod | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;

      const report = await this.reportsService.getProfitableProceduresReport(
        tenantId,
        { period, startDate, endDate },
        limit
      );

      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getInactivePatients(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req, res);
      if (!tenantId) return;

      const months = req.query.months === '3' ? 3 : 6;
      const referenceDate = req.query.referenceDate as string | undefined;

      const report = await this.reportsService.getInactivePatientsReport(
        tenantId,
        months,
        referenceDate
      );

      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getPatientHistory(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req, res);
      if (!tenantId) return;

      const patientId = (req.params.patientId || req.params.id) as string;
      if (!patientId) {
        res.status(400).json({ error: 'ID do paciente é obrigatório.' });
        return;
      }

      const report = await this.reportsService.getPatientHistoryReport(tenantId, patientId);
      res.json(report);
    } catch (err: any) {
      if (err.message === 'Paciente não encontrado.') {
        res.status(404).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: err.message });
    }
  }
}
