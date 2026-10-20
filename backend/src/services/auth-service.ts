import jwt from 'jsonwebtoken';
import { TenantRepository, type TenantRecord } from '../repositories/tenant-repository.js';
import { PasswordService } from './password-service.js';
import { DEFAULT_JWT_SECRET } from '../middlewares/auth.js';
import type { IDatabase } from '../db/connection.js';

export function hashPassword(password: string): string {
  return PasswordService.hashSync(password);
}

export interface TokenPayload {
  tenant_id: string;
  tenantId?: string;
  tv: number;
  email?: string | null;
  name?: string;
  user_id?: string;
  iat?: number;
  exp?: number;
}

export interface TenantProfileResponse {
  id: string;
  name: string;
  email: string | null;
  must_change_password: boolean;
  whatsapp_instance_name: string | null;
  whatsapp_connected: boolean;
}

export interface LoginResult {
  token: string;
  tenant: TenantProfileResponse;
}

export class AuthError extends Error {
  statusCode: number;
  code?: string;
  constructor(message: string, statusCode = 400, code?: string) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message = 'Credenciais inválidas ou acesso não autorizado.') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends AuthError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export function generateToken(payload: TokenPayload, expiresIn: string = '30d'): string {
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  return jwt.sign(
    {
      tenant_id: payload.tenant_id,
      tenantId: payload.tenant_id,
      tv: payload.tv ?? 0,
      email: payload.email,
      name: payload.name,
      user_id: payload.user_id,
    },
    secret,
    { expiresIn } as jwt.SignOptions
  );
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    return null;
  }
}

export class AuthService {
  private tenantRepo: TenantRepository;

  constructor(tenantRepo?: TenantRepository, db?: IDatabase) {
    this.tenantRepo = tenantRepo || new TenantRepository(db);
  }

  /**
   * Autentica o usuário com email e senha via bcrypt.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      throw new UnauthorizedError('Credenciais inválidas ou acesso não autorizado.');
    }

    const tenant = await this.tenantRepo.findByEmail(email);
    if (!tenant || !tenant.is_active || !tenant.password_hash) {
      throw new UnauthorizedError('Credenciais inválidas ou acesso não autorizado.');
    }

    const isMatch = await PasswordService.verifyPassword(password, tenant.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Credenciais inválidas ou acesso não autorizado.');
    }

    const token = generateToken({
      tenant_id: tenant.id,
      tv: tenant.token_version,
      email: tenant.email,
      name: tenant.name,
    });

    return {
      token,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        must_change_password: Boolean(tenant.must_change_password),
        whatsapp_instance_name: tenant.whatsapp_instance_name,
        whatsapp_connected: Boolean(tenant.whatsapp_connected),
      },
    };
  }

  /**
   * Altera a senha do titular autenticado, incrementando o token_version
   * e retornando um novo JWT com a nova versão.
   */
  async changePassword(
    tenantId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ token: string; message: string }> {
    if (!tenantId) {
      throw new UnauthorizedError('Tenant não identificado.');
    }

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Senha atual e nova senha são obrigatórias.');
    }

    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant || !tenant.is_active || !tenant.password_hash) {
      throw new UnauthorizedError('Consultório não encontrado ou inativo.');
    }

    // Valida se a senha atual está correta
    const isCurrentValid = await PasswordService.verifyPassword(
      currentPassword,
      tenant.password_hash
    );
    if (!isCurrentValid) {
      throw new UnauthorizedError('Senha atual incorreta.');
    }

    // Valida a política da nova senha
    const policyResult = PasswordService.validatePasswordPolicy(
      newPassword,
      currentPassword
    );
    if (!policyResult.isValid) {
      throw new ValidationError(policyResult.error || 'A nova senha não atende aos requisitos.');
    }

    // Gera o novo hash bcrypt
    const newHash = await PasswordService.hashPassword(newPassword);

    // Atualiza a senha e incrementa atomicamente o token_version
    const updatedTenant = await this.tenantRepo.updatePassword(
      tenantId,
      newHash,
      false
    );

    if (!updatedTenant) {
      throw new AuthError('Falha ao atualizar a senha no banco de dados.', 500);
    }

    // Emite novo token com a token_version atualizada
    const token = generateToken({
      tenant_id: updatedTenant.id,
      tv: updatedTenant.token_version,
      email: updatedTenant.email,
      name: updatedTenant.name,
    });

    return {
      token,
      message: 'Senha alterada com sucesso.',
    };
  }

  /**
   * Obtém o perfil e status do tenant autenticado.
   */
  async getProfile(tenantId: string): Promise<TenantProfileResponse> {
    if (!tenantId) {
      throw new UnauthorizedError('Tenant não identificado.');
    }

    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant || !tenant.is_active) {
      throw new UnauthorizedError('Consultório não encontrado ou inativo.');
    }

    return {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      must_change_password: Boolean(tenant.must_change_password),
      whatsapp_instance_name: tenant.whatsapp_instance_name,
      whatsapp_connected: Boolean(tenant.whatsapp_connected),
    };
  }
}

/**
 * Função de retrocompatibilidade para rotas/testes existentes.
 */
export async function loginWithCredentials(
  email: string,
  password: string,
  customDb?: IDatabase
): Promise<LoginResult> {
  const service = new AuthService(undefined, customDb);
  return service.login(email, password);
}
