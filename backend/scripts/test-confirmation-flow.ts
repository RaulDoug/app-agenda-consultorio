/**
 * ====================================================================================================
 * 🤖 SCRIPT DE TESTE INTERATIVO DE CONFIRMAÇÃO DE AGENDAMENTO VIA WHATSAPP (EVOLUTION API)
 * ====================================================================================================
 *
 * COMO EXECUTAR ESTE SCRIPT:
 *
 * 1. Ordem Recomendada: <tenant> <paciente> <numero>
 *    npx tsx backend/scripts/test-confirmation-flow.ts "Consultorio teste" "Teste Whatsapp" 3798231077
 *
 * 2. Com Flags Nomeadas:
 *    npx tsx backend/scripts/test-confirmation-flow.ts --tenant "Consultorio teste" --paciente "Teste Whatsapp" --numero 3798231077
 *
 * 3. Passando UUID do Consultório:
 *    npx tsx backend/scripts/test-confirmation-flow.ts "bb6fafa5-7754-4d27-844e-e560b7ec53d4" "Teste Whatsapp" 3798231077
 *
 * 4. Ordem Alternativa (<numero> <paciente> [tenant]):
 *    npx tsx backend/scripts/test-confirmation-flow.ts 3798231077 "Teste Whatsapp" "Consultorio teste"
 *    npx tsx backend/scripts/test-confirmation-flow.ts 3798231077 "Teste Whatsapp"
 *
 * PARÂMETROS SUPORTADOS:
 * - Tenant/Consultório: Nome (ex: "Consultorio teste") ou UUID do tenant no banco
 * - Paciente: Nome completo do paciente entre aspas (ex: "Teste Whatsapp")
 * - Número/Telefone: Número com DDD (ex: 3798231077 ou 553798231077)
 * ====================================================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Garante carregamento automático do arquivo .env do backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch (err) {
    // Caso já tenha sido carregado pelo ambiente
  }
}

import { getDatabase } from '../src/db/connection.js';
import { getEvolutionClient } from '../src/whatsapp/evolution-client.js';

function printHelp() {
  console.log(`
Uso do comando de teste do WhatsApp:
  npx tsx backend/scripts/test-confirmation-flow.ts <tenant> <paciente> <numero>
  ou
  npx tsx backend/scripts/test-confirmation-flow.ts --tenant <tenant> --paciente <nome> --numero <telefone>

Exemplos:
  npx tsx backend/scripts/test-confirmation-flow.ts "Consultorio teste" "Teste Whatsapp" 3798231077
  npx tsx backend/scripts/test-confirmation-flow.ts --tenant "Consultorio teste" --paciente "Teste Whatsapp" --numero 3798231077
  npx tsx backend/scripts/test-confirmation-flow.ts 3798231077 "Teste Whatsapp" "Consultorio teste"
`);
}

async function run() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  let tenantInput: string | undefined;
  let patientName: string | undefined;
  let rawInputPhone: string | undefined;

  // 1. Parse de flags nomeadas (--tenant, --paciente/--nome, --numero/--telefone/--phone)
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if ((arg === '--tenant' || arg === '-t') && args[i + 1]) {
      tenantInput = args[++i];
    } else if ((arg === '--paciente' || arg === '--nome' || arg === '-p') && args[i + 1]) {
      patientName = args[++i];
    } else if ((arg === '--numero' || arg === '--telefone' || arg === '--phone' || arg === '-n') && args[i + 1]) {
      rawInputPhone = args[++i];
    }
  }

  // 2. Extrai argumentos posicionais ignorando as flags e seus valores
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('-')) {
      i++; // Pula a flag e seu valor associado
      continue;
    }
    positional.push(args[i]);
  }

  // 3. Resolução inteligente de ordem posicional:
  // Suporta tanto <tenant> <paciente> <numero> quanto <numero> <paciente> [tenant]
  if (positional.length >= 3) {
    const isFirstDigits = /^\+?\d{10,13}$/.test(positional[0].replace(/\D/g, ''));
    if (isFirstDigits) {
      // Ordem antiga: <numero> <paciente> <tenant>
      rawInputPhone = rawInputPhone || positional[0];
      patientName = patientName || positional[1];
      tenantInput = tenantInput || positional[2];
    } else {
      // Ordem solicitada pelo usuário: <tenant> <paciente> <numero>
      tenantInput = tenantInput || positional[0];
      patientName = patientName || positional[1];
      rawInputPhone = rawInputPhone || positional[2];
    }
  } else if (positional.length === 2) {
    const isFirstDigits = /^\+?\d{10,13}$/.test(positional[0].replace(/\D/g, ''));
    const isSecondDigits = /^\+?\d{10,13}$/.test(positional[1].replace(/\D/g, ''));
    if (isFirstDigits) {
      rawInputPhone = rawInputPhone || positional[0];
      patientName = patientName || positional[1];
    } else if (isSecondDigits) {
      patientName = patientName || positional[0];
      rawInputPhone = rawInputPhone || positional[1];
    } else {
      tenantInput = tenantInput || positional[0];
      patientName = patientName || positional[1];
    }
  } else if (positional.length === 1) {
    const isDigits = /^\+?\d{10,13}$/.test(positional[0].replace(/\D/g, ''));
    if (isDigits) {
      rawInputPhone = rawInputPhone || positional[0];
    } else {
      tenantInput = tenantInput || positional[0];
    }
  }

  // Defaults seguros para testes rápidos caso não informados
  rawInputPhone = rawInputPhone || '3798231077';
  patientName = patientName || 'Teste Whatsapp';

  const cleanDigits = rawInputPhone.replace(/\D/g, '');
  if (cleanDigits.length < 10) {
    console.error('❌ Número de telefone inválido. Informe o DDD e o número (ex: 3798231077).');
    printHelp();
    process.exit(1);
  }

  const nationalPhone =
    cleanDigits.startsWith('55') && (cleanDigits.length === 12 || cleanDigits.length === 13)
      ? cleanDigits.slice(2)
      : cleanDigits;
  const internationalPhone = cleanDigits.startsWith('55') ? cleanDigits : `55${cleanDigits}`;

  const db = getDatabase();
  const evolutionClient = getEvolutionClient();

  let targetTenantId: string;
  let targetTenantName: string;
  let instanceName: string;

  // 4. Resolução do Consultório (Tenant)
  if (tenantInput) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantInput);
    let tenantRes;
    if (isUuid) {
      tenantRes = await db.query(
        `SELECT id, name, whatsapp_instance_name FROM tenants WHERE id = $1 AND is_active = true LIMIT 1`,
        [tenantInput]
      );
    } else {
      tenantRes = await db.query(
        `SELECT id, name, whatsapp_instance_name FROM tenants WHERE name ILIKE $1 AND is_active = true LIMIT 1`,
        [`%${tenantInput}%`]
      );
    }

    if (tenantRes.rows.length === 0) {
      throw new Error(`Consultório (tenant) "${tenantInput}" não foi encontrado ou está inativo no PostgreSQL.`);
    }

    targetTenantId = tenantRes.rows[0].id;
    targetTenantName = tenantRes.rows[0].name;
    instanceName = tenantRes.rows[0].whatsapp_instance_name || `cliniassist_${String(targetTenantId).slice(0, 8)}`;
  } else {
    // Seleciona o primeiro consultório ativo no PostgreSQL
    const tenantRes = await db.query(
      `SELECT id, name, whatsapp_instance_name FROM tenants WHERE is_active = true ORDER BY created_at ASC LIMIT 1`
    );
    if (tenantRes.rows.length === 0) {
      throw new Error('Nenhum consultório (tenant) ativo cadastrado no PostgreSQL.');
    }

    targetTenantId = tenantRes.rows[0].id;
    targetTenantName = tenantRes.rows[0].name;
    instanceName = tenantRes.rows[0].whatsapp_instance_name || `cliniassist_${String(targetTenantId).slice(0, 8)}`;
  }

  console.log(`\n======================================================`);
  console.log(`🤖 Teste Interativo de Confirmação WhatsApp CliniAssist`);
  console.log(`======================================================\n`);
  console.log(`🏢 Consultório (Tenant): ${targetTenantName} (${targetTenantId})`);
  console.log(`🔗 Instância Evolution API: ${instanceName}`);
  console.log(`📱 Telefone alvo (Evolution): ${internationalPhone}`);
  console.log(`📱 Telefone cadastral (App): ${nationalPhone}`);
  console.log(`👤 Nome paciente: ${patientName}`);

  // 2. Cadastra ou busca o paciente no banco (verificando formato nacional ou internacional para evitar duplicação)
  const patientRes = await db.query(
    `SELECT id, name, whatsapp FROM patients 
     WHERE tenant_id = $1 AND deleted_at IS NULL AND is_active = true 
       AND (whatsapp = $2 OR whatsapp = $3)
     LIMIT 1`,
    [targetTenantId, nationalPhone, internationalPhone]
  );

  let patientId: string;
  if (patientRes.rows.length === 0) {
    const insertPat = await db.query(
      `INSERT INTO patients (tenant_id, name, whatsapp, is_active) VALUES ($1, $2, $3, true) RETURNING id`,
      [targetTenantId, patientName, nationalPhone]
    );
    patientId = insertPat.rows[0].id;
    console.log(`✔ Paciente cadastrado no PostgreSQL com ID: ${patientId} (WhatsApp: ${nationalPhone})`);
  } else {
    patientId = patientRes.rows[0].id;
    console.log(`✔ Paciente existente localizado com ID: ${patientId} (Nome: ${patientRes.rows[0].name}, WhatsApp: ${patientRes.rows[0].whatsapp})`);
  }

  // 3. Cria o agendamento de teste para amanhã com status PENDING
  // 3. Limpa agendamentos pendentes de testes anteriores deste paciente para garantir determinismo
  await db.query(
    `DELETE FROM appointments 
     WHERE tenant_id = $1 AND patient_id = $2 AND status = 'PENDING'`,
    [targetTenantId, patientId]
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setMinutes(tomorrowEnd.getMinutes() + 30);

  const appRes = await db.query(
    `INSERT INTO appointments (tenant_id, patient_id, start_time, end_time, status)
     VALUES ($1, $2, $3, $4, 'PENDING')
     RETURNING id, status, start_time`,
    [targetTenantId, patientId, tomorrow.toISOString(), tomorrowEnd.toISOString()]
  );

  const appointmentId = appRes.rows[0].id;
  console.log(`✔ Agendamento criado no banco com ID: ${appointmentId}`);
  console.log(`   Status inicial: PENDING`);
  console.log(`   Horário: ${tomorrow.toLocaleDateString('pt-BR')} às 14:00`);

  // 4. Dispara a mensagem oficial de confirmação via Evolution API
  const textMessage = `Olá ${patientName}! Confirmamos seu agendamento no CliniAssist para amanhã às 14:00? 🦷\n\nResponda:\n1 para Confirmar\n2 para Remarcar`;

  console.log(`\n📤 Enviando mensagem de confirmação para o WhatsApp...`);
  const sendRes = await evolutionClient.sendTextMessage({
    instanceName,
    number: internationalPhone,
    text: textMessage,
  });

  console.log(`✔ Mensagem entregue ao WhatsApp! ID: ${sendRes.id}`);
  console.log(`\n------------------------------------------------------`);
  console.log(`📲 AGORA É COM VOCÊ:`);
  console.log(`Abra o seu WhatsApp no celular e responda: 1 (ou 2 para remarcar)`);
  console.log(`💡 Dica: Auto-teste habilitado! Você pode responder no próprio chat consigo mesmo.`);
  console.log(`------------------------------------------------------\n`);
  console.log(`⏳ Monitorando webhook e atualização de status em tempo real (aguardando resposta)...`);

  // 5. Polling do status no banco por até 60 segundos
  const startTime = Date.now();
  let confirmed = false;

  while (Date.now() - startTime < 60000) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const checkRes = await db.query(
      `SELECT status FROM appointments WHERE id = $1`,
      [appointmentId]
    );

    const currentStatus = checkRes.rows[0]?.status;
    if (currentStatus === 'CONFIRMED') {
      console.log(`\n🎉🎉 SUCESSO ABSOLUTO! 🎉🎉`);
      console.log(`O Webhook da Evolution API recebeu sua resposta "1"!`);
      console.log(`Status do agendamento atualizado automaticamente para: CONFIRMED (Confirmado)`);
      confirmed = true;
      break;
    } else if (currentStatus === 'RESCHEDULE_REQUESTED') {
      console.log(`\n⚠️ SUCESSO! O Webhook recebeu sua resposta de remarcação "2"!`);
      console.log(`Status do agendamento atualizado automaticamente para: RESCHEDULE_REQUESTED`);
      confirmed = true;
      break;
    } else {
      process.stdout.write('.');
    }
  }

  if (!confirmed) {
    console.log(`\nTempo limite de monitoramento encerrado. O agendamento permanece em PENDING.`);
  }

  await db.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('\n❌ Erro durante o teste:', err.message);
  process.exit(1);
});
