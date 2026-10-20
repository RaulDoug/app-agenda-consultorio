import type { Request, Response } from 'express';
import { AuthService, UnauthorizedError, ValidationError, AuthError } from '../services/auth-service.js';
import {
  getClientIp,
  buildRateLimitKey,
  recordLoginSuccess,
  recordLoginFailure,
} from '../middlewares/login-rate-limiter.js';
import type { IDatabase } from '../db/connection.js';

export class AuthController {
  private getService(req: Request): AuthService {
    const customDb = (req as any).db as IDatabase | undefined;
    return new AuthService(undefined, customDb);
  }

  /**
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body || {};
    const ip = getClientIp(req);
    const rateLimitKey = buildRateLimitKey(ip, email);

    if (!email || !password) {
      recordLoginFailure(rateLimitKey);
      res.status(401).json({ error: 'Credenciais inválidas ou acesso não autorizado.' });
      return;
    }

    try {
      const authService = this.getService(req);
      const result = await authService.login(email, password);

      // Sucesso: limpa tentativas de falha no rate limiter
      recordLoginSuccess(rateLimitKey);

      res.status(200).json(result);
    } catch (err: any) {
      recordLoginFailure(rateLimitKey);

      if (err instanceof UnauthorizedError) {
        res.status(401).json({ error: err.message });
        return;
      }

      res.status(401).json({ error: 'Credenciais inválidas ou acesso não autorizado.' });
    }
  };

  /**
   * POST /api/auth/change-password
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId;
    const currentPassword = req.body?.current_password ?? req.body?.currentPassword;
    const newPassword = req.body?.new_password ?? req.body?.newPassword;

    if (!tenantId) {
      res.status(401).json({ error: 'Token de autenticação não fornecido ou inválido.' });
      return;
    }

    try {
      const authService = this.getService(req);
      const result = await authService.changePassword(
        tenantId,
        currentPassword,
        newPassword
      );

      res.status(200).json(result);
    } catch (err: any) {
      if (err instanceof UnauthorizedError) {
        res.status(401).json({ error: err.message });
        return;
      }
      if (err instanceof ValidationError) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err instanceof AuthError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }

      res.status(500).json({ error: 'Erro interno ao processar a troca de senha.' });
    }
  };

  /**
   * GET /api/auth/me
   */
  me = async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(401).json({ error: 'Token de autenticação não fornecido ou inválido.' });
      return;
    }

    try {
      const authService = this.getService(req);
      const profile = await authService.getProfile(tenantId);
      res.status(200).json({ tenant: profile });
    } catch (err: any) {
      if (err instanceof UnauthorizedError) {
        res.status(401).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Erro ao consultar dados da conta autenticada.' });
    }
  };
}
