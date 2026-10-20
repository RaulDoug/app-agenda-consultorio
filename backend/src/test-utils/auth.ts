import { generateTestToken } from '../middlewares/auth.js';
import type { IDatabase } from '../db/connection.js';

export interface SeedTestTenantOptions {
  id?: string;
  name?: string;
  email?: string;
  password_hash?: string;
  must_change_password?: boolean;
  token_version?: number;
  is_active?: boolean;
}

export async function seedTestTenant(
  db: IDatabase,
  options: SeedTestTenantOptions = {}
): Promise<{ id: string; token: string }> {
  const id = options.id || crypto.randomUUID();
  const name = options.name || 'Consultório Teste';
  const email = options.email || `teste-${id.slice(0, 8)}@clinica.com`;
  const hash = options.password_hash || '$2b$10$hashDeTeste12345678901234567890123456789012345678';
  const mustChange = Boolean(options.must_change_password);
  const tv = options.token_version ?? 0;
  const isActive = options.is_active ?? true;

  await db.query(
    `INSERT INTO tenants (id, name, email, password_hash, must_change_password, token_version, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       email = EXCLUDED.email,
       must_change_password = EXCLUDED.must_change_password,
       token_version = EXCLUDED.token_version,
       is_active = EXCLUDED.is_active`,
    [id, name, email, hash, mustChange, tv, isActive]
  );

  const token = generateTestToken({ tenant_id: id, tv });
  return { id, token };
}
