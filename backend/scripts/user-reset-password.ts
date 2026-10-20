import { UserAdminService } from '../src/services/user-admin-service.js';
import { getDatabase } from '../src/db/connection.js';

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        result[key] = nextArg;
        i++;
      } else {
        result[key] = 'true';
      }
    }
  }
  return result;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const email = args.email;

  if (!email) {
    console.error(`
[Uso Incorreto]
Sintaxe esperada:
  npm run user:reset-password -w backend -- --email "contato@clinica.com"

Exemplo:
  npm run user:reset-password -w backend -- --email "admin@dentalprime.com"
`);
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('[user:reset-password] ALERTA: DATABASE_URL não definida. Conectando ao Postgres local padrão.');
  }

  const db = getDatabase();
  const adminService = new UserAdminService(undefined, db);

  try {
    const result = await adminService.resetPassword(email);
    console.log('\n======================================================');
    console.log('       ✔ SENHA DO CONSULTÓRIO RESETADA COM SUCESSO     ');
    console.log('======================================================');
    console.log(`ID:           ${result.tenant.id}`);
    console.log(`Nome:         ${result.tenant.name}`);
    console.log(`E-mail:       ${result.tenant.email}`);
    console.log(`Token Version:${result.tenant.token_version} (Todas as sessões anteriores foram invalidadas)`);
    console.log('\n------------------------------------------------------');
    console.log(' ⚠ NOVA SENHA TEMPORÁRIA GERADA (Exibida uma única vez):');
    console.log(` >>> ${result.temporaryPassword} <<<`);
    console.log(' Entregue esta credencial ao titular da clínica.');
    console.log(' O sistema exigirá a alteração no primeiro acesso.');
    console.log('------------------------------------------------------');
    console.log('======================================================\n');
  } catch (err: any) {
    console.error(`\n[user:reset-password] ✘ Erro ao resetar senha: ${err.message}\n`);
    process.exit(1);
  } finally {
    await db.close();
  }
}

run();
