import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { generateTestToken } from '../../middlewares/auth.js';

describe('Rotas de Relatórios Gerenciais — /api/reports', () => {
  let db: IDatabase;
  let app: Express;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const tenantBId = '22222222-2222-2222-2222-222222222222';
  const token = generateTestToken({ tenant_id: tenantId, tv: 0 });
  const tokenB = generateTestToken({ tenant_id: tenantBId, tv: 0 });

  const patient1Id = 'aaaaaaaa-1111-aaaa-1111-aaaaaaaaaaaa';
  const patient2Id = 'bbbbbbbb-2222-bbbb-2222-bbbbbbbbbbbb';
  const patient3Id = 'cccccccc-3333-cccc-3333-cccccccccccc';

  const procA = '11111111-0000-0000-0000-000000000001';
  const procB = '22222222-0000-0000-0000-000000000002';

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    app = createApp();

    // 1. Tenants
    await db.query(
      `INSERT INTO tenants (id, name, token_version, is_active, must_change_password)
       VALUES ($1, 'Clínica Odonto Prime', 0, true, false), ($2, 'Clínica B', 0, true, false)`,
      [tenantId, tenantBId]
    );

    // 2. Procedimentos: ProcA (preço 20000, custo 5000), ProcB (preço 10000, custo 2000)
    await db.query(
      `INSERT INTO procedures (id, tenant_id, name, default_duration_minutes, default_price_cents, cost_cents)
       VALUES 
       ($1, $3, 'Implante Dentário', 60, 20000, 5000),
       ($2, $3, 'Limpeza Preventiva', 30, 10000, 2000)`,
      [procA, procB, tenantId]
    );

    // 3. Pacientes
    await db.query(
      `INSERT INTO patients (id, tenant_id, name, whatsapp, created_at)
       VALUES 
       ($1, $4, 'Carlos Paciente Ativo', '5511999991111', '2026-01-01 10:00:00+00'),
       ($2, $4, 'Ana Paciente Faltosa', '5511999992222', '2026-01-01 10:00:00+00'),
       ($3, $4, 'Marcos Paciente Inativo', '5511999993333', '2026-01-01 10:00:00+00')`,
      [patient1Id, patient2Id, patient3Id, tenantId]
    );
  });

  it('deve rejeitar requisições sem token de autenticação com 401', async () => {
    const res = await request(app).get('/api/reports/no-show');
    expect(res.status).toBe(401);
  });

  it('AC-137: Consulta de métricas de No-Show com resumo amigável e perda estimada @spec:AC-137', async () => {
    // 3 consultas no período: 2 COMPLETED, 1 NO_SHOW
    const app1 = '00000000-0000-0000-0001-000000000001';
    const app2 = '00000000-0000-0000-0001-000000000002';
    const app3 = '00000000-0000-0000-0001-000000000003';

    await db.query(
      `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
       VALUES 
       ($1, $4, $5, '2026-10-10 10:00:00+00', '2026-10-10 11:00:00+00', 'COMPLETED'),
       ($2, $4, $5, '2026-10-11 10:00:00+00', '2026-10-11 11:00:00+00', 'COMPLETED'),
       ($3, $4, $6, '2026-10-12 10:00:00+00', '2026-10-12 11:00:00+00', 'NO_SHOW')`,
      [app1, app2, app3, tenantId, patient1Id, patient2Id]
    );

    // Consulta NO_SHOW contém 1 ProcA (20000) e 1 ProcB (10000) -> perda 30000
    await db.query(
      `INSERT INTO appointment_items (appointment_id, procedure_id, effective_price_cents, duration_minutes)
       VALUES ($1, $2, 20000, 60), ($1, $3, 10000, 30)`,
      [app3, procA, procB]
    );

    const res = await request(app)
      .get('/api/reports/no-show')
      .set('Authorization', `Bearer ${token}`)
      .query({ startDate: '2026-10-01', endDate: '2026-10-31' });

    expect(res.status).toBe(200);
    expect(res.body.total_appointments).toBe(3);
    expect(res.body.no_show_count).toBe(1);
    expect(res.body.no_show_rate).toBeCloseTo(33.33, 2);
    expect(res.body.summary).toBe('1 de 3 consultas');
    expect(res.body.lost_estimated_cents).toBe(30000);
    expect(res.body.lost_estimated_reais).toContain('300');
  });

  it('AC-138: Cálculo de receitas, despesas, lucro líquido e margem de lucro no período @spec:AC-138', async () => {
    // Receitas pagas: 50000 + 30000 = 80000
    await db.query(
      `INSERT INTO financial_transactions (tenant_id, type, category, amount_cents, status, due_date, payment_date)
       VALUES 
       ($1, 'INCOME', 'Consultas', 50000, 'PAID', '2026-10-05', '2026-10-05'),
       ($1, 'INCOME', 'Consultas', 30000, 'PAID', '2026-10-10', '2026-10-10')`,
      [tenantId]
    );

    // Despesa paga: 20000
    await db.query(
      `INSERT INTO financial_transactions (tenant_id, type, category, amount_cents, status, due_date, payment_date)
       VALUES ($1, 'EXPENSE', 'Insumos', 20000, 'PAID', '2026-10-12', '2026-10-12')`,
      [tenantId]
    );

    const res = await request(app)
      .get('/api/reports/dre')
      .set('Authorization', `Bearer ${token}`)
      .query({ startDate: '2026-10-01', endDate: '2026-10-31' });

    expect(res.status).toBe(200);
    expect(res.body.total_income_paid_cents).toBe(80000);
    expect(res.body.total_expense_paid_cents).toBe(20000);
    expect(res.body.net_profit_cents).toBe(60000);
    expect(res.body.margin_percentage).toBe(75.0); // (60000/80000)*100
  });

  it('AC-139: Projeção de contas a receber pendentes em 30, 60 e 90 dias @spec:AC-139', async () => {
    const refDate = '2026-10-10';
    await db.query(
      `INSERT INTO financial_transactions (tenant_id, type, category, amount_cents, status, due_date)
       VALUES 
       ($1, 'INCOME', 'Parcela 1', 10000, 'PENDING', '2026-10-25'),
       ($1, 'INCOME', 'Parcela 2', 20000, 'PENDING', '2026-11-20'),
       ($1, 'INCOME', 'Parcela 3', 30000, 'PENDING', '2026-12-20')`,
      [tenantId]
    );

    const res = await request(app)
      .get('/api/reports/receivables')
      .set('Authorization', `Bearer ${token}`)
      .query({ referenceDate: refDate });

    expect(res.status).toBe(200);
    expect(res.body.pending_next_30_cents).toBe(10000);
    expect(res.body.pending_next_60_cents).toBe(30000);
    expect(res.body.pending_next_90_cents).toBe(60000);
    expect(res.body.breakdown.window_0_30_cents).toBe(10000);
    expect(res.body.breakdown.window_31_60_cents).toBe(20000);
    expect(res.body.breakdown.window_61_90_cents).toBe(30000);
  });

  it('AC-140: Ranking de rentabilidade de procedimentos baseado em receita menos custo operacional @spec:AC-140', async () => {
    const app1 = '00000000-0000-0000-0002-000000000001';
    const app2 = '00000000-0000-0000-0002-000000000002';

    await db.query(
      `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
       VALUES 
       ($1, $3, $4, '2026-10-10 10:00:00+00', '2026-10-10 11:00:00+00', 'COMPLETED'),
       ($2, $3, $4, '2026-10-11 14:00:00+00', '2026-10-11 15:00:00+00', 'COMPLETED')`,
      [app1, app2, tenantId, patient1Id]
    );

    // ProcA: Preço 20000, Custo 5000 -> Lucro 15000
    await db.query(
      `INSERT INTO appointment_items (appointment_id, procedure_id, effective_price_cents, cost_cents, duration_minutes)
       VALUES ($1, $2, 20000, 5000, 60)`,
      [app1, procA]
    );

    // ProcB: Realizado 2x. Preço 10000, Custo 2000 cada -> Lucro 8000 cada, total lucro 16000
    await db.query(
      `INSERT INTO appointment_items (appointment_id, procedure_id, effective_price_cents, cost_cents, duration_minutes)
       VALUES 
       ($1, $2, 10000, 2000, 30),
       ($1, $2, 10000, 2000, 30)`,
      [app2, procB]
    );

    const res = await request(app)
      .get('/api/reports/procedures-profitability')
      .set('Authorization', `Bearer ${token}`)
      .query({ limit: 5 });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);

    // 1º Lugar: ProcB (lucro total 16000)
    expect(res.body.items[0].procedure_id).toBe(procB);
    expect(res.body.items[0].total_profit_cents).toBe(16000);
    expect(res.body.items[0].margin_percentage).toBe(80.0);

    // 2º Lugar: ProcA (lucro total 15000)
    expect(res.body.items[1].procedure_id).toBe(procA);
    expect(res.body.items[1].total_profit_cents).toBe(15000);
    expect(res.body.items[1].margin_percentage).toBe(75.0);
  });

  it('AC-141: Listagem de pacientes inativos com corte temporal de 3 meses e 6 meses @spec:AC-141', async () => {
    const refDate = '2026-10-15';
    // Paciente 3 (Marcos): Consulta concluída há 120 dias (2026-06-15) e sem consulta futura -> Inativo para corte de 3 meses (90 dias)
    await db.query(
      `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
       VALUES ('00000000-0000-0000-0003-000000000001', $1, $2, '2026-06-15 10:00:00+00', '2026-06-15 10:30:00+00', 'COMPLETED')`,
      [tenantId, patient3Id]
    );

    // Paciente 1 (Carlos): Consulta recente -> Ativo
    await db.query(
      `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
       VALUES ('00000000-0000-0000-0003-000000000002', $1, $2, '2026-10-01 10:00:00+00', '2026-10-01 10:30:00+00', 'COMPLETED')`,
      [tenantId, patient1Id]
    );

    // Teste com filtro de 3 meses (90 dias)
    const res3m = await request(app)
      .get('/api/reports/inactive-patients')
      .set('Authorization', `Bearer ${token}`)
      .query({ months: '3', referenceDate: refDate });

    expect(res3m.status).toBe(200);
    expect(res3m.body.filter_months).toBe(3);
    expect(res3m.body.patients.some((p: any) => p.id === patient3Id)).toBe(true);

    // Teste com filtro de 6 meses (180 dias) -> Marcos consultou há 120 dias, logo NÃO deve estar inativo para 6 meses
    const res6m = await request(app)
      .get('/api/reports/inactive-patients')
      .set('Authorization', `Bearer ${token}`)
      .query({ months: '6', referenceDate: refDate });

    expect(res6m.status).toBe(200);
    expect(res6m.body.filter_months).toBe(6);
    expect(res6m.body.patients.some((p: any) => p.id === patient3Id)).toBe(false);
  });

  it('AC-142: Histórico cronológico detalhado de consultas de um paciente @spec:AC-142', async () => {
    const app1 = '00000000-0000-0000-0004-000000000001';
    const app2 = '00000000-0000-0000-0004-000000000002';

    await db.query(
      `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status, total_charged_cents)
       VALUES 
       ($1, $3, $4, '2026-08-01 10:00:00+00', '2026-08-01 11:00:00+00', 'COMPLETED', 20000),
       ($2, $3, $4, '2026-09-01 14:00:00+00', '2026-09-01 14:30:00+00', 'COMPLETED', 10000)`,
      [app1, app2, tenantId, patient1Id]
    );

    await db.query(
      `INSERT INTO appointment_items (appointment_id, procedure_id, effective_price_cents, duration_minutes)
       VALUES 
       ($1, $3, 20000, 60),
       ($2, $4, 10000, 30)`,
      [app1, app2, procA, procB]
    );

    // Transação financeira da consulta 2 paga
    await db.query(
      `INSERT INTO financial_transactions (tenant_id, appointment_id, type, category, amount_cents, status, due_date)
       VALUES ($1, $2, 'INCOME', 'Consultas', 10000, 'PAID', '2026-09-01')`,
      [tenantId, app2]
    );

    const res = await request(app)
      .get(`/api/reports/patient-history/${patient1Id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.patient_id).toBe(patient1Id);
    expect(res.body.summary.total_appointments).toBe(2);
    expect(res.body.summary.completed_count).toBe(2);
    expect(res.body.summary.total_spent_cents).toBe(30000);
    expect(res.body.appointments).toHaveLength(2);
    expect(res.body.appointments[0].id).toBe(app2); // Mais recente
    expect(res.body.appointments[0].financial_status).toBe('PAID');
    expect(res.body.appointments[1].id).toBe(app1); // Mais antiga
  });

  it('AC-143: Resolução determinística dos períodos hoje, este mês, últimos 30 dias e todos @spec:AC-143', async () => {
    // Testa chamada passando period=today
    const resToday = await request(app)
      .get('/api/reports/no-show')
      .set('Authorization', `Bearer ${token}`)
      .query({ period: 'today' });
    expect(resToday.status).toBe(200);

    // Testa chamada passando period=this_month
    const resMonth = await request(app)
      .get('/api/reports/dre')
      .set('Authorization', `Bearer ${token}`)
      .query({ period: 'this_month' });
    expect(resMonth.status).toBe(200);

    // Testa chamada passando period=last_30_days
    const res30d = await request(app)
      .get('/api/reports/procedures-profitability')
      .set('Authorization', `Bearer ${token}`)
      .query({ period: 'last_30_days' });
    expect(res30d.status).toBe(200);
    expect(res30d.body.period).toBe('last_30_days');

    // Testa chamada passando period=all
    const resAll = await request(app)
      .get('/api/reports/no-show')
      .set('Authorization', `Bearer ${token}`)
      .query({ period: 'all' });
    expect(resAll.status).toBe(200);
  });
});
