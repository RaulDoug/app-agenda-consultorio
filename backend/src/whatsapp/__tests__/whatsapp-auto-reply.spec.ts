import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { setEvolutionClient, EvolutionTransientError } from '../evolution-client.js';
import { MockEvolutionClient } from './mock-evolution.js';

describe('Feature: Réplica Automática de Confirmação e Remarcação no WhatsApp — Backend', () => {
  let db: IDatabase;
  let testApp: Express;
  let mockClient: MockEvolutionClient;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const instanceName = 'cliniassist_default';
  const patientPhone = '553798231077';
  let patientId: string;
  let appointmentId: string;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    mockClient = new MockEvolutionClient();
    setEvolutionClient(mockClient);
    testApp = createApp();

    await db.query(
      `INSERT INTO tenants (id, name, whatsapp_instance_name, whatsapp_connected)
       VALUES ($1, 'Consultório CliniAssist', $2, true)`,
      [tenantId, instanceName]
    );

    const patRes = await db.query(
      `INSERT INTO patients (tenant_id, name, whatsapp)
       VALUES ($1, 'Carlos Silva', $2)
       RETURNING id`,
      [tenantId, patientPhone]
    );
    patientId = patRes.rows[0].id;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const appRes = await db.query(
      `INSERT INTO appointments (tenant_id, patient_id, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING id`,
      [tenantId, patientId, tomorrow.toISOString(), new Date(tomorrow.getTime() + 30 * 60000).toISOString()]
    );
    appointmentId = appRes.rows[0].id;
  });

  describe('US-052 — Réplica Automática de Confirmação e Remarcação para o Paciente', () => {
    it('AC-086: Envio de réplica humanizada de confirmação ao receber resposta positiva @spec:AC-086', async () => {
      const webhookPayload = {
        event: 'messages.upsert',
        instance: instanceName,
        data: {
          key: {
            remoteJid: `${patientPhone}@s.whatsapp.net`,
            fromMe: false,
          },
          message: {
            conversation: '1',
          },
        },
      };

      const res = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('processed');
      expect(res.body.new_status).toBe('CONFIRMED');
      expect(res.body.reply_sent).toBe(true);

      // Valida que o agendamento no PostgreSQL foi atualizado para CONFIRMED
      const checkDb = await db.query(`SELECT status FROM appointments WHERE id = $1`, [appointmentId]);
      expect(checkDb.rows[0].status).toBe('CONFIRMED');

      // Valida que a réplica foi enviada pelo MockEvolutionClient
      expect(mockClient.sentMessages.length).toBe(1);
      const sent = mockClient.sentMessages[0];
      expect(sent.instanceName).toBe(instanceName);
      expect(sent.number).toBe(patientPhone);
      expect(sent.text).toMatch(/Carlos/);
      expect(sent.text).toMatch(/confirmad[ao]/i);
    });

    it('AC-087: Envio de réplica humanizada de remarcação ao receber resposta negativa @spec:AC-087', async () => {
      const webhookPayload = {
        event: 'messages.upsert',
        instance: instanceName,
        data: {
          key: {
            remoteJid: `${patientPhone}@s.whatsapp.net`,
            fromMe: false,
          },
          message: {
            conversation: '2',
          },
        },
      };

      const res = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('processed');
      expect(res.body.new_status).toBe('RESCHEDULE_REQUESTED');
      expect(res.body.reply_sent).toBe(true);

      // Valida que o agendamento no PostgreSQL foi atualizado para RESCHEDULE_REQUESTED
      const checkDb = await db.query(`SELECT status FROM appointments WHERE id = $1`, [appointmentId]);
      expect(checkDb.rows[0].status).toBe('RESCHEDULE_REQUESTED');

      // Valida que a mensagem de remarcação foi disparada
      expect(mockClient.sentMessages.length).toBe(1);
      const sent = mockClient.sentMessages[0];
      expect(sent.instanceName).toBe(instanceName);
      expect(sent.number).toBe(patientPhone);
      expect(sent.text).toMatch(/Carlos/);
      expect(sent.text).toMatch(/remarcação/i);
    });

    it('AC-088: Resiliência no envio da réplica sem impactar a gravação no banco de dados @spec:AC-088', async () => {
      // Simula falha transitória na Evolution API no momento do disparo
      mockClient.sendTextMessage = async () => {
        throw new EvolutionTransientError('Evolution API indisponível temporariamente', 503);
      };

      const webhookPayload = {
        event: 'messages.upsert',
        instance: instanceName,
        data: {
          key: {
            remoteJid: `${patientPhone}@s.whatsapp.net`,
            fromMe: false,
          },
          message: {
            conversation: '1',
          },
        },
      };

      const res = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send(webhookPayload);

      // Webhook responde 200 OK informando processamento, mesmo com falha no envio da réplica
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('processed');
      expect(res.body.new_status).toBe('CONFIRMED');
      expect(res.body.reply_sent).toBe(false);

      // O agendamento no banco NÃO sofreu rollback e foi devidamente atualizado para CONFIRMED
      const checkDb = await db.query(`SELECT status FROM appointments WHERE id = $1`, [appointmentId]);
      expect(checkDb.rows[0].status).toBe('CONFIRMED');
    });

    it('AC-222: Bloqueio de réplicas automáticas repetidas no mesmo dia para o mesmo paciente @spec:AC-222', async () => {
      // 1. Paciente envia 1ª mensagem hoje (dúvida)
      const payload1 = {
        event: 'messages.upsert',
        instance: instanceName,
        data: {
          key: {
            remoteJid: `${patientPhone}@s.whatsapp.net`,
            fromMe: false,
          },
          message: {
            conversation: 'Olá, qual o valor da limpeza?',
          },
        },
      };

      const res1 = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send(payload1);

      expect(res1.status).toBe(200);
      expect(res1.body.reply_sent).toBe(true);
      expect(res1.body.reply_suppressed_daily_limit).toBe(false);
      expect(mockClient.sentMessages.length).toBe(1);

      // 2. Paciente envia 2ª mensagem 1 minuto depois no mesmo dia
      const payload2 = {
        event: 'messages.upsert',
        instance: instanceName,
        data: {
          key: {
            remoteJid: `${patientPhone}@s.whatsapp.net`,
            fromMe: false,
          },
          message: {
            conversation: 'Vocês atendem Unimed também?',
          },
        },
      };

      const res2 = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send(payload2);

      expect(res2.status).toBe(200);
      expect(res2.body.reply_sent).toBe(false);
      expect(res2.body.reply_suppressed_daily_limit).toBe(true);
      // O mockClient NÃO deve ter recebido nenhuma nova mensagem enviada (continua 1)
      expect(mockClient.sentMessages.length).toBe(1);

      // 3. Valida que a 2ª mensagem recebida foi gravada normalmente no histórico (INBOUND)
      const msgsInbound = await db.query(
        `SELECT message_text FROM whatsapp_messages WHERE patient_id = $1 AND direction = 'INBOUND' ORDER BY created_at ASC`,
        [patientId]
      );
      expect(msgsInbound.rows.length).toBe(2);
      expect(msgsInbound.rows[1].message_text).toBe('Vocês atendem Unimed também?');
    });

    it('AC-223: Liberação do envio de réplica automática no dia seguinte e distinção de lembrete da fila @spec:AC-223', async () => {
      // 1. Simula que a clínica enviou o lembrete da fila hoje (OUTBOUND com is_auto_reply = false)
      await db.query(
        `INSERT INTO whatsapp_messages (tenant_id, patient_id, appointment_id, direction, phone, message_text, status, is_auto_reply)
         VALUES ($1, $2, $3, 'OUTBOUND', $4, 'Confirmamos seu agendamento?', 'SENT', false)`,
        [tenantId, patientId, appointmentId, patientPhone]
      );

      // 2. Paciente responde ao lembrete pela 1ª vez hoje pedindo reagendamento
      const payloadReschedule = {
        event: 'messages.upsert',
        instance: instanceName,
        data: {
          key: {
            remoteJid: `${patientPhone}@s.whatsapp.net`,
            fromMe: false,
          },
          message: {
            conversation: 'Não poderei ir, preciso remarcar',
          },
        },
      };

      const resReschedule = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send(payloadReschedule);

      expect(resReschedule.status).toBe(200);
      expect(resReschedule.body.new_status).toBe('RESCHEDULE_REQUESTED');
      // Deve ter enviado a réplica normalmente mesmo após o lembrete da fila
      expect(resReschedule.body.reply_sent).toBe(true);
      expect(mockClient.sentMessages.length).toBe(1);

      // 3. Paciente envia nova mensagem complementar em seguida ("Pode ser na próxima semana?")
      const payloadFollowUp = {
        event: 'messages.upsert',
        instance: instanceName,
        data: {
          key: {
            remoteJid: `${patientPhone}@s.whatsapp.net`,
            fromMe: false,
          },
          message: {
            conversation: 'Pode ser na próxima semana?',
          },
        },
      };

      const resFollowUp = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send(payloadFollowUp);

      expect(resFollowUp.status).toBe(200);
      // Status permanece RESCHEDULE_REQUESTED (não sofre downgrade)
      expect(resFollowUp.body.new_status).toBe('RESCHEDULE_REQUESTED');
      // Réplica suprimida pelo limite diário
      expect(resFollowUp.body.reply_sent).toBe(false);
      expect(resFollowUp.body.reply_suppressed_daily_limit).toBe(true);
      expect(mockClient.sentMessages.length).toBe(1);
    });
  });
});
