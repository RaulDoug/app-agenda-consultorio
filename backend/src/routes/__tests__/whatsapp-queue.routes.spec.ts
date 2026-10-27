import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../app.js';
import { generateTestToken } from '../../middlewares/auth.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { setConfirmationQueue, InMemoryConfirmationQueue } from '../../whatsapp/queue.js';
import { setEvolutionClient } from '../../whatsapp/evolution-client.js';
import { MockEvolutionClient } from '../../whatsapp/__tests__/mock-evolution.js';

describe('Rotas da Central de Fila de WhatsApp — /api/whatsapp/queue (T-140)', () => {
  let db: IDatabase;
  let testApp: Express;
  let queue: InMemoryConfirmationQueue;
  let mockClient: MockEvolutionClient;
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const instanceName = 'inst_teste';
  const token = generateTestToken({ tenant_id: tenantId, tv: 0 });
  const patientId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const patientPhone = '5511999998888';
  const appointmentId = '11111111-2222-3333-4444-555555555555';

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    queue = new InMemoryConfirmationQueue();
    setConfirmationQueue(queue);
    mockClient = new MockEvolutionClient();
    setEvolutionClient(mockClient);
    testApp = createApp();

    await db.query(`INSERT INTO tenants (id, name, whatsapp_connected, is_active, whatsapp_instance_name) VALUES ($1, 'Clinica Teste', true, true, $2)`, [tenantId, instanceName]);
    await db.query(`INSERT INTO patients (id, tenant_id, name, whatsapp) VALUES ($1, $2, 'Maria Santos', $3)`, [patientId, tenantId, patientPhone]);
    await db.query(
      `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
       VALUES ($1, $2, $3, '2026-10-28T14:00:00Z', '2026-10-28T14:30:00Z', 'PENDING')`,
      [appointmentId, tenantId, patientId]
    );
  });

  it('GET /api/whatsapp/queue deve retornar a fila categorizada (@spec:AC-209)', async () => {
    const res = await request(testApp)
      .get('/api/whatsapp/queue')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].appointment_id).toBe(appointmentId);
    expect(res.body.items[0].queue_category).toBe('PENDING_QUEUE');
    expect(res.body.counts.total).toBe(1);
    expect(res.body.counts.pending_queue).toBe(1);
  });

  it('POST /api/whatsapp/queue/:appointmentId/send-now dispara envio manual instantâneo e cancela job da fila (@spec:AC-214)', async () => {
    await queue.addJob('confirm-app', {
      appointmentId,
      tenantId,
      instanceName,
      phone: patientPhone,
      patientName: 'Maria Santos',
      appointmentStartTime: '2026-10-28T14:00:00Z',
    });

    const res = await request(testApp)
      .post(`/api/whatsapp/queue/${appointmentId}/send-now`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);

    // Job foi removido da fila do BullMQ
    const pending = await queue.getPendingJobs();
    expect(pending).toHaveLength(0);

    // Mensagem OUTBOUND gravada
    const msgs = await db.query(`SELECT * FROM whatsapp_messages WHERE appointment_id = $1`, [appointmentId]);
    expect(msgs.rows).toHaveLength(1);
    expect(msgs.rows[0].direction).toBe('OUTBOUND');
  });

  it('DELETE /api/whatsapp/queue/:appointmentId exclui da fila de envio automático (@spec:AC-211)', async () => {
    const res = await request(testApp)
      .delete(`/api/whatsapp/queue/${appointmentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);

    const appCheck = await db.query(`SELECT whatsapp_queue_excluded, deleted_at FROM appointments WHERE id = $1`, [appointmentId]);
    expect(appCheck.rows[0].whatsapp_queue_excluded).toBe(true);
    expect(appCheck.rows[0].deleted_at).toBeNull();
  });

  it('PUT /api/whatsapp/queue/:appointmentId/message atualiza a mensagem customizada (@spec:AC-212)', async () => {
    const res = await request(testApp)
      .put(`/api/whatsapp/queue/${appointmentId}/message`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Mensagem VIP personalizada' })
      .expect(200);

    expect(res.body.success).toBe(true);

    const check = await db.query(`SELECT whatsapp_custom_message FROM appointments WHERE id = $1`, [appointmentId]);
    expect(check.rows[0].whatsapp_custom_message).toBe('Mensagem VIP personalizada');
  });

  it('PUT /api/whatsapp/queue/reorder atualiza a sequência dos itens (@spec:AC-213)', async () => {
    const res = await request(testApp)
      .put('/api/whatsapp/queue/reorder')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderedAppointmentIds: [appointmentId] })
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('POST /api/whatsapp/queue/pause pausa e retoma a fila global (@spec:AC-216)', async () => {
    const res1 = await request(testApp)
      .post('/api/whatsapp/queue/pause')
      .set('Authorization', `Bearer ${token}`)
      .send({ paused: true })
      .expect(200);

    expect(res1.body.queue_paused).toBe(true);

    const res2 = await request(testApp)
      .post('/api/whatsapp/queue/pause')
      .set('Authorization', `Bearer ${token}`)
      .send({ paused: false })
      .expect(200);

    expect(res2.body.queue_paused).toBe(false);
  });

  it('POST /api/webhooks/whatsapp processa resposta do paciente após envio manual (@spec:AC-215)', async () => {
    // 1. Simula envio manual
    await request(testApp)
      .post(`/api/whatsapp/queue/${appointmentId}/send-now`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // 2. Webhook recebe resposta "1" do paciente
    const webhookRes = await request(testApp)
      .post('/api/webhooks/whatsapp')
      .send({
        event: 'messages.upsert',
        instance: instanceName,
        data: {
          key: { remoteJid: `${patientPhone}@s.whatsapp.net`, id: 'msg-reply-1', fromMe: false },
          message: { conversation: '1' },
        },
      });

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.new_status).toBe('CONFIRMED');

    // Agendamento no banco virou CONFIRMED
    const appUpdated = await db.query(`SELECT status FROM appointments WHERE id = $1`, [appointmentId]);
    expect(appUpdated.rows[0].status).toBe('CONFIRMED');
  });
});

