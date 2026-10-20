import { Router } from 'express';
import { FinancialController } from '../controllers/financial-controller.js';
import { FinancialCategoryController } from '../controllers/financial-category-controller.js';
import { authMiddleware } from '../middlewares/auth.js';

export const financialRouter = Router();
financialRouter.use(authMiddleware);

const financialController = new FinancialController();
const categoryController = new FinancialCategoryController();

// Categorias Financeiras (D-05)
financialRouter.get('/categories', categoryController.list);
financialRouter.post('/categories', categoryController.create);
financialRouter.put('/categories/:id', categoryController.update);
financialRouter.delete('/categories/:id', categoryController.delete);

// Métricas Financeiras Analíticas em Regime de Caixa (D-07)
financialRouter.get('/metrics', financialController.getMetrics);

// Conclusão de Atendimento e Checkout Financeiro (AC-027 a AC-031)
financialRouter.post('/checkout', financialController.checkout);

// Baixa / Quitação em Lote de Parcelas Pendentes (AC-032)
financialRouter.post('/settle-batch', financialController.settleBatch);

// Registro de Despesas Rápidas, Recorrentes e Parceladas (AC-033, D-04)
financialRouter.post('/expenses', financialController.createExpense);

// Edição de Transações e Parcelas (D-03)
financialRouter.put('/transactions/:id', financialController.update);

// Soft Delete de Transação com Proteção D-06 (AC-034)
financialRouter.delete('/transactions/:id', financialController.delete);

// Listagem e Filtro de Transações Financeiras (AC-047)
financialRouter.get('/transactions', financialController.list);
