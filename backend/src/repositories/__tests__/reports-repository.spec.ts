import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { ReportsRepository } from '../reports-repository.js';

describe('ReportsRepository — Persistência, Agregações SQL e Multi-Tenant', () => {
  let db: IDatabase;
  let repo: ReportsRepository;

  const tenantA = '11111111-1111-1111-1111-111111111111';
  const tenantB = '22222222-2222-2222-2222-222222222222';

  const patient1 = 'aaaaaaaa-1111-aaaa-1111-aaaaaaaaaaaa';
  const patient2 = 'bbbbbbbb-2222-bbbb-2222-bbbbbbbbbbbb';
  const patient3 = 'cccccccc-3333-cccc-3333-cccccccccccc';

  const procA = '11111111-0000-0000-0000-000000000001';
  const procB = '22222222-0000-0000-0000-000000000002';

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    repo = new ReportsRepository(db);

    // Tenants
    await db.query(
      `INSERT INTO tenants (id, name, token_version, is_active, must_change_password)
       VALUES ($1, 'Clínica A', 0, true, false), ($2, 'Clínica B', 0, true, false)`,
      [tenantA, tenantB]
    );

    // Procedimentos: ProcA (preço 20000, custo 5000), ProcB (preço 10000, custo 2000)
    await db.query(
      `INSERT INTO procedures (id, tenant_id, name, default_duration_minutes, default_price_cents, cost_cents)
       VALUES 
       ($1, $3, 'Procedimento Premium', 60, 20000, 5000),
       ($2, $3, 'Procedimento Simples', 30, 10000, 2000)`,
      [procA, procB, tenantA]
    );

    // Pacientes
    await db.query(
      `INSERT INTO patients (id, tenant_id, name, whatsapp, created_at)
       VALUES 
       ($1, $4, 'Paciente Ativo', '5511999991111', '2026-01-01 10:00:00+00'),
       ($2, $4, 'Paciente Faltoso', '5511999992222', '2026-01-01 10:00:00+00'),
       ($3, $4, 'Paciente Inativo', '5511999993333', '2026-01-01 10:00:00+00')`,
      [patient1, patient2, patient3, tenantA]
    );
  });

  describe('getNoShowStats', () => {
    it('deve calcular taxa de faltas e prejuízo estimado respeitando multi-tenant e soft-delete', async () => {
      // 3 consultas no tenant A: 2 COMPLETED, 1 NO_SHOW
      const app1 = '00000000-0000-0000-0001-000000000001';
      const app2 = '00000000-0000-0000-0001-000000000002';
      const app3 = '00000000-0000-0000-0001-000000000003';

      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
         VALUES 
         ($1, $4, $5, '2026-10-10 10:00:00+00', '2026-10-10 11:00:00+00', 'COMPLETED'),
         ($2, $4, $5, '2026-10-11 10:00:00+00', '2026-10-11 11:00:00+00', 'COMPLETED'),
         ($3, $4, $6, '2026-10-12 10:00:00+00', '2026-10-12 11:00:00+00', 'NO_SHOW')`,
        [app1, app2, app3, tenantA, patient1, patient2]
      );

      // Itens da consulta NO_SHOW (Prejuízo: 20000 + 10000 = 30000 centavos)
      await db.query(
        `INSERT INTO appointment_items (appointment_id, procedure_id, effective_price_cents, duration_minutes)
         VALUES ($1, $2, 20000, 60), ($1, $3, 10000, 30)`,
        [app3, procA, procB]
      );

      // Consulta de outro tenant que não deve interferir
      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
         VALUES ('00000000-0000-0000-0001-000000000099', $1, $2, '2026-10-12 10:00:00+00', '2026-10-12 11:00:00+00', 'NO_SHOW')`,
        [tenantB, patient2]
      );

      const stats = await repo.getNoShowStats(tenantA, '2026-10-01', '2026-10-31');
      expect(stats.total_appointments).toBe(3);
      expect(stats.no_show_count).toBe(1);
      expect(stats.no_show_rate).toBeCloseTo(33.33, 2);
      expect(stats.lost_estimated_cents).toBe(30000);
    });

    it('deve retornar 0 quando o tenant não possuir agendamentos no período', async () => {
      const stats = await repo.getNoShowStats(tenantB);
      expect(stats.total_appointments).toBe(0);
      expect(stats.no_show_count).toBe(0);
      expect(stats.no_show_rate).toBe(0);
      expect(stats.lost_estimated_cents).toBe(0);
    });
  });

  describe('getDREStats', () => {
    it('deve consolidar receitas e despesas pagas no regime de caixa, ignorando transações estornadas', async () => {
      // Receitas pagas
      await db.query(
        `INSERT INTO financial_transactions (tenant_id, type, category, amount_cents, status, due_date, payment_date)
         VALUES 
         ($1, 'INCOME', 'Consultas', 50000, 'PAID', '2026-10-05', '2026-10-05'),
         ($1, 'INCOME', 'Consultas', 30000, 'PAID', '2026-10-10', '2026-10-10')`,
        [tenantA]
      );

      // Despesa paga
      await db.query(
        `INSERT INTO financial_transactions (tenant_id, type, category, amount_cents, status, due_date, payment_date)
         VALUES ($1, 'EXPENSE', 'Insumos', 20000, 'PAID', '2026-10-12', '2026-10-12')`,
        [tenantA]
      );

      // Despesa estornada (soft delete)
      await db.query(
        `INSERT INTO financial_transactions (tenant_id, type, category, amount_cents, status, due_date, payment_date, is_active, deleted_at)
         VALUES ($1, 'EXPENSE', 'Cancelada', 15000, 'PAID', '2026-10-12', '2026-10-12', false, CURRENT_TIMESTAMP)`,
        [tenantA]
      );

      const dre = await repo.getDREStats(tenantA, '2026-10-01', '2026-10-31');
      expect(dre.total_income_paid_cents).toBe(80000);
      expect(dre.total_expense_paid_cents).toBe(20000);
      expect(dre.net_profit_cents).toBe(60000);
    });
  });

  describe('getReceivablesStats', () => {
    it('deve projetar recebíveis pendentes para 30, 60 e 90 dias com visão discriminada', async () => {
      const refDate = '2026-10-10';
      // Vencimento em +15 dias (janela 0-30): R$ 100 (10000 centavos)
      // Vencimento em +45 dias (janela 31-60): R$ 200 (20000 centavos)
      // Vencimento em +75 dias (janela 61-90): R$ 300 (30000 centavos)
      await db.query(
        `INSERT INTO financial_transactions (tenant_id, type, category, amount_cents, status, due_date)
         VALUES 
         ($1, 'INCOME', 'Tratamento', 10000, 'PENDING', '2026-10-25'),
         ($1, 'INCOME', 'Tratamento', 20000, 'PENDING', '2026-11-24'),
         ($1, 'INCOME', 'Tratamento', 30000, 'PENDING', '2026-12-24')`,
        [tenantA]
      );

      const proj = await repo.getReceivablesStats(tenantA, refDate);
      expect(proj.pending_next_30_cents).toBe(10000);
      expect(proj.pending_next_60_cents).toBe(30000); // 10000 + 20000
      expect(proj.pending_next_90_cents).toBe(60000); // 10000 + 20000 + 30000
      expect(proj.breakdown.window_0_30_cents).toBe(10000);
      expect(proj.breakdown.window_31_60_cents).toBe(20000);
      expect(proj.breakdown.window_61_90_cents).toBe(30000);
    });
  });

  describe('getProfitableProcedures', () => {
    it('deve ordenar procedimentos pelo lucro líquido total calculado com base no preço e custo', async () => {
      // Consulta 1: ProcA (preço 20000, custo 5000 -> lucro 15000)
      const app1 = '00000000-0000-0000-0002-000000000001';
      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
         VALUES ($1, $2, $3, '2026-10-10 10:00:00+00', '2026-10-10 11:00:00+00', 'COMPLETED')`,
        [app1, tenantA, patient1]
      );
      await db.query(
        `INSERT INTO appointment_items (appointment_id, procedure_id, effective_price_cents, cost_cents, duration_minutes)
         VALUES ($1, $2, 20000, 5000, 60)`,
        [app1, procA]
      );

      // Consulta 2: ProcB realizado 3 vezes (preço 10000, custo 2000 -> lucro 8000 cada, total lucro 24000)
      const app2 = '00000000-0000-0000-0002-000000000002';
      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
         VALUES ($1, $2, $3, '2026-10-11 14:00:00+00', '2026-10-11 15:30:00+00', 'COMPLETED')`,
        [app2, tenantA, patient1]
      );
      await db.query(
        `INSERT INTO appointment_items (appointment_id, procedure_id, effective_price_cents, cost_cents, duration_minutes)
         VALUES 
         ($1, $2, 10000, 2000, 30),
         ($1, $2, 10000, 2000, 30),
         ($1, $2, 10000, 2000, 30)`,
        [app2, procB]
      );

      const ranking = await repo.getProfitableProcedures(tenantA, '2026-10-01', '2026-10-31', 5);
      expect(ranking).toHaveLength(2);

      // 1º Lugar: ProcB (lucro total 24000 > ProcA lucro total 15000)
      expect(ranking[0].procedure_id).toBe(procB);
      expect(ranking[0].completed_count).toBe(3);
      expect(ranking[0].total_revenue_cents).toBe(30000);
      expect(ranking[0].total_cost_cents).toBe(6000);
      expect(ranking[0].total_profit_cents).toBe(24000);
      expect(ranking[0].margin_percentage).toBe(80); // (24000/30000)*100

      // 2º Lugar: ProcA
      expect(ranking[1].procedure_id).toBe(procA);
      expect(ranking[1].completed_count).toBe(1);
      expect(ranking[1].total_revenue_cents).toBe(20000);
      expect(ranking[1].total_cost_cents).toBe(5000);
      expect(ranking[1].total_profit_cents).toBe(15000);
      expect(ranking[1].margin_percentage).toBe(75); // (15000/20000)*100
    });
  });

  describe('getInactivePatients', () => {
    it('deve listar pacientes inativos respeitando o corte temporal e excluindo quem tem consulta futura', async () => {
      const refDate = '2026-10-15';
      // Paciente 3: consulta há mais de 100 dias (2026-06-01) e sem agendamento futuro
      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
         VALUES ('00000000-0000-0000-0003-000000000001', $1, $2, '2026-06-01 10:00:00+00', '2026-06-01 10:30:00+00', 'COMPLETED')`,
        [tenantA, patient3]
      );

      // Paciente 1: consulta recente (2026-10-01) -> Ativo
      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
         VALUES ('00000000-0000-0000-0003-000000000002', $1, $2, '2026-10-01 10:00:00+00', '2026-10-01 10:30:00+00', 'COMPLETED')`,
        [tenantA, patient1]
      );

      // Paciente 2: consulta antiga MAS possui agendamento futuro -> Ativo
      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
         VALUES 
         ('00000000-0000-0000-0003-000000000003', $1, $2, '2026-05-01 10:00:00+00', '2026-05-01 10:30:00+00', 'COMPLETED'),
         ('00000000-0000-0000-0003-000000000004', $1, $2, '2026-11-01 10:00:00+00', '2026-11-01 10:30:00+00', 'CONFIRMED')`,
        [tenantA, patient2]
      );

      const inactives = await repo.getInactivePatients(tenantA, refDate, 90);
      expect(inactives).toHaveLength(1);
      expect(inactives[0].id).toBe(patient3);
      expect(inactives[0].never_consulted).toBe(false);
      expect(inactives[0].days_inactive).toBeGreaterThanOrEqual(90);
    });
  });

  describe('getPatientAppointmentsHistory', () => {
    it('deve retornar a lista cronológica decrescente das consultas do paciente com procedimentos e valores', async () => {
      const app1 = '00000000-0000-0000-0004-000000000001';
      const app2 = '00000000-0000-0000-0004-000000000002';

      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status, total_charged_cents)
         VALUES 
         ($1, $3, $4, '2026-09-01 10:00:00+00', '2026-09-01 11:00:00+00', 'COMPLETED', 20000),
         ($2, $3, $4, '2026-10-01 14:00:00+00', '2026-10-01 14:30:00+00', 'COMPLETED', 10000)`,
        [app1, app2, tenantA, patient1]
      );

      await db.query(
        `INSERT INTO appointment_items (appointment_id, procedure_id, effective_price_cents, duration_minutes)
         VALUES 
         ($1, $3, 20000, 60),
         ($2, $4, 10000, 30)`,
        [app1, app2, procA, procB]
      );

      // Transação financeira vinculada à consulta 2 (Paga)
      await db.query(
        `INSERT INTO financial_transactions (tenant_id, appointment_id, type, category, amount_cents, status, due_date)
         VALUES ($1, $2, 'INCOME', 'Consultas', 10000, 'PAID', '2026-10-01')`,
        [tenantA, app2]
      );

      const history = await repo.getPatientAppointmentsHistory(tenantA, patient1);
      expect(history).toHaveLength(2);

      // Mais recente primeiro (2026-10-01)
      expect(history[0].id).toBe(app2);
      expect(history[0].total_charged_cents).toBe(10000);
      expect(history[0].procedures).toHaveLength(1);
      expect(history[0].procedures[0].name).toBe('Procedimento Simples');
      expect(history[0].financial_status).toBe('PAID');

      // Mais antiga (2026-09-01)
      expect(history[1].id).toBe(app1);
      expect(history[1].procedures[0].name).toBe('Procedimento Premium');
      expect(history[1].financial_status).toBe('NONE');
    });
  });
});
