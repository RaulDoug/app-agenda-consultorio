import { describe, it, expect, beforeEach } from 'vitest';
import { WhatsappRepository } from '../whatsapp-repository.js';
import { createInMemoryDatabase, type IDatabase } from '../../db/connection.js';
import { InMemoryConfirmationQueue } from '../../whatsapp/queue.js';

describe('WhatsappRepository — Central de Fila de WhatsApp (T-139)', () => {
  let db: IDatabase;
  let repo: WhatsappRepository;
  const tenantA = '11111111-1111-1111-1111-111111111111';
  const tenantB = '22222222-2222-2222-2222-222222222222';
  const patient1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const patient2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const patientB = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const app1 = '11111111-2222-3333-4444-555555555555';
  const app2 = '22222222-3333-4444-5555-666666666666';
  const appB = '33333333-4444-5555-6666-777777777777';

  beforeEach(async () => {
    db = createInMemoryDatabase();
    repo = new WhatsappRepository(db);

    // Setup tenants
    await db.query(`INSERT INTO tenants (id, name, whatsapp_connected) VALUES ($1, 'Tenant A', true)`, [tenantA]);
    await db.query(`INSERT INTO tenants (id, name, whatsapp_connected) VALUES ($1, 'Tenant B', true)`, [tenantB]);

    // Setup patients
    await db.query(`INSERT INTO patients (id, tenant_id, name, whatsapp) VALUES ($1, $2, 'Paciente Um', '11999999999')`, [patient1, tenantA]);
    await db.query(`INSERT INTO patients (id, tenant_id, name, whatsapp) VALUES ($1, $2, 'Paciente Dois', '11888888888')`, [patient2, tenantA]);
    await db.query(`INSERT INTO patients (id, tenant_id, name, whatsapp) VALUES ($1, $2, 'Paciente Outro Tenant', '11777777777')`, [patientB, tenantB]);
  });

  it('deve listar itens da fila com categorização, subqueries de mensagem e isolamento multi-tenant (@spec:AC-209)', async () => {
    const today = new Date('2026-10-28T10:00:00Z');
    await db.query(
      `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status, whatsapp_queue_order)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', 2)`,
      [app1, tenantA, patient1, today.toISOString(), new Date('2026-10-28T10:30:00Z').toISOString()]
    );
    await db.query(
      `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status, whatsapp_queue_order)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', 1)`,
      [app2, tenantA, patient2, today.toISOString(), new Date('2026-10-28T10:30:00Z').toISOString()]
    );
    // Agendamento do outro tenant
    await db.query(
      `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
      [appB, tenantB, patientB, today.toISOString(), new Date('2026-10-28T10:30:00Z').toISOString()]
    );

    const items = await repo.findQueueAppointments(tenantA, {
      startDate: new Date('2026-10-28T00:00:00Z'),
      endDate: new Date('2026-10-28T23:59:59Z'),
    });

    expect(items).toHaveLength(2);
    expect(items[0].appointment_id).toBe(app2); // queue_order 1 vem antes de queue_order 2
    expect(items[1].appointment_id).toBe(app1);
    expect(items.find((i) => i.appointment_id === appB)).toBeUndefined();
  });

  it('deve excluir logicamente da fila marcando whatsapp_queue_excluded sem deletar agendamento (@spec:AC-211)', async () => {
    const today = new Date('2026-10-28T10:00:00Z');
    await db.query(
      `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
      [app1, tenantA, patient1, today.toISOString(), new Date('2026-10-28T10:30:00Z').toISOString()]
    );

    await repo.excludeFromQueue(tenantA, app1);

    const check = await db.query(`SELECT whatsapp_queue_excluded, deleted_at FROM appointments WHERE id = $1`, [app1]);
    expect(check.rows[0].whatsapp_queue_excluded).toBe(true);
    expect(check.rows[0].deleted_at).toBeNull();
  });

  it('deve persistir mensagem customizada individual para a consulta (@spec:AC-212)', async () => {
    const today = new Date('2026-10-28T10:00:00Z');
    await db.query(
      `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
      [app1, tenantA, patient1, today.toISOString(), new Date('2026-10-28T10:30:00Z').toISOString()]
    );

    await repo.updateCustomMessage(tenantA, app1, 'Olá Fulano, seu horário especial é às 10h.');

    const check = await db.query(`SELECT whatsapp_custom_message FROM appointments WHERE id = $1`, [app1]);
    expect(check.rows[0].whatsapp_custom_message).toBe('Olá Fulano, seu horário especial é às 10h.');
  });

  it('deve atualizar a ordem dos itens na fila (@spec:AC-213)', async () => {
    const today = new Date('2026-10-28T10:00:00Z');
    await db.query(
      `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
      [app1, tenantA, patient1, today.toISOString(), new Date('2026-10-28T10:30:00Z').toISOString()]
    );
    await db.query(
      `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
      [app2, tenantA, patient2, today.toISOString(), new Date('2026-10-28T10:30:00Z').toISOString()]
    );

    await repo.updateQueueOrder(tenantA, [app2, app1]);

    const check1 = await db.query(`SELECT whatsapp_queue_order FROM appointments WHERE id = $1`, [app1]);
    const check2 = await db.query(`SELECT whatsapp_queue_order FROM appointments WHERE id = $1`, [app2]);
    expect(check2.rows[0].whatsapp_queue_order).toBe(1);
    expect(check1.rows[0].whatsapp_queue_order).toBe(2);
  });

  it('deve permitir cancelar job na fila em memória por appointmentId', async () => {
    const queue = new InMemoryConfirmationQueue();
    await queue.addJob('job-1', {
      appointmentId: app1,
      tenantId: tenantA,
      instanceName: 'inst',
      phone: '11999999999',
      patientName: 'Test',
      appointmentStartTime: new Date().toISOString(),
    });

    const removed = await queue.removeJobByAppointmentId(app1);
    expect(removed).toBe(true);

    const pending = await queue.getPendingJobs();
    expect(pending).toHaveLength(0);
  });
});
