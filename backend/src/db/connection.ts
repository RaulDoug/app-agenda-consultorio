import pg from 'pg';
import { newDb, DataType } from 'pg-mem';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface QueryResult<R = any> {
  rows: R[];
  rowCount?: number | null;
}

export interface IDatabaseClient {
  query<R = any>(sql: string, params?: any[]): Promise<QueryResult<R>>;
  release(): void;
}

export interface IDatabase {
  query<R = any>(sql: string, params?: any[]): Promise<QueryResult<R>>;
  getClient(): Promise<IDatabaseClient>;
  close(): Promise<void>;
}

// Implementação com Pool do pg para runtime real (Docker / Produção)
class PostgresPoolAdapter implements IDatabase {
  private pool: pg.Pool;

  constructor(connectionString?: string) {
    this.pool = new Pool({
      connectionString: connectionString || process.env.DATABASE_URL || 'postgres://odontoflow:odontoflow_password@localhost:5432/odontoflow_dev',
    });
  }

  async query<R = any>(sql: string, params?: any[]): Promise<QueryResult<R>> {
    const res = await this.pool.query(sql, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount,
    };
  }

  async getClient(): Promise<IDatabaseClient> {
    const client = await this.pool.connect();
    return {
      query: async <R = any>(sql: string, params?: any[]) => {
        const res = await client.query(sql, params);
        return { rows: res.rows, rowCount: res.rowCount };
      },
      release: () => client.release(),
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Implementação em memória com pg-mem para testes TDD determinísticos e ultra-rápidos
export function createInMemoryDatabase(): IDatabase {
  const memDb = newDb({
    autoCreateForeignKeyIndices: true,
  });

  // Registra funções PostgreSQL esperadas
  memDb.public.registerFunction({
    name: 'uuid_generate_v4',
    returns: DataType.uuid,
    impure: true,
    implementation: () => crypto.randomUUID(),
  });

  memDb.public.registerFunction({
    name: 'current_timestamp',
    returns: DataType.timestamptz,
    impure: true,
    implementation: () => new Date(),
  });

  // Carrega e executa schema.sql
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = readFileSync(schemaPath, 'utf-8');

  // Remove blocos DO $$ do pg-mem se houver incompatibilidade e executa DDL
  const sanitizedSql = schemaSql
    .replace(/DO \$\$[\s\S]*?END \$\$;/g, '')
    .replace(/CREATE EXTENSION[\s\S]*?;/g, '');

  memDb.public.none(sanitizedSql);

  const pgAdapter = memDb.adapters.createPg();

  return {
    async query<R = any>(sql: string, params?: any[]): Promise<QueryResult<R>> {
      const client = new pgAdapter.Client();
      await client.connect();
      try {
        const res = await client.query(sql, params);
        return { rows: res.rows, rowCount: res.rowCount };
      } finally {
        await client.end();
      }
    },
    async getClient(): Promise<IDatabaseClient> {
      const client = new pgAdapter.Client();
      await client.connect();
      let backup: any = null;
      return {
        query: async <R = any>(sql: string, params?: any[]) => {
          const trimmed = sql.trim().toUpperCase();
          if (trimmed === 'BEGIN' || trimmed.startsWith('BEGIN;')) {
            backup = memDb.backup();
          } else if (trimmed === 'ROLLBACK' || trimmed.startsWith('ROLLBACK;')) {
            if (backup) {
              backup.restore();
              backup = null;
            }
          } else if (trimmed === 'COMMIT' || trimmed.startsWith('COMMIT;')) {
            backup = null;
          }
          const res = await client.query(sql, params);
          return { rows: res.rows, rowCount: res.rowCount };
        },
        release: () => {
          client.end();
        },
      };
    },
    async close(): Promise<void> {
      // no-op para memDb
    },
  };
}

let activeDb: IDatabase | null = null;

export function getDatabase(): IDatabase {
  if (!activeDb) {
    if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
      activeDb = createInMemoryDatabase();
    } else {
      activeDb = new PostgresPoolAdapter();
    }
  }
  return activeDb;
}

export function setDatabase(db: IDatabase | null): void {
  activeDb = db;
}
