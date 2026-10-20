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
  const name = args.name;
  const email = args.email;
  const password = args.password;

  if (!name || !email) {
    console.error(`
[Uso Incorreto]
Sintaxe esperada:
  npm run user:create -w backend -- --name "Nome do Consultório" --email "contato@clinica.com" [--password "Senha123"]

Exemplo:
  npm run user:create -w backend -- --name "Clínica Dental Prime" --email "admin@dentalprime.com"
`);
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('[user:create] ALERTA: DATABASE_URL não definida. Conectando ao Postgres local padrão.');
  }

  const db = getDatabase();
  const adminService = new UserAdminService(undefined, db);

  try {
    const result = await adminService.createUser({ name, email, password });
    console.log('\n======================================================');
    console.log('       ✔ CONSULTÓRIO / USUÁRIO CRIADO COM SUCESSO      ');
    console.log('======================================================');
    console.log(`ID:           ${result.tenant.id}`);
    console.log(`Nome:         ${result.tenant.name}`);
    console.log(`E-mail:       ${result.tenant.email}`);
    console.log(`Troca Obrig.: ${result.tenant.must_change_password ? 'SIM' : 'NÃO'}`);

    if (result.temporaryPassword) {
      console.log('\n------------------------------------------------------');
      console.log(' ⚠ SENHA TEMPORÁRIA GERADA (Exibida uma única vez):');
      console.log(` >>> ${result.temporaryPassword} <<<`);
      console.log(' Entregue esta credencial ao titular da clínica.');
      console.log(' O sistema exigirá a alteração no primeiro acesso.');
      console.log('------------------------------------------------------');
    }
    console.log('======================================================\n');
  } catch (err: any) {
    console.error(`\n[user:create] ✘ Erro ao criar consultório: ${err.message}\n`);
    process.exit(1);
  } finally {
    await db.close();
  }
}

run();
