import { TenantRepository, type TenantRecord } from '../repositories/tenant-repository.js';
import { PasswordService } from './password-service.js';
import { ValidationError } from './auth-service.js';
import type { IDatabase } from '../db/connection.js';

export interface CreateUserInput {
  name: string;
  email: string;
  password?: string;
}

export interface CreateUserResult {
  tenant: TenantRecord;
  temporaryPassword?: string;
}

export interface ResetPasswordResult {
  tenant: TenantRecord;
  temporaryPassword: string;
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message = 'Recurso não encontrado.') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UserAdminService {
  private tenantRepo: TenantRepository;

  constructor(tenantRepo?: TenantRepository, db?: IDatabase) {
    this.tenantRepo = tenantRepo || new TenantRepository(db);
  }

  /**
   * Provisiona um novo consultório/usuário no sistema via CLI administrativo.
   */
  async createUser(input: CreateUserInput): Promise<CreateUserResult> {
    const name = input.name?.trim();
    const email = input.email?.trim().toLowerCase();

    if (!name || name.length < 2) {
      throw new ValidationError('O nome do consultório/usuário deve conter ao menos 2 caracteres.');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError('Informe um e-mail válido para o cadastro.');
    }

    const existing = await this.tenantRepo.findByEmail(email);
    if (existing) {
      throw new ValidationError(`Já existe um consultório cadastrado com o e-mail: ${email}`);
    }

    let passwordToHash: string;
    let temporaryPassword: string | undefined;
    let mustChange = false;

    if (input.password && input.password.trim()) {
      const policy = PasswordService.validatePasswordPolicy(input.password);
      if (!policy.isValid) {
        throw new ValidationError(policy.error || 'A senha fornecida não atende aos requisitos.');
      }
      passwordToHash = input.password;
      mustChange = false;
    } else {
      temporaryPassword = PasswordService.generateTemporaryPassword();
      passwordToHash = temporaryPassword;
      mustChange = true;
    }

    const passwordHash = await PasswordService.hashPassword(passwordToHash);

    const tenant = await this.tenantRepo.create({
      name,
      email,
      password_hash: passwordHash,
      must_change_password: mustChange,
    });

    return {
      tenant,
      temporaryPassword,
    };
  }

  /**
   * Reseta a senha de um consultório existente, gerando uma credencial temporária
   * e invalidando todas as sessões anteriores via incremento atômico de token_version.
   */
  async resetPassword(inputOrEmail: string | { email: string }): Promise<ResetPasswordResult> {
    const rawEmail = typeof inputOrEmail === 'string' ? inputOrEmail : inputOrEmail?.email;
    const normalizedEmail = rawEmail?.trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new ValidationError('Informe um e-mail válido para o reset de senha.');
    }

    const tenant = await this.tenantRepo.findByEmail(normalizedEmail);
    if (!tenant) {
      throw new NotFoundError(`Nenhum consultório encontrado para o e-mail: ${normalizedEmail}`);
    }

    const temporaryPassword = PasswordService.generateTemporaryPassword();
    const newHash = await PasswordService.hashPassword(temporaryPassword);

    const updated = await this.tenantRepo.updatePassword(tenant.id, newHash, true);
    if (!updated) {
      throw new Error('Falha ao atualizar as credenciais do consultório.');
    }

    return {
      tenant: updated,
      temporaryPassword,
    };
  }
}
