import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryDatabase, type IDatabase } from '../../db/connection.js';
import { AppointmentRepository } from '../appointment-repository.js';
import { PatientRepository } from '../patient-repository.js';
import { ProcedureRepository } from '../procedure-repository.js';
import { seedTestTenant } from '../../test-utils/auth.js';

describe('AppointmentRepository — Múltiplos Procedimentos, Conflitos e Estorno Contábil (D-09)', () => {
  let db: IDatabase;
  let repo: AppointmentRepository;
  let patientRepo: PatientRepository;
  let procedureRepo: ProcedureRepository;
  let tenantId: string;
  let patientId: string;
  let proc1Id: string;
  let proc2Id: string;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    repo = new AppointmentRepository(db);
    patientRepo = new PatientRepository(db);
    procedureRepo = new ProcedureRepository(db);

    const s = await seedTestTenant(db);
    tenantId = s.id;

    const patient = await patientRepo.create(tenantId, {
      name: 'Paciente Teste',
      whatsapp: '11999998888',
    });
    patientId = patient.id;

    const proc1 = await procedureRepo.create(tenantId, {
      name: 'Procedimento 1 (30 min)',
      default_duration_minutes: 30,
      default_price_cents: 10000,
      cost_cents: 2000,
    });
    proc1Id = proc1.id;

    const proc2 = await procedureRepo.create(tenantId, {
      name: 'Procedimento 2 (45 min)',
      default_duration_minutes: 45,
      default_price_cents: 15000,
      cost_cents: 3000,
    });
    proc2Id = proc2.id;
  });

  it('deve criar agendamento somando a duração dos múltiplos procedimentos', async () => {
    const startTime = '2026-11-25T10:00:00.000Z';
    const app = await repo.createWithItems(tenantId, {
      patient_id: patientId,
      start_time: startTime,
      procedure_ids: [proc1Id, proc2Id],
    });

    expect(app).toBeDefined();
    expect(app.items).toHaveLength(2);
    // Duração total: 30 min + 45 min = 75 min
    const expectedEnd = new Date(new Date(startTime).getTime() + 75 * 60000).toISOString();
    expect(new Date(app.end_time).toISOString()).toBe(expectedEnd);
    expect(app.total_charged_cents).toBe(25000);
  });

  it('deve permitir agendamento com valor total zerado (R$ 0,00)', async () => {
    const startTime = '2026-11-25T14:00:00.000Z';
    const app = await repo.createWithItems(
      tenantId,
      {
        patient_id: patientId,
        start_time: startTime,
        procedure_ids: [proc1Id],
      },
      undefined,
      [
        {
          procedure_id: proc1Id,
          effective_price_cents: 0,
          cost_cents: 2000,
          duration_minutes: 30,
        },
      ],
      0
    );

    expect(app.total_charged_cents).toBe(0);
    expect(app.items?.[0].effective_price_cents).toBe(0);
  });

  it('deve detectar conflitos de agendamento em findConflictingAppointments', async () => {
    await repo.createWithItems(tenantId, {
      patient_id: patientId,
      start_time: '2026-11-26T09:00:00.000Z',
      procedure_ids: [proc1Id], // 30 min -> termina 09:30
    });

    // Intervalo que intercepta (09:15 às 09:45)
    const conflicts = await repo.findConflictingAppointments(
      tenantId,
      '2026-11-26T09:15:00.000Z',
      '2026-11-26T09:45:00.000Z'
    );
    expect(conflicts).toHaveLength(1);

    // Intervalo subsequente não-conflitante (09:30 às 10:00)
    const noConflicts = await repo.findConflictingAppointments(
      tenantId,
      '2026-11-26T09:30:00.000Z',
      '2026-11-26T10:00:00.000Z'
    );
    expect(noConflicts).toHaveLength(0);
  });

  it('D-09: deve estornar/desativar automaticamente transações vinculadas ao cancelar ou excluir agendamento concluído', async () => {
    const app = await repo.createWithItems(tenantId, {
      patient_id: patientId,
      start_time: '2026-11-27T10:00:00.000Z',
      procedure_ids: [proc1Id],
    });

    // Simula conclusão da consulta e geração de transações financeiras pagas
    await db.query(`UPDATE appointments SET status = 'COMPLETED' WHERE id = $1`, [app.id]);
    await db.query(
      `INSERT INTO financial_transactions (
        id, tenant_id, appointment_id, type, category, amount_cents, status, due_date, payment_date, is_active
      ) VALUES ($1, $2, $3, 'INCOME', 'Tratamento', 10000, 'PAID', '2026-11-27', '2026-11-27', true)`,
      [crypto.randomUUID(), tenantId, app.id]
    );

    // Executa cancelamento com estorno automático
    const cancelled = await repo.cancelOrDeleteWithFinancialReversal(tenantId, app.id, false);
    expect(cancelled).toBe(true);

    const updatedApp = await repo.findById(tenantId, app.id);
    expect(updatedApp?.status).toBe('CANCELLED');

    // Transação financeira vinculada deve ter sido desativada (soft-deleted) automaticamente
    const txRes = await db.query(
      `SELECT is_active, deleted_at FROM financial_transactions WHERE appointment_id = $1`,
      [app.id]
    );
    expect(txRes.rows[0].is_active).toBe(false);
    expect(txRes.rows[0].deleted_at).not.toBeNull();
  });
});
