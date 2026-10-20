import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { generateTestToken } from '../../middlewares/auth.js';
import { setEvolutionClient } from '../../whatsapp/evolution-client.js';
import { MockEvolutionClient } from '../../whatsapp/__tests__/mock-evolution.js';
import { InMemoryConfirmationQueue, setConfirmationQueue } from '../../whatsapp/queue.js';
import { WhatsappSchedulerService } from '../../services/whatsapp-scheduler-service.js';
import { WhatsappRepository } from '../../repositories/whatsapp-repository.js';

describe('Feature: automacao-whatsapp-evolution — Suíte Integrada de Requisitos Spec-Driven', () => {
  let db: IDatabase;
  let testApp: Express;
  let mockClient: MockEvolutionClient;
  let queue: InMemoryConfirmationQueue;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const instanceName = 'sorriso_instance';
  const token = generateTestToken({ tenant_id: tenantId, tv: 0 });

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);

    mockClient = new MockEvolutionClient();
    setEvolutionClient(mockClient);

    queue = new InMemoryConfirmationQueue();
    setConfirmationQueue(queue);

    testApp = createApp();

    await db.query(
      `INSERT INTO tenants (id, name, whatsapp_instance_name, whatsapp_connected, is_active, token_version)
       VALUES ($1, 'Consultório OdontoFlow', $2, true, true, 0)`,
      [tenantId, instanceName]
    );
  });

  describe('US-088 — Agendador Diário Automático e Disparo em Lote de Confirmações', () => {
    it('AC-144: Varredura de consultas pendentes para o dia seguinte e agendamento em lote com jitter anti-ban @spec:AC-144', async () => {
      // 1. Cadastra paciente e consulta para amanhã (D+1)
      const patRes = await db.query(
        `INSERT INTO patients (tenant_id, name, whatsapp) VALUES ($1, 'Marcos Teste', '5511999990001') RETURNING id`,
        [tenantId]
      );
      const patientId = patRes.rows[0].id;

      const tomorrow = new Date('2026-10-21T10:00:00.000Z');
      await db.query(
        `INSERT INTO appointments (tenant_id, patient_id, start_time, end_time, status)
         VALUES ($1, $2, $3, $4, 'PENDING')`,
        [tenantId, patientId, tomorrow.toISOString(), new Date(tomorrow.getTime() + 30 * 60000).toISOString()]
      );

      // 2. Executa varredura de confirmações
      const scheduler = new WhatsappSchedulerService(new WhatsappRepository(db), queue);
      const refDate = new Date('2026-10-20T09:00:00.000-03:00');
      const scanRes = await scheduler.runDailyConfirmationScan(refDate);

      expect(scanRes.processedTenants).toBeGreaterThan(0);
      expect(scanRes.totalScheduled).toBe(1);

      // Valida que o job foi adicionado na fila
      const pendingJobs = await queue.getPendingJobs();
      expect(pendingJobs).toHaveLength(1);
      expect(pendingJobs[0].data.patientName).toBe('Marcos Teste');
    });

    it('AC-145: Disparo manual sob demanda de lote de confirmações via API com idempotência @spec:AC-145', async () => {
      // 1. Cadastra paciente e consulta para amanhã
      const patRes = await db.query(
        `INSERT INTO patients (tenant_id, name, whatsapp) VALUES ($1, 'Paula Lima', '5511999990002') RETURNING id`,
        [tenantId]
      );
      const patientId = patRes.rows[0].id;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(15, 0, 0, 0);

      await db.query(
        `INSERT INTO appointments (tenant_id, patient_id, start_time, end_time, status)
         VALUES ($1, $2, $3, $4, 'PENDING')`,
        [tenantId, patientId, tomorrow.toISOString(), new Date(tomorrow.getTime() + 30 * 60000).toISOString()]
      );

      // 2. Chama endpoint de trigger manual
      const resTrigger = await request(testApp)
        .post('/api/whatsapp/batch-confirmations/trigger')
        .set('Authorization', `Bearer ${token}`)
        .send({ force: false });

      expect(resTrigger.status).toBe(200);
      expect(resTrigger.body.scheduledCount).toBe(1);
      expect(resTrigger.body.enqueuedJobs[0].patientName).toBe('Paula Lima');
    });
  });

  describe('US-089 — Parametrização Dinâmica do WhatsApp por Consultório', () => {
    it('AC-146: Consulta de configurações de WhatsApp por consultório com auto-seed @spec:AC-146', async () => {
      const res = await request(testApp)
        .get('/api/whatsapp/settings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.tenant_id).toBe(tenantId);
      expect(res.body.confirmation_hour).toBe(9);
      expect(res.body.confirmation_days_ahead).toBe(1);
      expect(res.body.auto_reply_enabled).toBe(true);
      expect(res.body.confirmation_message_template).toContain('{nome}');
    });

    it('AC-147: Atualização de templates Spintax e preferências de envio @spec:AC-147', async () => {
      const updatePayload = {
        confirmation_hour: 8,
        confirmation_days_ahead: 2,
        confirmation_message_template: '{Olá|Oi} {nome}, confirmamos sua consulta em {data} às {horario}?',
      };

      const res = await request(testApp)
        .put('/api/whatsapp/settings')
        .set('Authorization', `Bearer ${token}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.confirmation_hour).toBe(8);
      expect(res.body.confirmation_days_ahead).toBe(2);
      expect(res.body.confirmation_message_template).toBe(updatePayload.confirmation_message_template);

      // Confere persistência no banco
      const resGet = await request(testApp)
        .get('/api/whatsapp/settings')
        .set('Authorization', `Bearer ${token}`);

      expect(resGet.body.confirmation_hour).toBe(8);
    });
  });

  describe('US-090 — Registro e Rastreabilidade de Histórico de Comunicações', () => {
    it('AC-148: Persistência de logs de mensagens enviadas e recebidas com status da Evolution API @spec:AC-148', async () => {
      // 1. Envia mensagem avulsa via API
      const resSend = await request(testApp)
        .post('/api/whatsapp/send')
        .set('Authorization', `Bearer ${token}`)
        .send({
          number: '5511988887777',
          text: 'Mensagem de teste de histórico',
        });

      expect(resSend.status).toBe(200);
      expect(resSend.body.success).toBe(true);
      expect(resSend.body.messageId).toBeDefined();

      // 2. Confere no banco se foi gravado na tabela whatsapp_messages
      const dbCheck = await db.query(
        `SELECT * FROM whatsapp_messages WHERE id = $1 AND tenant_id = $2`,
        [resSend.body.messageId, tenantId]
      );

      expect(dbCheck.rows).toHaveLength(1);
      expect(dbCheck.rows[0].direction).toBe('OUTBOUND');
      expect(dbCheck.rows[0].status).toBe('SENT');
      expect(dbCheck.rows[0].message_text).toBe('Mensagem de teste de histórico');
    });

    it('AC-149: Consulta filtrada de histórico de mensagens por agendamento ou paciente @spec:AC-149', async () => {
      const patRes = await db.query(
        `INSERT INTO patients (tenant_id, name, whatsapp) VALUES ($1, 'Beatriz Lima', '5511977778888') RETURNING id`,
        [tenantId]
      );
      const patientId = patRes.rows[0].id;

      // Grava log
      await db.query(
        `INSERT INTO whatsapp_messages (tenant_id, patient_id, direction, phone, message_text, status)
         VALUES ($1, $2, 'OUTBOUND', '5511977778888', 'Mensagem 1', 'SENT')`,
        [tenantId, patientId]
      );

      const res = await request(testApp)
        .get(`/api/whatsapp/messages?patientId=${patientId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].message_text).toBe('Mensagem 1');
    });
  });

  describe('US-091 — Arquitetura em 4 Camadas e Réplica de Acolhimento Humanizada', () => {
    it('AC-150: Desacoplamento estrito em 4 camadas e réplica de acolhimento para dúvidas ou áudios @spec:AC-150', async () => {
      const patientPhone = '5511966665555';
      const patRes = await db.query(
        `INSERT INTO patients (tenant_id, name, whatsapp) VALUES ($1, 'Gabriel Mendes', $2) RETURNING id`,
        [tenantId, patientPhone]
      );
      const patientId = patRes.rows[0].id;

      const appRes = await db.query(
        `INSERT INTO appointments (tenant_id, patient_id, start_time, end_time, status)
         VALUES ($1, $2, '2026-10-25 14:00:00+00', '2026-10-25 14:30:00+00', 'PENDING') RETURNING id`,
        [tenantId, patientId]
      );
      const appointmentId = appRes.rows[0].id;

      // Paciente envia dúvida sobre procedimento
      const webhookPayload = {
        event: 'messages.upsert',
        instance: instanceName,
        data: {
          key: {
            remoteJid: `${patientPhone}@s.whatsapp.net`,
            fromMe: false,
          },
          message: {
            conversation: 'Boa tarde, aceita convênio Uniodonto?',
          },
        },
      };

      const resWebhook = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send(webhookPayload);

      expect(resWebhook.status).toBe(200);
      expect(resWebhook.body.status).toBe('processed');
      expect(resWebhook.body.new_status).toBe('MESSAGE_RECEIVED');
      expect(resWebhook.body.requires_attention).toBe(true);
      expect(resWebhook.body.reply_sent).toBe(true);

      // Valida status no banco
      const appCheck = await db.query(`SELECT status FROM appointments WHERE id = $1`, [appointmentId]);
      expect(appCheck.rows[0].status).toBe('MESSAGE_RECEIVED');

      // Valida réplica de acolhimento enviada
      expect(mockClient.sentMessages.length).toBeGreaterThan(0);
      const lastSent = mockClient.sentMessages[mockClient.sentMessages.length - 1];
      expect(lastSent.number).toBe(patientPhone);
      expect(lastSent.text).toContain('Gabriel');
      expect(lastSent.text).toMatch(/(equipe|atenção|dúvidas)/i);
    });
  });
});
