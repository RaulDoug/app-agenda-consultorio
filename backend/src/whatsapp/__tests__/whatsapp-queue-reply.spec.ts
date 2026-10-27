import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { setEvolutionClient } from '../evolution-client.js';
import { MockEvolutionClient } from './mock-evolution.js';
import { generateTestToken } from '../../middlewares/auth.js';

describe('Feature: Resolução de Resposta e Aviso de Remarcação na Fila WhatsApp — Backend', () => {
  let db: IDatabase;
  let testApp: Express;
  let mockClient: MockEvolutionClient;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const instanceName = 'cliniassist_default';
  const patientPhone = '553798231077';
  let patientId: string;
  let appointmentId: string;
  let authToken: string;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    mockClient = new MockEvolutionClient();
    setEvolutionClient(mockClient);
    testApp = createApp();

    authToken = generateTestToken({ tenant_id: tenantId, user_id: 'user-test-123' });

    await db.query(
      `INSERT INTO tenants (id, name, whatsapp_instance_name, whatsapp_connected)
       VALUES ($1, 'Consultório CliniAssist', $2, true)`,
      [tenantId, instanceName]
    );

    const patRes = await db.query(
      `INSERT INTO patients (tenant_id, name, whatsapp)
       VALUES ($1, 'Ana Clara', $2)
       RETURNING id`,
      [tenantId, patientPhone]
    );
    patientId = patRes.rows[0].id;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0);

    const appRes = await db.query(
      `INSERT INTO appointments (tenant_id, patient_id, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, 'RESCHEDULE_REQUESTED')
       RETURNING id`,
      [tenantId, patientId, tomorrow.toISOString(), new Date(tomorrow.getTime() + 30 * 60000).toISOString()]
    );
    appointmentId = appRes.rows[0].id;

    // Registra mensagem INBOUND do paciente
    await db.query(
      `INSERT INTO whatsapp_messages (tenant_id, appointment_id, patient_id, direction, phone, message_text, status, created_at)
       VALUES ($1, $2, $3, 'INBOUND', $4, 'Quero reagendar minha consulta', 'RECEIVED', $5)`,
      [tenantId, appointmentId, patientId, patientPhone, new Date(Date.now() - 3600000).toISOString()]
    );
  });

  it('deve retornar is_replied = false quando houver inbound sem resposta', async () => {
    const res = await request(testApp)
      .get('/api/whatsapp/queue?startDate=2020-01-01&endDate=2030-01-01')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    const item = res.body.items.find((i: any) => i.appointment_id === appointmentId);
    expect(item).toBeDefined();
    expect(item.last_inbound_text).toBe('Quero reagendar minha consulta');
    expect(item.is_replied).toBe(false);
  });

  it('deve marcar mensagem como respondida via ação mark_resolved', async () => {
    const replyRes = await request(testApp)
      .post(`/api/whatsapp/queue/${appointmentId}/reply`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ action: 'mark_resolved' });

    expect(replyRes.status).toBe(200);
    expect(replyRes.body.success).toBe(true);

    const res = await request(testApp)
      .get('/api/whatsapp/queue?startDate=2020-01-01&endDate=2030-01-01')
      .set('Authorization', `Bearer ${authToken}`);

    const item = res.body.items.find((i: any) => i.appointment_id === appointmentId);
    expect(item.is_replied).toBe(true);
  });

  it('deve disparar confirmação de novo horário via send_notice e marcar como respondido', async () => {
    const replyRes = await request(testApp)
      .post(`/api/whatsapp/queue/${appointmentId}/reply`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ action: 'send_notice' });

    expect(replyRes.status).toBe(200);
    expect(replyRes.body.success).toBe(true);
    expect(replyRes.body.messageText).toContain('reagendada');

    // Verifica se disparou mensagem pelo cliente Evolution
    expect(mockClient.sentMessages.length).toBe(1);
    expect(mockClient.sentMessages[0].number).toBe(patientPhone);

    // Verifica se gravou OUTBOUND no banco
    const msgs = await db.query(
      `SELECT * FROM whatsapp_messages WHERE appointment_id = $1 AND direction = 'OUTBOUND'`,
      [appointmentId]
    );
    expect(msgs.rows.length).toBe(1);

    // Verifica se o item agora consta como respondido
    const res = await request(testApp)
      .get('/api/whatsapp/queue?startDate=2020-01-01&endDate=2030-01-01')
      .set('Authorization', `Bearer ${authToken}`);

    const item = res.body.items.find((i: any) => i.appointment_id === appointmentId);
    expect(item.is_replied).toBe(true);
  });

  it('deve inferir is_replied = true automaticamente quando houver mensagem OUTBOUND posterior ao INBOUND', async () => {
    // Insere OUTBOUND posterior
    await db.query(
      `INSERT INTO whatsapp_messages (tenant_id, appointment_id, patient_id, direction, phone, message_text, status, created_at)
       VALUES ($1, $2, $3, 'OUTBOUND', $4, 'Sua consulta foi remarcada!', 'SENT', $5)`,
      [tenantId, appointmentId, patientId, patientPhone, new Date().toISOString()]
    );

    const res = await request(testApp)
      .get('/api/whatsapp/queue?startDate=2020-01-01&endDate=2030-01-01')
      .set('Authorization', `Bearer ${authToken}`);

    const item = res.body.items.find((i: any) => i.appointment_id === appointmentId);
    expect(item.is_replied).toBe(true);
  });
});
