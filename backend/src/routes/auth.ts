import { Router, type Request, type Response } from 'express';
import { AuthController } from '../controllers/auth-controller.js';
import { authAllowPasswordChange } from '../middlewares/auth.js';
import { loginRateLimiter } from '../middlewares/login-rate-limiter.js';

export const authRouter = Router();
const authController = new AuthController();

/**
 * Autenticação de Consultório / Login
 * POST /api/auth/login
 */
authRouter.post('/login', loginRateLimiter, authController.login);

/**
 * Alteração de Senha pelo Cliente Titular
 * POST /api/auth/change-password
 */
authRouter.post('/change-password', authAllowPasswordChange, authController.changePassword);

/**
 * Consulta de Perfil e Estado de Sessão
 * GET /api/auth/me
 */
authRouter.get('/me', authAllowPasswordChange, authController.me);

/**
 * Rejeição explícita de rotas públicas de cadastro (criação restrita à CLI do desenvolvedor)
 */
authRouter.post('/register', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Cadastro público não disponível. Contas são criadas exclusivamente pela administração.' });
});

authRouter.post('/signup', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Cadastro público não disponível. Contas são criadas exclusivamente pela administração.' });
});
