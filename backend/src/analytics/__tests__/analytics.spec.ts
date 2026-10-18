import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';

describe('Queries Analíticas e Relatórios Gerenciais — OdontoFlow', () => {
  let db: IDatabase;
  let testApp: Express;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const tenantBId = '22222222-2222-2222-2222-222222222222';

  const patient1Id = 'aaaaaaaa-1111-aaaa-1111-aaaaaaaaaaaa';
  const patient2Id = 'bbbbbbbb-2222-bbbb-2222-bbbbbbbbbbbb';
  const patient3Id = 'cccccccc-3333-cccc-3333-cccccccccccc';

  const procLimpezaId = '11111111-0000-0000-0000-000000000001';
  const procRestauracaoId = '22222222-0000-0000-0000-000000000002';
  const procImplanteId = '33333333-0000-0000-0000-000000000003';

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    testApp = createApp();

    // 1. Tenants
    await db.query(`INSERT INTO tenants (id, name) VALUES ($1, $2), ($3, $4)`, [
      tenantId, 'Clínica Dr. Silva',
      tenantBId, 'Clínica Dra. Santos'
    ]);

    // 2. Procedimentos
    await db.query(
      `INSERT INTO procedures (id, tenant_id, name, default_duration_minutes, default_price_cents)
       VALUES 
       ($1, $4, 'Limpeza Preventiva', 30, 15000),
       ($2, $4, 'Restauração Resina', 45, 25000),
       ($3, $4, 'Implante Dentário', 90, 150000)`,
      [procLimpezaId, procRestauracaoId, procImplanteId, tenantId]
    );

    // 3. Pacientes
    await db.query(
      `INSERT INTO patients (id, tenant_id, name, whatsapp)
       VALUES 
       ($1, $4, 'Carlos Paciente Ativo', '5511999991111'),
       ($2, $4, 'Ana Paciente Faltosa', '5511999992222'),
       ($3, $4, 'Marcos Paciente Inativo', '5511999993333')`,
      [patient1Id, patient2Id, patient3Id, tenantId]
    );
  });

  describe('US-018 — Indicadores Operacionais e Taxa de Faltas (No-Show)', () => {
    it('AC-035: Cálculo exato da taxa de no-show e montante financeiro perdido @spec:AC-035', async () => {
      // Cria 10 agendamentos no período:
      // 8 consultas normais (COMPLETED ou CONFIRMED)
      // 2 consultas NO_SHOW (totalizando R$ 300 = 30000 centavos)
      for (let i = 1; i <= 8; i++) {
        const appId = `00000000-0000-0000-0001-${String(i).padStart(12, '0')}`;
        await db.query(
          `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
           VALUES ($1, $2, $3, '2026-10-10 10:00:00+00', '2026-10-10 10:30:00+00', 'COMPLETED')`,
          [appId, tenantId, patient1Id]
        );
      }

      // Faltas (NO_SHOW):
      // Falta 1: Limpeza (15000 centavos)
      const appNoShow1 = '00000000-0000-0000-0002-000000000001';
      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
         VALUES ($1, $2, $3, '2026-10-11 14:00:00+00', '2026-10-11 14:30:00+00', 'NO_SHOW')`,
        [appNoShow1, tenantId, patient2Id]
      );
      await db.query(
        `INSERT INTO appointment_items (appointment_id, procedure_id, effective_price_cents, duration_minutes)
         VALUES ($1, $2, 15000, 30)`,
        [appNoShow1, procLimpezaId]
      );

      // Falta 2: Limpeza (15000 centavos)
      const appNoShow2 = '00000000-0000-0000-0002-000000000002';
      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
         VALUES ($1, $2, $3, '2026-10-12 15:00:00+00', '2026-10-12 15:30:00+00', 'NO_SHOW')`,
        [appNoShow2, tenantId, patient2Id]
      );
      await db.query(
        `INSERT INTO appointment_items (appointment_id, procedure_id, effective_price_cents, duration_minutes)
         VALUES ($1, $2, 15000, 30)`,
        [appNoShow2, procLimpezaId]
      );

      // Consulta métricas
      const res = await request(testApp)
        .get('/api/analytics/no-show')
        .set('x-tenant-id', tenantId)
        .query({ startDate: '2026-10-01', endDate: '2026-10-31' });

      expect(res.status).toBe(200);
      expect(res.body.total_appointments).toBe(10);
      expect(res.body.no_show_count).toBe(2);
      expect(res.body.no_show_rate).toBe(20.0);
      expect(res.body.lost_estimated_cents).toBe(30000);
    });

    it('AC-036: Resiliência a clínica nova (zero agendamentos sem divisão por zero) @spec:AC-036', async () => {
      // Sem nenhum agendamento para o tenantB
      const res = await request(testApp)
        .get('/api/analytics/no-show')
        .set('x-tenant-id', tenantBId)
        .query({ startDate: '2026-10-01', endDate: '2026-10-31' });

      expect(res.status).toBe(200);
      expect(res.body.total_appointments).toBe(0);
      expect(res.body.no_show_count).toBe(0);
      expect(res.body.no_show_rate).toBe(0);
      expect(res.body.lost_estimated_cents).toBe(0);
    });
  });

  describe('US-019 — DRE Simplificado e Projeção de Fluxo de Caixa', () => {
    it('AC-037: Totalizador de receitas pagas, despesas e lucro líquido no período @spec:AC-037', async () => {
      // Receitas pagas: R$ 500 (50000 centavos) e R$ 300 (30000 centavos) = 80000
      await db.query(
        `INSERT INTO financial_transactions (tenant_id, type, category, amount_cents, status, due_date, payment_date)
         VALUES 
         ($1, 'INCOME', 'Tratamento', 50000, 'PAID', '2026-10-05', '2026-10-05'),
         ($1, 'INCOME', 'Tratamento', 30000, 'PAID', '2026-10-10', '2026-10-10')`,
        [tenantId]
      );

      // Despesa paga: R$ 250 (25000 centavos)
      await db.query(
        `INSERT INTO financial_transactions (tenant_id, type, category, amount_cents, status, due_date, payment_date)
         VALUES ($1, 'EXPENSE', 'Laboratório', 25000, 'PAID', '2026-10-12', '2026-10-12')`,
        [tenantId]
      );

      // Despesa estornada (Soft Delete): R$ 10000 (NÃO deve ser somada)
      await db.query(
        `INSERT INTO financial_transactions (tenant_id, type, category, amount_cents, status, due_date, payment_date, is_active, deleted_at)
         VALUES ($1, 'EXPENSE', 'Cancelada', 10000, 'PAID', '2026-10-12', '2026-10-12', false, CURRENT_TIMESTAMP)`,
        [tenantId]
      );

      const res = await request(testApp)
        .get('/api/analytics/dre')
        .set('x-tenant-id', tenantId)
        .query({ startDate: '2026-10-01', endDate: '2026-10-31' });

      expect(res.status).toBe(200);
      expect(res.body.total_income_paid_cents).toBe(80000);
      expect(res.body.total_expense_paid_cents).toBe(25000);
      expect(res.body.net_profit_cents).toBe(55000);
    });

    it('AC-038: Projeção de contas a receber pendentes em janelas de 30, 60 e 90 dias @spec:AC-038', async () => {
      // Considera data de referência 2026-10-18:
      // +10 dias (dentro de 30 dias): R$ 400 (40000 centavos)
      // +45 dias (dentro de 60 dias): R$ 600 (60000 centavos)
      // +75 dias (dentro de 90 dias): R$ 800 (80000 centavos)
      // +120 dias (fora dos 90 dias): R$ 1000 (100000 centavos)
      await db.query(
        `INSERT INTO financial_transactions (tenant_id, type, category, amount_cents, status, due_date)
         VALUES 
         ($1, 'INCOME', 'Tratamento', 40000, 'PENDING', '2026-10-28'),
         ($1, 'INCOME', 'Tratamento', 60000, 'PENDING', '2026-12-02'),
         ($1, 'INCOME', 'Tratamento', 80000, 'PENDING', '2027-01-02'),
         ($1, 'INCOME', 'Tratamento', 100000, 'PENDING', '2027-02-18')`,
        [tenantId]
      );

      const res = await request(testApp)
        .get('/api/analytics/cash-flow')
        .set('x-tenant-id', tenantId)
        .query({ referenceDate: '2026-10-18' });

      expect(res.status).toBe(200);
      expect(res.body.pending_next_30_cents).toBe(40000);
      expect(res.body.pending_next_60_cents).toBe(100000); // 40000 + 60000
      expect(res.body.pending_next_90_cents).toBe(180000); // 40000 + 60000 + 80000
    });
  });

  describe('US-020 — Inteligência Comercial e Retenção de Pacientes', () => {
    it('AC-039: Ranking de procedimentos mais rentáveis por receita efetiva @spec:AC-039', async () => {
      // 1. Consulta 1: 1 Implante (150000 centavos) -> COMPLETED
      const app1 = '00000000-0000-0000-0003-000000000001';
      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
         VALUES ($1, $2, $3, '2026-10-01 09:00:00+00', '2026-10-01 10:30:00+00', 'COMPLETED')`,
        [app1, tenantId, patient1Id]
      );
      await db.query(
        `INSERT INTO appointment_items (appointment_id, procedure_id, effective_price_cents, duration_minutes)
         VALUES ($1, $2, 150000, 90)`,
        [app1, procImplanteId]
      );

      // 2. Consulta 2: 2 Restaurações (25000 cada = 50000 total) -> COMPLETED
      const app2 = '00000000-0000-0000-0003-000000000002';
      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
         VALUES ($1, $2, $3, '2026-10-02 11:00:00+00', '2026-10-02 12:00:00+00', 'COMPLETED')`,
        [app2, tenantId, patient1Id]
      );
      await db.query(
        `INSERT INTO appointment_items (appointment_id, procedure_id, effective_price_cents, duration_minutes)
         VALUES ($1, $2, 25000, 30), ($1, $2, 25000, 30)`,
        [app2, procRestauracaoId]
      );

      // 3. Consulta 3: 1 Limpeza (15000 centavos) -> CANCELLED (NÃO deve entrar no ranking)
      const app3 = '00000000-0000-0000-0003-000000000003';
      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
         VALUES ($1, $2, $3, '2026-10-03 14:00:00+00', '2026-10-03 14:30:00+00', 'CANCELLED')`,
        [app3, tenantId, patient1Id]
      );
      await db.query(
        `INSERT INTO appointment_items (appointment_id, procedure_id, effective_price_cents, duration_minutes)
         VALUES ($1, $2, 15000, 30)`,
        [app3, procLimpezaId]
      );

      const res = await request(testApp)
        .get('/api/analytics/procedures-ranking')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);

      // 1º Lugar: Implante Dentário (150000)
      expect(res.body[0].procedure_id).toBe(procImplanteId);
      expect(res.body[0].total_effective_price_cents).toBe(150000);
      expect(res.body[0].completed_count).toBe(1);

      // 2º Lugar: Restauração Resina (50000)
      expect(res.body[1].procedure_id).toBe(procRestauracaoId);
      expect(res.body[1].total_effective_price_cents).toBe(50000);
      expect(res.body[1].completed_count).toBe(2);
    });

    it('AC-040: Identificação de pacientes inativos há mais de 180 dias sem agendamento futuro @spec:AC-040', async () => {
      // Paciente 3 (Marcos): Última consulta concluída há 200 dias (2026-04-01) e SEM agendamento futuro
      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
         VALUES ('00000000-0000-0000-0004-000000000001', $1, $2, '2026-04-01 10:00:00+00', '2026-04-01 10:30:00+00', 'COMPLETED')`,
        [tenantId, patient3Id]
      );

      // Paciente 1 (Carlos): Última consulta concluída recente (2026-10-10) -> NÃO é inativo
      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
         VALUES ('00000000-0000-0000-0004-000000000002', $1, $2, '2026-10-10 10:00:00+00', '2026-10-10 10:30:00+00', 'COMPLETED')`,
        [tenantId, patient1Id]
      );

      // Paciente 2 (Ana): Consulta antiga há 200 dias MAS possui consulta futura marcada -> NÃO é inativo
      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
         VALUES 
         ('00000000-0000-0000-0004-000000000003', $1, $2, '2026-03-01 10:00:00+00', '2026-03-01 10:30:00+00', 'COMPLETED'),
         ('00000000-0000-0000-0004-000000000004', $1, $2, '2026-11-20 10:00:00+00', '2026-11-20 10:30:00+00', 'CONFIRMED')`,
        [tenantId, patient2Id]
      );

      // Paciente 4 (Juliana): Cadastrada há mais de 180 dias (2026-01-10) e NUNCA se consultou
      const patient4Id = '00000000-0000-0000-0002-000000000004';
      await db.query(
        `INSERT INTO patients (id, tenant_id, name, whatsapp, created_at)
         VALUES ($1, $2, 'Juliana Sem Consulta', '5511999994444', '2026-01-10 10:00:00+00')`,
        [patient4Id, tenantId]
      );

      // Paciente 5 (Pedro): Cadastrado recentemente (2026-10-15) sem consultas -> NÃO é inativo
      const patient5Id = '00000000-0000-0000-0002-000000000005';
      await db.query(
        `INSERT INTO patients (id, tenant_id, name, whatsapp, created_at)
         VALUES ($1, $2, 'Pedro Recém Cadastrado', '5511999995555', '2026-10-15 10:00:00+00')`,
        [patient5Id, tenantId]
      );

      const res = await request(testApp)
        .get('/api/analytics/inactive-patients')
        .set('x-tenant-id', tenantId)
        .query({ referenceDate: '2026-10-18', inactiveDays: 180 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);

      // Paciente com consulta anterior há mais de 180 dias
      const marcos = res.body.find((p: any) => p.id === patient3Id);
      expect(marcos).toBeDefined();
      expect(marcos.name).toBe('Marcos Paciente Inativo');
      expect(marcos.never_consulted).toBe(false);
      expect(marcos.last_appointment_date).toBeDefined();

      // Paciente que nunca se consultou cadastrado há mais de 180 dias
      const juliana = res.body.find((p: any) => p.id === patient4Id);
      expect(juliana).toBeDefined();
      expect(juliana.name).toBe('Juliana Sem Consulta');
      expect(juliana.never_consulted).toBe(true);
      expect(juliana.last_appointment_date).toBeNull();
    });
  });
});
