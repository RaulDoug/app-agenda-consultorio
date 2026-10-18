import { Router, type Request, type Response } from 'express';
import { AnalyticsRepository } from '../repositories/analytics-repository.js';

export const analyticsRouter = Router();
const analyticsRepo = new AnalyticsRepository();

function getTenantId(req: Request, res: Response): string | null {
  const tenantId = req.tenantId || (req.headers['x-tenant-id'] as string);
  if (!tenantId) {
    res.status(401).json({ error: 'Token de autenticação ou tenant_id não fornecido.' });
    return null;
  }
  return tenantId;
}

/**
 * AC-035 & AC-036: Taxa de No-Show e Prejuízo Estimado
 * GET /api/analytics/no-show
 */
analyticsRouter.get('/no-show', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const metrics = await analyticsRepo.getNoShowMetrics(tenantId, startDate, endDate);
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * AC-037: DRE Gerencial Simplificado (Receitas, Despesas e Lucro Líquido)
 * GET /api/analytics/dre
 */
analyticsRouter.get('/dre', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const dre = await analyticsRepo.getDREMetrics(tenantId, startDate, endDate);
    res.json(dre);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * AC-038: Projeção de Fluxo de Caixa (30, 60 e 90 dias)
 * GET /api/analytics/cash-flow
 */
analyticsRouter.get('/cash-flow', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const referenceDate = req.query.referenceDate as string | undefined;
    const projection = await analyticsRepo.getCashFlowProjection(tenantId, referenceDate);
    res.json(projection);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * AC-039: Ranking de Lucratividade por Procedimento
 * GET /api/analytics/procedures-ranking
 */
analyticsRouter.get('/procedures-ranking', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const ranking = await analyticsRepo.getProcedureProfitabilityRanking(tenantId);
    res.json(ranking);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * AC-040: Lista de Pacientes Inativos (> 180 dias sem retorno)
 * GET /api/analytics/inactive-patients
 */
analyticsRouter.get('/inactive-patients', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const referenceDate = req.query.referenceDate as string | undefined;
    const inactiveDays = req.query.inactiveDays ? Number(req.query.inactiveDays) : 180;

    const patients = await analyticsRepo.getInactivePatients(tenantId, referenceDate, inactiveDays);
    res.json(patients);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
