import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface TokenPayload {
  tenant_id: string;
  user_id?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      userId?: string;
    }
  }
}

export const DEFAULT_JWT_SECRET = process.env.JWT_SECRET || 'cliniassist_dev_jwt_secret_key_12345';

export function generateTestToken(payload: { tenant_id: string; user_id?: string }, secret = DEFAULT_JWT_SECRET): string {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, DEFAULT_JWT_SECRET) as TokenPayload;

    if (!decoded.tenant_id) {
      res.status(401).json({ error: 'Token inválido: tenant_id não encontrado no payload.' });
      return;
    }

    req.tenantId = decoded.tenant_id;
    req.userId = decoded.user_id;

    next();
  } catch (err) {
    res.status(401).json({ error: 'Token de autenticação inválido ou expirado.' });
  }
}
