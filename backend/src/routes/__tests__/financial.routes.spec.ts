import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { seedTestTenant } from '../../test-utils/auth.js';
import { PatientRepository } from '../../repositories/patient-repository.js';
import { ProcedureRepository } from '../../repositories/procedure-repository.js';
import { AppointmentRepository } from '../../repositories/appointment-repository.js';

describe('Rotas Financeiras — /api/financial (Checkout, Categorias, Despesas, Métricas e Proteções)', () => {
  let db: IDatabase;
  let app: any;
  let tenantId: string;
  let token: string;
  let patientId: string;
  let procId: string;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    app = createApp();

    const s = await seedTestTenant(db);
    tenantId = s.id;
    token = s.token;

    const patientRepo = new PatientRepository(db);
    const procRepo = new ProcedureRepository(db);

    const p = await patientRepo.create(tenantId, { name: 'João Financeiro', whatsapp: '11988887777' });
    patientId = p.id;

    const proc = await procRepo.create(tenantId, {
      name: 'Implante Dentário',
      default_duration_minutes: 60,
      default_price_cents: 120000,
      cost_cents: 30000,
    });
    procId = proc.id;
  });

  it('deve rejeitar chamadas sem token com 401', async () => {
    const res = await request(app).get('/api/financial/transactions');
    expect(res.status).toBe(401);
  });

  it('deve listar e auto-seed categorias padrão em GET /api/financial/categories', async () => {
    const res = await request(app)
      .get('/api/financial/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    const names = res.body.map((c: any) => c.name);
    expect(names).toContain('Aluguel');
    expect(names).toContain('Tratamento Odontológico');
  });

  it('deve criar nova categoria financeira em POST /api/financial/categories', async () => {
    const res = await request(app)
      .post('/api/financial/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Laboratório de Prótese',
        type: 'EXPENSE',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Laboratório de Prótese');
  });

  it('D-04: deve registrar despesa recorrente de 3 meses gerando grupo e parcelas subsequentes PENDING @spec:AC-134', async () => {
    const res = await request(app)
      .post('/api/financial/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Energia Elétrica',
        amountCents: 45000,
        status: 'PAID',
        dueDate: '2026-11-05',
        is_recurring: true,
        recurrence_months: 3,
      });

    expect(res.status).toBe(201);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(3);

    // Parcela 1 PAGA
    expect(res.body[0].status).toBe('PAID');
    expect(res.body[0].installment_number).toBe(1);

    // Parcela 2 PENDENTE
    expect(res.body[1].status).toBe('PENDING');
    expect(res.body[1].installment_number).toBe(2);

    // Todas possuem o mesmo group_id
    expect(res.body[0].group_id).toBeDefined();
    expect(res.body[0].group_id).toBe(res.body[1].group_id);
  });

  it('D-03: deve atualizar parcelas pendentes com scope = ALL @spec:AC-135', async () => {
    // Cria despesa parcelada em 2x
    const postRes = await request(app)
      .post('/api/financial/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Material Descartável',
        amountCents: 20000,
        status: 'PENDING',
        dueDate: '2026-11-10',
        installments_count: 2,
        installment_division_mode: 'DIVIDE',
      });

    const p1 = postRes.body[0];
    const p2 = postRes.body[1];

    // Atualiza com scope = ALL
    const putRes = await request(app)
      .put(`/api/financial/transactions/${p1.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Material Cirúrgico Especial',
        scope: 'ALL',
      });

    expect(putRes.status).toBe(200);

    // Consulta transações para conferir que p2 também recebeu a nova categoria
    const listRes = await request(app)
      .get('/api/financial/transactions')
      .set('Authorization', `Bearer ${token}`);

    const updatedP2 = listRes.body.find((t: any) => t.id === p2.id);
    expect(updatedP2.category).toBe('Material Cirúrgico Especial');
  });

  it('D-06: deve proibir exclusão de receita vinculada a agendamento concluído ativo retornando HTTP 400 LINKED_COMPLETED_APPOINTMENT', async () => {
    const appRepo = new AppointmentRepository(db);
    const appointment = await appRepo.createWithItems(tenantId, {
      patient_id: patientId,
      start_time: '2026-11-20T10:00:00.000Z',
      procedure_ids: [procId],
    });

    // Realiza checkout
    const checkoutRes = await request(app)
      .post('/api/financial/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        appointmentId: appointment.id,
        items: [{ procedureId: procId, priceCents: 120000 }],
        paymentPlan: {
          installmentsCount: 1,
          paymentMethod: 'PIX',
        },
      });

    expect(checkoutRes.status).toBe(200);
    const txId = checkoutRes.body.transactions[0].id;

    // Tentativa de deletar receita vinculada a agendamento concluído
    const delRes = await request(app)
      .delete(`/api/financial/transactions/${txId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(400);
    expect(delRes.body.code).toBe('LINKED_COMPLETED_APPOINTMENT');
    expect(delRes.body.error).toContain('Não é permitido excluir transação financeira vinculada a um agendamento concluído');
  });

  it('D-07: GET /api/financial/metrics deve retornar faturamento recebido, despesas e saldo líquido em Regime de Caixa @spec:AC-136', async () => {
    const today = new Date().toISOString().slice(0, 10);

    // Cria uma receita paga hoje: 100000 (R$ 1.000,00)
    await request(app)
      .post('/api/financial/expenses') // mock de receita via inserção direta
      .set('Authorization', `Bearer ${token}`);

    await db.query(
      `INSERT INTO financial_transactions (
        id, tenant_id, type, category, amount_cents, status, due_date, payment_date, is_active
      ) VALUES ($1, $2, 'INCOME', 'Tratamento', 100000, 'PAID', $3, $3, true)`,
      [crypto.randomUUID(), tenantId, today]
    );

    // Cria uma despesa paga hoje: 30000 (R$ 300,00)
    await request(app)
      .post('/api/financial/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Insumos',
        amountCents: 30000,
        status: 'PAID',
        dueDate: today,
        paymentDate: today,
      });

    const metricsRes = await request(app)
      .get('/api/financial/metrics?period=today')
      .set('Authorization', `Bearer ${token}`);

    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.income_paid_cents).toBe(100000);
    expect(metricsRes.body.expenses_paid_cents).toBe(30000);
    expect(metricsRes.body.net_profit_cents).toBe(70000); // 100000 - 30000 = 70000 (R$ 700,00)
  });
});
