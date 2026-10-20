import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryDatabase, type IDatabase } from '../../db/connection.js';
import { FinancialRepository } from '../financial-repository.js';
import { AppointmentRepository } from '../appointment-repository.js';
import { PatientRepository } from '../patient-repository.js';
import { ProcedureRepository } from '../procedure-repository.js';
import { seedTestTenant } from '../../test-utils/auth.js';

describe('FinancialRepository — Métricas em Regime de Caixa, Parcelas e Proteção D-06', () => {
  let db: IDatabase;
  let repo: FinancialRepository;
  let tenantId: string;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    repo = new FinancialRepository(db);

    const s = await seedTestTenant(db);
    tenantId = s.id;
  });

  it('deve criar transação com group_id e recuperá-la por ID', async () => {
    const groupId = crypto.randomUUID();
    const tx = await repo.createTransaction({
      tenant_id: tenantId,
      type: 'EXPENSE',
      category: 'Aluguel',
      amount_cents: 150000,
      due_date: '2026-11-01',
      installment_number: 1,
      total_installments: 3,
      group_id: groupId,
    });

    expect(tx.id).toBeDefined();
    expect(tx.group_id).toBe(groupId);

    const found = await repo.findById(tenantId, tx.id);
    expect(found?.group_id).toBe(groupId);
  });

  it('D-03: deve atualizar em lote parcelas pendentes de um grupo preservando parcelas já pagas', async () => {
    const groupId = crypto.randomUUID();

    // Parcela 1: PAGA
    await repo.createTransaction({
      tenant_id: tenantId,
      type: 'EXPENSE',
      category: 'Insumos',
      amount_cents: 10000,
      status: 'PAID',
      due_date: '2026-11-01',
      payment_date: '2026-11-01',
      installment_number: 1,
      total_installments: 3,
      group_id: groupId,
    });

    // Parcela 2: PENDENTE
    const p2 = await repo.createTransaction({
      tenant_id: tenantId,
      type: 'EXPENSE',
      category: 'Insumos',
      amount_cents: 10000,
      status: 'PENDING',
      due_date: '2026-12-01',
      installment_number: 2,
      total_installments: 3,
      group_id: groupId,
    });

    // Parcela 3: PENDENTE
    const p3 = await repo.createTransaction({
      tenant_id: tenantId,
      type: 'EXPENSE',
      category: 'Insumos',
      amount_cents: 10000,
      status: 'PENDING',
      due_date: '2027-01-01',
      installment_number: 3,
      total_installments: 3,
      group_id: groupId,
    });

    // Edição em lote a partir da parcela 2 (novo valor 12000 e categoria atualizada)
    const affected = await repo.updateInstallmentsBatch(tenantId, groupId, 2, {
      amount_cents: 12000,
      category: 'Insumos Cirúrgicos',
    });

    expect(affected).toBe(2);

    const updatedP2 = await repo.findById(tenantId, p2.id);
    expect(updatedP2?.amount_cents).toBe(12000);
    expect(updatedP2?.category).toBe('Insumos Cirúrgicos');

    const updatedP3 = await repo.findById(tenantId, p3.id);
    expect(updatedP3?.amount_cents).toBe(12000);

    // Parcela 1 (PAID) não deve ter sido alterada
    const p1List = await repo.listTransactions(tenantId, { category: 'Insumos' });
    expect(p1List).toHaveLength(1);
    expect(p1List[0].amount_cents).toBe(10000);
  });

  it('D-06: checkIncomeDeletionAllowed deve bloquear exclusão se agendamento estiver concluído e ativo', async () => {
    const patientRepo = new PatientRepository(db);
    const procRepo = new ProcedureRepository(db);
    const appRepo = new AppointmentRepository(db);

    const patient = await patientRepo.create(tenantId, { name: 'Maria', whatsapp: '11999990000' });
    const proc = await procRepo.create(tenantId, { name: 'Canal', default_duration_minutes: 60, default_price_cents: 50000 });
    const app = await appRepo.createWithItems(tenantId, {
      patient_id: patient.id,
      start_time: '2026-11-20T10:00:00.000Z',
      procedure_ids: [proc.id],
    });

    // Conclui o agendamento
    await db.query(`UPDATE appointments SET status = 'COMPLETED' WHERE id = $1`, [app.id]);

    const tx = await repo.createTransaction({
      tenant_id: tenantId,
      appointment_id: app.id,
      type: 'INCOME',
      category: 'Tratamento',
      amount_cents: 50000,
      status: 'PAID',
      due_date: '2026-11-20',
      payment_date: '2026-11-20',
    });

    const allowed = await repo.checkIncomeDeletionAllowed(tenantId, tx.id);
    expect(allowed).toBe(false);

    // Se o agendamento for cancelado, a exclusão da transação passa a ser permitida
    await db.query(`UPDATE appointments SET status = 'CANCELLED' WHERE id = $1`, [app.id]);
    const allowedAfterCancel = await repo.checkIncomeDeletionAllowed(tenantId, tx.id);
    expect(allowedAfterCancel).toBe(true);
  });

  it('D-07: getMetrics deve calcular faturamento recebido, despesas pagas e a receber em Regime de Caixa', async () => {
    const today = new Date().toISOString().slice(0, 10);

    // Receita Paga Hoje: 20000
    await repo.createTransaction({
      tenant_id: tenantId,
      type: 'INCOME',
      category: 'Consulta',
      amount_cents: 20000,
      status: 'PAID',
      due_date: today,
      payment_date: today,
    });

    // Receita Pendente Hoje: 15000
    await repo.createTransaction({
      tenant_id: tenantId,
      type: 'INCOME',
      category: 'Consulta',
      amount_cents: 15000,
      status: 'PENDING',
      due_date: today,
    });

    // Despesa Paga Hoje: 5000
    await repo.createTransaction({
      tenant_id: tenantId,
      type: 'EXPENSE',
      category: 'Material',
      amount_cents: 5000,
      status: 'PAID',
      due_date: today,
      payment_date: today,
    });

    // Despesa Pendente Hoje: 3000
    await repo.createTransaction({
      tenant_id: tenantId,
      type: 'EXPENSE',
      category: 'Material',
      amount_cents: 3000,
      status: 'PENDING',
      due_date: today,
    });

    const metrics = await repo.getMetrics(tenantId, 'today');
    expect(metrics.income_paid_cents).toBe(20000);
    expect(metrics.income_pending_cents).toBe(15000);
    expect(metrics.expenses_paid_cents).toBe(5000);
    expect(metrics.expenses_pending_cents).toBe(3000);
    expect(metrics.net_profit_cents).toBe(15000); // 20000 - 5000
  });
});
