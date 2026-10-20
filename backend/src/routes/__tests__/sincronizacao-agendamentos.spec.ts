import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { generateTestToken } from '../../middlewares/auth.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { createApp } from '../../app.js';

describe('Sincronização de Agendamentos — Backend Batch Sync', () => {
  let db: IDatabase;
  let testApp: express.Express;

  const tenantA = '11111111-1111-1111-1111-111111111111';
  const tokenTenantA = generateTestToken({ tenant_id: tenantA, user_id: 'user-a' });

  const procId1 = '00000000-0000-0000-0000-000000000001';
  const procId2 = '00000000-0000-0000-0000-000000000002';

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);

    // Configura tenant e procedimentos com UUIDs válidos
    await db.query(`INSERT INTO tenants (id, name) VALUES ($1, $2)`, [tenantA, 'Consultório Teste']);
    await db.query(
      `INSERT INTO procedures (id, tenant_id, name, default_price_cents, default_duration_minutes)
       VALUES ($1, $2, 'Consulta Geral', 15000, 30),
              ($3, $2, 'Profilaxia', 10000, 30)`,
      [procId1, tenantA, procId2]
    );

    testApp = createApp();
  });

  it('AC-166: Backend aceita mutações de agendamentos e itens via POST /api/sync/batch @spec:AC-166', async () => {
    // 1. Cadastra paciente prévio
    const patientId = '11111111-0000-0000-0000-000000000001';
    await db.query(
      `INSERT INTO patients (id, tenant_id, name, whatsapp) VALUES ($1, $2, $3, $4)`,
      [patientId, tenantA, 'Carlos Silva', '5511999998888']
    );

    const appId = '22222222-0000-0000-0000-000000000001';
    const batchPayload = {
      mutations: [
        {
          client_mutation_id: 'mut-1',
          entity: 'appointments',
          record_id: appId,
          operation: 'INSERT',
          payload: {
            id: appId,
            patient_id: patientId,
            start_time: '2026-10-25T14:00:00.000Z',
            end_time: '2026-10-25T14:30:00.000Z',
            status: 'CONFIRMED',
            is_extra_fit: false,
            notes: 'Consulta agendada via mutation',
            items: [
              {
                id: '33333333-0000-0000-0000-000000000001',
                procedure_id: procId1,
                effective_price_cents: 15000,
                duration_minutes: 30,
              },
            ],
          },
          timestamp: '2026-10-20T10:00:00.000Z',
        },
      ],
    };

    const res = await request(testApp)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${tokenTenantA}`)
      .send(batchPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.applied).toBe(1);

    // Valida no PostgreSQL
    const checkApp = await db.query(`SELECT * FROM appointments WHERE id = $1`, [appId]);
    expect(checkApp.rows.length).toBe(1);
    expect(checkApp.rows[0].status).toBe('CONFIRMED');
    expect(checkApp.rows[0].notes).toBe('Consulta agendada via mutation');
  });

  it('AC-167: Persistência atômica de agendamento e múltiplos procedimentos vinculados @spec:AC-167', async () => {
    const patientId = '11111111-0000-0000-0000-000000000002';
    await db.query(
      `INSERT INTO patients (id, tenant_id, name, whatsapp) VALUES ($1, $2, $3, $4)`,
      [patientId, tenantA, 'Mariana Souza', '5511988887777']
    );

    const appId = '22222222-0000-0000-0000-000000000002';
    const batchPayload = {
      mutations: [
        {
          client_mutation_id: 'mut-multi',
          entity: 'appointments',
          record_id: appId,
          operation: 'INSERT',
          payload: {
            id: appId,
            patient_id: patientId,
            start_time: '2026-10-26T09:00:00.000Z',
            end_time: '2026-10-26T10:00:00.000Z',
            status: 'CONFIRMED',
            is_extra_fit: false,
            items: [
              {
                id: '33333333-0000-0000-0000-000000000002',
                procedure_id: procId1,
                effective_price_cents: 15000,
                duration_minutes: 30,
              },
              {
                id: '33333333-0000-0000-0000-000000000003',
                procedure_id: procId2,
                effective_price_cents: 10000,
                duration_minutes: 30,
              },
            ],
          },
        },
      ],
    };

    const res = await request(testApp)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${tokenTenantA}`)
      .send(batchPayload);

    expect(res.status).toBe(200);
    expect(res.body.applied).toBe(1);

    // Verifica persistência de appointment_items vinculados
    const itemsRes = await db.query(
      `SELECT * FROM appointment_items WHERE appointment_id = $1 ORDER BY procedure_id ASC`,
      [appId]
    );
    expect(itemsRes.rows.length).toBe(2);
    expect(itemsRes.rows[0].procedure_id).toBe(procId1);
    expect(itemsRes.rows[1].procedure_id).toBe(procId2);
  });

  it('AC-169: Idempotência em reenvios de lote com mesmo UUID @spec:AC-169', async () => {
    const patientId = '11111111-0000-0000-0000-000000000003';
    await db.query(
      `INSERT INTO patients (id, tenant_id, name, whatsapp) VALUES ($1, $2, $3, $4)`,
      [patientId, tenantA, 'João Idempotente', '5511977776666']
    );

    const appId = '22222222-0000-0000-0000-000000000003';
    const payload = {
      mutations: [
        {
          client_mutation_id: 'mut-idem-1',
          entity: 'appointments',
          record_id: appId,
          operation: 'INSERT',
          payload: {
            id: appId,
            patient_id: patientId,
            start_time: '2026-10-27T11:00:00.000Z',
            end_time: '2026-10-27T11:30:00.000Z',
            status: 'CONFIRMED',
            updated_at: '2026-10-20T12:00:00.000Z',
          },
        },
      ],
    };

    // Primeiro envio
    const res1 = await request(testApp)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${tokenTenantA}`)
      .send(payload);
    expect(res1.body.applied).toBe(1);

    // Segundo envio idêntico (reenvio por instabilidade)
    const res2 = await request(testApp)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${tokenTenantA}`)
      .send(payload);
    expect(res2.body.success).toBe(true);
    expect(res2.body.applied).toBe(0);
    expect(res2.body.ignored).toBe(1);

    // Banco de dados deve ter exatamente 1 registro
    const countRes = await db.query(
      `SELECT COUNT(*) as total FROM appointments WHERE id = $1`,
      [appId]
    );
    expect(Number(countRes.rows[0].total)).toBe(1);
  });

  it('AC-170: Resolução de conflito Last-Write-Wins por updated_at @spec:AC-170', async () => {
    const patientId = '11111111-0000-0000-0000-000000000004';
    await db.query(
      `INSERT INTO patients (id, tenant_id, name, whatsapp) VALUES ($1, $2, $3, $4)`,
      [patientId, tenantA, 'Paciente LWW', '5511966665555']
    );

    const appId = '22222222-0000-0000-0000-000000000004';
    // Estado inicial no servidor
    await db.query(
      `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status, updated_at)
       VALUES ($1, $2, $3, '2026-10-28 10:00:00+00', '2026-10-28 10:30:00+00', 'CONFIRMED', '2026-10-20 10:00:00+00')`,
      [appId, tenantA, patientId]
    );

    // 1. Atualização com updated_at MAIS RECENTE (12:00) -> status CANCELLED deve vencer
    const newerPayload = {
      mutations: [
        {
          client_mutation_id: 'mut-lww-newer',
          entity: 'appointments',
          record_id: appId,
          operation: 'UPDATE',
          payload: {
            id: appId,
            status: 'CANCELLED',
            notes: 'Cancelado pelo paciente',
            updated_at: '2026-10-20T12:00:00.000Z',
          },
        },
      ],
    };

    const resNewer = await request(testApp)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${tokenTenantA}`)
      .send(newerPayload);
    expect(resNewer.body.applied).toBe(1);

    const checkNewer = await db.query(`SELECT status, notes FROM appointments WHERE id = $1`, [appId]);
    expect(checkNewer.rows[0].status).toBe('CANCELLED');
    expect(checkNewer.rows[0].notes).toBe('Cancelado pelo paciente');

    // 2. Atualização com updated_at ATRASADO (09:00) -> não pode sobrescrever a versão de 12:00
    const olderPayload = {
      mutations: [
        {
          client_mutation_id: 'mut-lww-older',
          entity: 'appointments',
          record_id: appId,
          operation: 'UPDATE',
          payload: {
            id: appId,
            status: 'CONFIRMED',
            updated_at: '2026-10-20T09:00:00.000Z',
          },
        },
      ],
    };

    const resOlder = await request(testApp)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${tokenTenantA}`)
      .send(olderPayload);
    expect(resOlder.body.ignored).toBe(1);

    const checkOlder = await db.query(`SELECT status FROM appointments WHERE id = $1`, [appId]);
    expect(checkOlder.rows[0].status).toBe('CANCELLED');
  });

  it('AC-171: Validação de choque de horários e liberação para encaixes @spec:AC-171', async () => {
    const patientId = '11111111-0000-0000-0000-000000000005';
    await db.query(
      `INSERT INTO patients (id, tenant_id, name, whatsapp) VALUES ($1, $2, $3, $4)`,
      [patientId, tenantA, 'Paciente Encaixe', '5511955554444']
    );

    const existingAppId = '22222222-0000-0000-0000-000000000005';
    // Consulta existente das 14:00 às 14:30
    await db.query(
      `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
       VALUES ($1, $2, $3, '2026-10-29 14:00:00+00', '2026-10-29 14:30:00+00', 'CONFIRMED')`,
      [existingAppId, tenantA, patientId]
    );

    // 1. Nova consulta no mesmo intervalo com is_extra_fit = false -> Choque de horário ignorado/conflitante
    const clashId = '22222222-0000-0000-0000-000000000006';
    const clashPayload = {
      mutations: [
        {
          entity: 'appointments',
          record_id: clashId,
          operation: 'INSERT',
          payload: {
            id: clashId,
            patient_id: patientId,
            start_time: '2026-10-29T14:00:00.000Z',
            end_time: '2026-10-29T14:30:00.000Z',
            status: 'CONFIRMED',
            is_extra_fit: false,
          },
        },
      ],
    };

    const resClash = await request(testApp)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${tokenTenantA}`)
      .send(clashPayload);

    expect(resClash.body.ignored).toBe(1);
    expect(resClash.body.conflicts?.[0]?.reason).toBe('DOUBLE_BOOKING_CONFLICT');

    // 2. Nova consulta no mesmo intervalo com is_extra_fit = true -> Encaixe permitido
    const fitId = '22222222-0000-0000-0000-000000000007';
    const extraFitPayload = {
      mutations: [
        {
          entity: 'appointments',
          record_id: fitId,
          operation: 'INSERT',
          payload: {
            id: fitId,
            patient_id: patientId,
            start_time: '2026-10-29T14:00:00.000Z',
            end_time: '2026-10-29T14:30:00.000Z',
            status: 'CONFIRMED',
            is_extra_fit: true,
          },
        },
      ],
    };

    const resFit = await request(testApp)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${tokenTenantA}`)
      .send(extraFitPayload);

    expect(resFit.body.applied).toBe(1);

    const checkFit = await db.query(`SELECT is_overtime FROM appointments WHERE id = $1`, [fitId]);
    expect(checkFit.rows.length).toBe(1);
    expect(checkFit.rows[0].is_overtime).toBe(true);
  });
});
