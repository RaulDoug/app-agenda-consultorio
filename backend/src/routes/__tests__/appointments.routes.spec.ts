import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { seedTestTenant } from '../../test-utils/auth.js';
import { PatientRepository } from '../../repositories/patient-repository.js';
import { ProcedureRepository } from '../../repositories/procedure-repository.js';
import { ScheduleBlockRepository } from '../../repositories/schedule-block-repository.js';

describe('Rotas de Agendamentos — /api/appointments', () => {
  let db: IDatabase;
  let app: Express;
  let token: string;
  let tenantId: string;
  let patientId: string;
  let proc1Id: string;
  let proc2Id: string;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    app = createApp();

    const seeded = await seedTestTenant(db, { must_change_password: false });
    token = seeded.token;
    tenantId = seeded.id;

    const patientRepo = new PatientRepository(db);
    const p = await patientRepo.create(tenantId, { name: 'Paciente Alice', whatsapp: '11988887777' });
    patientId = p.id;

    const procedureRepo = new ProcedureRepository(db);
    const proc1 = await procedureRepo.create(tenantId, {
      name: 'Restauração',
      default_duration_minutes: 30,
      default_price_cents: 20000,
    });
    proc1Id = proc1.id;

    const proc2 = await procedureRepo.create(tenantId, {
      name: 'Aplicação de Flúor',
      default_duration_minutes: 15,
      default_price_cents: 5000,
    });
    proc2Id = proc2.id;
  });

  it('deve rejeitar requisição sem token com 401', async () => {
    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(401);
  });

  it('deve criar agendamento somando a duração e calculando total cobrado', async () => {
    // 2026-11-25 é uma quarta-feira (dia útil aberto)
    const startTime = '2026-11-25T10:00:00.000Z';

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patient_id: patientId,
        start_time: startTime,
        procedure_ids: [proc1Id, proc2Id], // 30 + 15 = 45 min
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.total_charged_cents).toBe(25000);
    expect(res.body.items).toHaveLength(2);

    const expectedEnd = new Date(new Date(startTime).getTime() + 45 * 60000).toISOString();
    expect(res.body.end_time).toBe(expectedEnd);
  });

  it('D-01: deve retornar 409 estruturado com o título do bloqueio ao tentar agendar em horário bloqueado @spec:AC-132', async () => {
    const blockRepo = new ScheduleBlockRepository(db);
    await blockRepo.create(tenantId, {
      title: 'Reunião Geral da Clínica',
      start_time: '2026-11-25T14:00:00.000Z',
      end_time: '2026-11-25T16:00:00.000Z',
    });

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patient_id: patientId,
        start_time: '2026-11-25T14:30:00.000Z',
        procedure_ids: [proc1Id],
        confirm_overtime: false,
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SCHEDULE_BLOCK');
    expect(res.body.block_title).toBe('Reunião Geral da Clínica');
    expect(res.body.error).toContain('Reunião Geral da Clínica');
  });

  it('deve PERMITIR agendar no horário com bloqueio se confirm_overtime = true (Encaixe)', async () => {
    const blockRepo = new ScheduleBlockRepository(db);
    await blockRepo.create(tenantId, {
      title: 'Manutenção Hidráulica',
      start_time: '2026-11-25T14:00:00.000Z',
      end_time: '2026-11-25T16:00:00.000Z',
    });

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patient_id: patientId,
        start_time: '2026-11-25T14:30:00.000Z',
        procedure_ids: [proc1Id],
        confirm_overtime: true, // Encaixe
      });

    expect(res.status).toBe(201);
    expect(res.body.is_overtime).toBe(true);
  });

  it('deve permitir agendamento com desconto total resultando em valor zerado (R$ 0,00)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patient_id: patientId,
        start_time: '2026-11-25T11:00:00.000Z',
        procedure_ids: [proc1Id],
        discount: { type: 'PERCENTAGE', value: 100 },
      });

    expect(res.status).toBe(201);
    expect(res.body.total_charged_cents).toBe(0);
    expect(res.body.items?.[0].effective_price_cents).toBe(0);
  });

  it('D-09: deve realizar soft-delete com estorno contábil automático de transações financeiras vinculadas @spec:AC-133', async () => {
    const postRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patient_id: patientId,
        start_time: '2026-11-25T16:00:00.000Z',
        procedure_ids: [proc1Id],
      });

    const appId = postRes.body.id;

    // Conclui e cria transação financeira vinculada
    await db.query(`UPDATE appointments SET status = 'COMPLETED' WHERE id = $1`, [appId]);
    await db.query(
      `INSERT INTO financial_transactions (
        id, tenant_id, appointment_id, type, category, amount_cents, status, due_date, is_active
      ) VALUES ($1, $2, $3, 'INCOME', 'Tratamento', 20000, 'PAID', '2026-11-25', true)`,
      [crypto.randomUUID(), tenantId, appId]
    );

    const delRes = await request(app)
      .delete(`/api/appointments/${appId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);

    // Consulta de agendamento deve retornar 404
    const getRes = await request(app)
      .get(`/api/appointments/${appId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);

    // Transação financeira vinculada deve ter sido desativada (soft-deleted)
    const tx = await db.query(`SELECT is_active, deleted_at FROM financial_transactions WHERE appointment_id = $1`, [appId]);
    expect(tx.rows[0].is_active).toBe(false);
    expect(tx.rows[0].deleted_at).not.toBeNull();
  });
});
