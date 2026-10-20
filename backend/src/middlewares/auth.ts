import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TenantRepository, type TenantSessionState } from '../repositories/tenant-repository.js';
import { getDatabase } from '../db/connection.js';

export interface TokenPayload {
  tenant_id: string;
  tenantId?: string;
  tv?: number;
  user_id?: string;
  email?: string | null;
  name?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      userId?: string;
      mustChangePassword?: boolean;
    }
  }
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CONFIGURAÇÃO CRÍTICA: Variável de ambiente JWT_SECRET é obrigatória em ambiente de produção.');
    }
    return 'cliniassist_dev_jwt_secret_key_12345';
  }
  return secret;
}

export const DEFAULT_JWT_SECRET = process.env.JWT_SECRET || 'cliniassist_dev_jwt_secret_key_12345';

export function generateTestToken(
  payload: { tenant_id: string; user_id?: string; tv?: number },
  secret = getJwtSecret()
): string {
  return jwt.sign(
    {
      tenant_id: payload.tenant_id,
      tenantId: payload.tenant_id,
      tv: payload.tv ?? 0,
      user_id: payload.user_id,
    },
    secret,
    { expiresIn: '7d' }
  );
}

/**
 * Função interna para autenticação de token, verificação no banco e checagem de sessão.
 */
async function authenticateRequest(
  req: Request,
  res: Response,
  allowMustChangePassword = false
): Promise<boolean> {
  const authHeader = req.headers.authorization;

  // Header x-tenant-id isolado é terminantemente REJEITADO
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    return false;
  }

  const token = authHeader.split(' ')[1];
  let decoded: TokenPayload;

  try {
    decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch {
    res.status(401).json({ error: 'Token de autenticação inválido ou expirado.' });
    return false;
  }

  if (!decoded.tenant_id) {
    res.status(401).json({ error: 'Token inválido: tenant_id não encontrado no payload.' });
    return false;
  }

  // Verifica o estado atual da sessão no banco de dados
  const customDb = (req as any).db || getDatabase();
  const tenantRepo = new TenantRepository(customDb);
  const sessionState: TenantSessionState | null = await tenantRepo.getSessionState(decoded.tenant_id);

  if (!sessionState || !sessionState.is_active) {
    res.status(401).json({ error: 'Consultório inativo ou não encontrado.' });
    return false;
  }

  // Validação de token_version para invalidação instantânea de sessões antigas
  const tokenVersion = decoded.tv ?? 0;
  if (tokenVersion !== sessionState.token_version) {
    res.status(401).json({
      error: 'Sessão expirada devido a alteração de credenciais. Faça login novamente.',
      code: 'SESSION_REVOKED',
    });
    return false;
  }

  // Se o usuário precisa trocar a senha obrigatoriamente e a rota não autoriza:
  if (sessionState.must_change_password && !allowMustChangePassword) {
    res.status(403).json({
      error: 'Troca de senha obrigatória antes de acessar os recursos.',
      code: 'PASSWORD_CHANGE_REQUIRED',
    });
    return false;
  }

  req.tenantId = sessionState.id;
  req.userId = decoded.user_id;
  req.mustChangePassword = sessionState.must_change_password;

  return true;
}

/**
 * Middleware padrão de autenticação do sistema.
 * Bloqueia chamadas sem token, sessões revogadas e rotas de negócio caso must_change_password seja true.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ok = await authenticateRequest(req, res, false);
    if (ok) next();
  } catch (err: any) {
    res.status(500).json({ error: 'Erro interno ao validar autenticação.' });
  }
}

/**
 * Middleware de autenticação flexível para troca de senha e consulta de perfil próprio.
 * Permite requisições mesmo quando must_change_password = true.
 */
export async function authAllowPasswordChange(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ok = await authenticateRequest(req, res, true);
    if (ok) next();
  } catch (err: any) {
    res.status(500).json({ error: 'Erro interno ao validar autenticação.' });
  }
}
