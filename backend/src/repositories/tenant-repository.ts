import { getDatabase, type IDatabase } from '../db/connection.js';

export interface TenantRecord {
  id: string;
  name: string;
  email: string | null;
  password_hash: string | null;
  must_change_password: boolean;
  token_version: number;
  password_changed_at: Date | null;
  whatsapp_instance_name: string | null;
  whatsapp_connected: boolean;
  is_active: boolean;
  created_at: Date;
}

export interface CreateTenantData {
  name: string;
  email: string;
  password_hash: string;
  must_change_password?: boolean;
  id?: string;
}

export interface TenantSessionState {
  id: string;
  name: string;
  email: string | null;
  is_active: boolean;
  token_version: number;
  must_change_password: boolean;
}

export class TenantRepository {
  private customDb?: IDatabase;

  constructor(db?: IDatabase) {
    this.customDb = db;
  }

  private get db(): IDatabase {
    return this.customDb || getDatabase();
  }

  /**
   * Busca um tenant por e-mail com normalização em lowercase.
   */
  async findByEmail(email: string): Promise<TenantRecord | null> {
    if (!email || !email.trim()) {
      return null;
    }
    const normalized = email.trim().toLowerCase();
    const query = `
      SELECT id, name, email, password_hash, must_change_password, token_version,
             password_changed_at, whatsapp_instance_name, whatsapp_connected, is_active, created_at
      FROM tenants
      WHERE LOWER(email) = $1
    `;
    const res = await this.db.query<TenantRecord>(query, [normalized]);
    return res.rows[0] || null;
  }

  /**
   * Busca um tenant por ID primário.
   */
  async findById(id: string): Promise<TenantRecord | null> {
    if (!id) return null;
    const query = `
      SELECT id, name, email, password_hash, must_change_password, token_version,
             password_changed_at, whatsapp_instance_name, whatsapp_connected, is_active, created_at
      FROM tenants
      WHERE id = $1
    `;
    const res = await this.db.query<TenantRecord>(query, [id]);
    return res.rows[0] || null;
  }

  /**
   * Cria um novo consultório/tenant com e-mail normalizado e credenciais.
   */
  async create(data: CreateTenantData): Promise<TenantRecord> {
    const id = data.id || crypto.randomUUID();
    const normalizedEmail = data.email.trim().toLowerCase();
    const mustChange = Boolean(data.must_change_password);

    const query = `
      INSERT INTO tenants (
        id, name, email, password_hash, must_change_password, token_version,
        is_active, created_at
      )
      VALUES ($1, $2, $3, $4, $5, 0, true, CURRENT_TIMESTAMP)
      RETURNING id, name, email, password_hash, must_change_password, token_version,
                password_changed_at, whatsapp_instance_name, whatsapp_connected, is_active, created_at
    `;
    const res = await this.db.query<TenantRecord>(query, [
      id,
      data.name.trim(),
      normalizedEmail,
      data.password_hash,
      mustChange,
    ]);
    return res.rows[0];
  }

  /**
   * Atualiza a senha de um tenant, incrementando atomicamente o token_version
   * para invalidar todos os tokens JWT emitidos anteriormente.
   */
  async updatePassword(
    id: string,
    newPasswordHash: string,
    mustChangePassword = false
  ): Promise<TenantRecord | null> {
    const query = `
      UPDATE tenants
      SET password_hash = $2,
          must_change_password = $3,
          token_version = token_version + 1,
          password_changed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, email, password_hash, must_change_password, token_version,
                password_changed_at, whatsapp_instance_name, whatsapp_connected, is_active, created_at
    `;
    const res = await this.db.query<TenantRecord>(query, [
      id,
      newPasswordHash,
      mustChangePassword,
    ]);
    return res.rows[0] || null;
  }

  /**
   * Consulta ultra-rápida do estado de sessão do tenant para uso do authMiddleware.
   */
  async getSessionState(id: string): Promise<TenantSessionState | null> {
    if (!id) return null;
    const query = `
      SELECT id, name, email, is_active, token_version, must_change_password
      FROM tenants
      WHERE id = $1
    `;
    const res = await this.db.query<TenantSessionState>(query, [id]);
    return res.rows[0] || null;
  }
}
