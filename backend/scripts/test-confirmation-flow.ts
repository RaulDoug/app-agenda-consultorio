import { getDatabase } from '../src/db/connection.js';
import { getEvolutionClient } from '../src/whatsapp/evolution-client.js';

async function run() {
  const phone = process.argv[2] || '553798231077';
  const patientName = process.argv[3] || 'Usuário Teste';
  const tenantId = '11111111-1111-1111-1111-111111111111';

  console.log(`\n======================================================`);
  console.log(`🤖 Teste Interativo de Confirmação WhatsApp CliniAssist`);
  console.log(`======================================================\n`);
  console.log(`📱 Telefone alvo: ${phone}`);
  console.log(`👤 Nome paciente: ${patientName}`);

  const db = getDatabase();
  const evolutionClient = getEvolutionClient();

  // 1. Cadastra ou busca o paciente no banco
  let patientRes = await db.query(
    `SELECT id, name, whatsapp FROM patients WHERE tenant_id = $1 AND whatsapp = $2 AND deleted_at IS NULL`,
    [tenantId, phone]
  );

  let patientId: string;
  if (patientRes.rows.length === 0) {
    const insertPat = await db.query(
      `INSERT INTO patients (tenant_id, name, whatsapp) VALUES ($1, $2, $3) RETURNING id`,
      [tenantId, patientName, phone]
    );
    patientId = insertPat.rows[0].id;
    console.log(`✔ Paciente cadastrado no PostgreSQL com ID: ${patientId}`);
  } else {
    patientId = patientRes.rows[0].id;
    console.log(`✔ Paciente existente localizado com ID: ${patientId}`);
  }

  // 2. Cria o agendamento de teste para amanhã com status PENDING
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setMinutes(tomorrowEnd.getMinutes() + 30);

  const appRes = await db.query(
    `INSERT INTO appointments (tenant_id, patient_id, start_time, end_time, status)
     VALUES ($1, $2, $3, $4, 'PENDING')
     RETURNING id, status, start_time`,
    [tenantId, patientId, tomorrow.toISOString(), tomorrowEnd.toISOString()]
  );

  const appointmentId = appRes.rows[0].id;
  console.log(`✔ Agendamento criado no banco com ID: ${appointmentId}`);
  console.log(`   Status inicial: PENDING`);
  console.log(`   Horário: ${tomorrow.toLocaleDateString('pt-BR')} às 14:00`);

  // 3. Dispara a mensagem oficial de confirmação via Evolution API
  const textMessage = `Olá ${patientName}! Confirmamos seu agendamento no CliniAssist para amanhã às 14:00? 🦷\n\nResponda:\n1 para Confirmar\n2 para Remarcar`;

  console.log(`\n📤 Enviando mensagem de confirmação para o WhatsApp...`);
  const sendRes = await evolutionClient.sendTextMessage({
    instanceName: 'cliniassist_default',
    number: phone,
    text: textMessage,
  });

  console.log(`✔ Mensagem entregue ao WhatsApp! ID: ${sendRes.id}`);
  console.log(`\n------------------------------------------------------`);
  console.log(`📲 AGORA É COM VOCÊ:`);
  console.log(`Abra o seu WhatsApp no celular e responda: 1`);
  console.log(`------------------------------------------------------\n`);
  console.log(`⏳ Monitorando webhook e atualização de status em tempo real (aguardando resposta)...`);

  // 4. Polling do status no banco por até 60 segundos
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
