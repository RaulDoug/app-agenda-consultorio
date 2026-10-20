import { Router } from 'express';
import { ReportsController } from '../controllers/reports-controller.js';
import { authMiddleware } from '../middlewares/auth.js';

export const reportsRouter = Router();
reportsRouter.use(authMiddleware);

const reportsController = new ReportsController();

/**
 * GET /api/reports/no-show
 * Relatório de faltas, taxa %, resumo e perda financeira estimada
 */
reportsRouter.get('/no-show', (req, res) => reportsController.getNoShow(req, res));

/**
 * GET /api/reports/dre
 * Resultado líquido DRE com receitas pagas, despesas e margem %
 */
reportsRouter.get('/dre', (req, res) => reportsController.getDRE(req, res));

/**
 * GET /api/reports/receivables
 * Projeção de contas a receber pendentes em 30, 60 e 90 dias
 */
reportsRouter.get('/receivables', (req, res) => reportsController.getReceivables(req, res));

/**
 * GET /api/reports/procedures-profitability
 * Procedimentos realizados mais rentáveis ordenados por lucro (receita - custo)
 */
reportsRouter.get('/procedures-profitability', (req, res) =>
  reportsController.getProfitableProcedures(req, res)
);

/**
 * GET /api/reports/inactive-patients
 * Pacientes inativos nos últimos 3 ou 6 meses sem consultas futuras
 */
reportsRouter.get('/inactive-patients', (req, res) =>
  reportsController.getInactivePatients(req, res)
);

/**
 * GET /api/reports/patient-history/:patientId
 * Histórico completo de consultas por paciente
 */
reportsRouter.get('/patient-history/:patientId', (req, res) =>
  reportsController.getPatientHistory(req, res)
);
