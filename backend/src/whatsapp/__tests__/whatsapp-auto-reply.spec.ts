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
  });
});
