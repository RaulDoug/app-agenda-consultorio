import 'dotenv/config';
import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Garante que o .env da pasta backend/ seja carregado caso o script seja invocado da raiz
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('[db:migrate] DATABASE_URL não definida no ambiente. Usando URL de desenvolvimento local.');
  }

  const pool = new Pool({
    connectionString: databaseUrl || 'postgres://odontoflow:odontoflow_password@localhost:5432/odontoflow_dev',
  });

  const client = await pool.connect();

  try {
    console.log('[db:migrate] Conectado ao banco de dados PostgreSQL.');

    // Cria tabela de controle de migrations se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.join(__dirname, '..', 'src', 'db', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('[db:migrate] Nenhuma pasta de migrations encontrada.');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const checkRes = await client.query(
        'SELECT id FROM schema_migrations WHERE name = $1',
        [file]
      );

      if (checkRes.rows.length > 0) {
        console.log(`[db:migrate] Pulando: ${file} (já executada)`);
        continue;
      }

      console.log(`[db:migrate] Aplicando migration: ${file}...`);
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sqlContent);
        await client.query(
          'INSERT INTO schema_migrations (name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`[db:migrate] ✔ Migration ${file} aplicada com sucesso.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[db:migrate] ✘ Erro ao aplicar migration ${file}:`, err);
        throw err;
      }
    }

    console.log('[db:migrate] Todas as migrações foram verificadas e aplicadas.');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('[db:migrate] Falha na execução das migrações:', err.message);
  process.exit(1);
});
