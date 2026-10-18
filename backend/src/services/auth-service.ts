import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getDatabase, type IDatabase } from '../db/connection.js';
import { DEFAULT_JWT_SECRET } from '../middlewares/auth.js';

export interface TokenPayload {
  tenant_id: string;
  tenantId?: string;
  email?: string;
  name: string;
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  const hash = hashPassword(password);
  return hash === storedHash || password === storedHash;
}

export function generateToken(payload: TokenPayload, expiresIn: string = '30d'): string {
  return jwt.sign(payload, DEFAULT_JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, DEFAULT_JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function loginWithCredentials(
  email: string,
  password: string,
  customDb?: IDatabase
): Promise<{ token: string; tenant: any }> {
  if (!email || !password) {
    throw new Error('Email e senha são obrigatórios.');
  }

  const db = customDb || getDatabase();
  const normalizedEmail = email.trim().toLowerCase();

  const res = await db.query(
    `SELECT id, name, email, password_hash, whatsapp_instance_name, whatsapp_connected, is_active
     FROM tenants
     WHERE LOWER(email) = $1 AND is_active = true`,
    [normalizedEmail]
  );

  const tenant = res.rows[0];
  if (!tenant || !tenant.password_hash) {
    throw new Error('Credenciais inválidas ou acesso não autorizado.');
  }

  const isPasswordValid = verifyPassword(password, tenant.password_hash);
  if (!isPasswordValid) {
    throw new Error('Credenciais inválidas ou acesso não autorizado.');
  }

  const token = generateToken({
    tenant_id: tenant.id,
    tenantId: tenant.id,
    email: tenant.email,
    name: tenant.name,
  });

  return {
    token,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      whatsapp_instance_name: tenant.whatsapp_instance_name,
      whatsapp_connected: Boolean(tenant.whatsapp_connected),
    },
  };
}
