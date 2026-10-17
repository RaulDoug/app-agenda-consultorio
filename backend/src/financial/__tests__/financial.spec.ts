import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { calculateDiscountDistribution } from '../calculator.js';
import { generateInstallmentSchedule, validateInstallmentPlan } from '../installments.js';

describe('Motor Financeiro, Rateio de Descontos e Parcelamento — OdontoFlow', () => {
  let db: IDatabase;
  let testApp: Express;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const patientId = '22222222-2222-2222-2222-222222222222';
  const procedureAId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const procedureBId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const procedureCId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    testApp = createApp();

    await db.query(
      `INSERT INTO tenants (id, name) VALUES ($1, $2)`,
      [tenantId, 'Clínica OdontoFlow']
    );

    await db.query(
      `INSERT INTO patients (id, tenant_id, name, whatsapp) VALUES ($1, $2, $3, $4)`,
      [patientId, tenantId, 'Paciente Financeiro', '5511999998888']
    );

    await db.query(
      `INSERT INTO procedures (id, tenant_id, name, default_duration_minutes, default_price_cents)
       VALUES 
       ($1, $2, 'Limpeza', 30, 10000),
       ($3, $2, 'Restauração', 45, 10000),
       ($4, $2, 'Aplicação Flúor', 20, 10000)`,
      [procedureAId, tenantId, procedureBId, procedureCId]
    );
  });

  describe('US-015 — Conclusão de Consulta, Rateio de Descontos e O Teste do Centavo', () => {
    it('AC-027: Rateio proporcional de desconto global e edição individual de itens @spec:AC-027', () => {
      // Exemplo: Item 1 de R$ 120 (12000 centavos) e Item 2 de R$ 80 (8000 centavos) -> Total R$ 200 (20000 centavos)
      // Desconto global de R$ 50 (5000 centavos) -> Total a pagar R$ 150 (15000 centavos)
      // Proporção: Item 1 = 60% de 150 = R$ 90 (9000 centavos), Item 2 = 40% de 150 = R$ 60 (6000 centavos)
      const items = [
        { procedureId: procedureAId, priceCents: 12000 },
        { procedureId: procedureBId, priceCents: 8000 },
      ];

      const result = calculateDiscountDistribution(items, 5000);

      expect(result.totalEffectiveCents).toBe(15000);
      expect(result.items[0].effectivePriceCents).toBe(9000);
      expect(result.items[1].effectivePriceCents).toBe(6000);
      expect(result.items[0].effectivePriceCents + result.items[1].effectivePriceCents).toBe(15000);
    });

    it('AC-028: Resolução da dízima periódica (O Teste do Centavo) sem perdas ou sobras @spec:AC-028', () => {
      // 3 procedimentos de R$ 100 (10000 centavos cada = 30000 total) com desconto total negociado para R$ 200 (20000 total)
      // Divisão 20000 / 3 = 6666.6666...
      // O rateio deve alocar 6667, 6667 e 6666 centavos, fechando a soma em exatamente 20000 centavos
      const items = [
        { procedureId: procedureAId, priceCents: 10000 },
        { procedureId: procedureBId, priceCents: 10000 },
        { procedureId: procedureCId, priceCents: 10000 },
      ];

      const result = calculateDiscountDistribution(items, 10000); // desconto de 10000 centavos -> total 20000

      expect(result.totalEffectiveCents).toBe(20000);
      expect(result.items[0].effectivePriceCents).toBe(6667);
      expect(result.items[1].effectivePriceCents).toBe(6667);
      expect(result.items[2].effectivePriceCents).toBe(6666);

      const sum = result.items.reduce((acc, it) => acc + it.effectivePriceCents, 0);
      expect(sum).toBe(20000);
    });
  });

  describe('US-016 — Parcelamento Inteligente, Entrada e Projeção Mensal', () => {
    it('AC-029: Geração de parcelas com entrada diferenciada e status contábil @spec:AC-029', () => {
      // Total R$ 1500 (150000 centavos), Entrada R$ 300 (30000 centavos) hoje + 3x de R$ 400 (40000 centavos)
      const schedule = generateInstallmentSchedule({
        totalAmountCents: 150000,
        downPaymentCents: 30000,
        installmentsCount: 3, // 3 parcelas restantes (total 4 transações)
        firstDueDate: '2026-11-15',
        paymentDate: '2026-10-17',
      });

      expect(schedule).toHaveLength(4);

      // Entrada: PAID, installment_number 1 de 4
      expect(schedule[0].installmentNumber).toBe(1);
      expect(schedule[0].totalInstallments).toBe(4);
      expect(schedule[0].amountCents).toBe(30000);
      expect(schedule[0].status).toBe('PAID');
      expect(schedule[0].paymentDate).toBe('2026-10-17');

      // Parcelas futuras: PENDING
      expect(schedule[1].installmentNumber).toBe(2);
      expect(schedule[1].amountCents).toBe(40000);
      expect(schedule[1].status).toBe('PENDING');
      expect(schedule[1].dueDate).toBe('2026-11-15');

      expect(schedule[2].installmentNumber).toBe(3);
      expect(schedule[2].amountCents).toBe(40000);
      expect(schedule[2].status).toBe('PENDING');
      expect(schedule[2].dueDate).toBe('2026-12-15');

      expect(schedule[3].installmentNumber).toBe(4);
      expect(schedule[3].amountCents).toBe(40000);
      expect(schedule[3].status).toBe('PENDING');
      expect(schedule[3].dueDate).toBe('2027-01-15');

      const totalSum = schedule.reduce((acc, it) => acc + it.amountCents, 0);
      expect(totalSum).toBe(150000);
    });

    it('AC-030: Projeção mensal de parcelas com ajuste automático para virada de mês (dias 29, 30 e 31) @spec:AC-030', () => {
      // 1ª parcela em 31/01/2027 -> 2ª parcela deve ser 28/02/2027 (ano não bissexto), 3ª em 31/03/2027, 4ª em 30/04/2027
      const schedule = generateInstallmentSchedule({
        totalAmountCents: 40000,
        downPaymentCents: 0,
        installmentsCount: 4,
        firstDueDate: '2027-01-31',
      });

      expect(schedule[0].dueDate).toBe('2027-01-31');
      expect(schedule[1].dueDate).toBe('2027-02-28');
      expect(schedule[2].dueDate).toBe('2027-03-31');
      expect(schedule[3].dueDate).toBe('2027-04-30');
    });

    it('AC-031: Rejeição de entrada maior ou igual ao valor total em cobrança parcelada @spec:AC-031', () => {
      // Se entrada >= total e parcelas > 1 -> Rejeitar com erro de validação
      expect(() => {
        validateInstallmentPlan({
          totalAmountCents: 10000,
          downPaymentCents: 10000,
          installmentsCount: 3,
        });
      }).toThrow('Valor da entrada não pode ser maior ou igual ao valor total em plano parcelado');

      expect(() => {
        validateInstallmentPlan({
          totalAmountCents: 10000,
          downPaymentCents: 12000,
          installmentsCount: 2,
        });
      }).toThrow('Valor da entrada não pode ser maior ou igual ao valor total em plano parcelado');
    });
  });

  describe('US-017 — Baixa de Parcelas e Gestão de Despesas Rápidas', () => {
    it('AC-032: Quitação antecipada e em lote de múltiplas parcelas pendentes @spec:AC-032', async () => {
      const transId1 = '11111111-aaaa-1111-aaaa-111111111111';
      const transId2 = '22222222-bbbb-2222-bbbb-222222222222';

      // 1. Cria 2 parcelas PENDING no banco
      await db.query(
        `INSERT INTO financial_transactions 
         (id, tenant_id, type, category, amount_cents, status, due_date, installment_number, total_installments)
         VALUES 
         ($1, $3, 'INCOME', 'Tratamento', 40000, 'PENDING', '2026-11-15', 2, 3),
         ($2, $3, 'INCOME', 'Tratamento', 40000, 'PENDING', '2026-12-15', 3, 3)`,
        [transId1, transId2, tenantId]
      );

      // 2. Executa baixa em lote via API
      const res = await request(testApp)
        .post('/api/financial/settle-batch')
        .set('x-tenant-id', tenantId)
        .send({
          transactionIds: [transId1, transId2],
          paymentMethod: 'PIX',
          paymentDate: '2026-10-17',
        });

      expect(res.status).toBe(200);
      expect(res.body.settledCount).toBe(2);

      // 3. Checa se ambas viraram PAID com payment_date
      const checkRes = await db.query(
        `SELECT id, status, payment_method, payment_date FROM financial_transactions WHERE id IN ($1, $2)`,
        [transId1, transId2]
      );

      expect(checkRes.rows).toHaveLength(2);
      for (const row of checkRes.rows) {
        expect(row.status).toBe('PAID');
        expect(row.payment_method).toBe('PIX');
        expect(row.payment_date).toBeDefined();
      }
    });

    it('AC-033: Registro e categorização de despesas rápidas de consultório @spec:AC-033', async () => {
      const res = await request(testApp)
        .post('/api/financial/expenses')
        .set('x-tenant-id', tenantId)
        .send({
          category: 'Laboratório Prótese',
          description: 'Coroa cerâmica dente 16',
          amountCents: 25000, // R$ 250,00
          paymentMethod: 'PIX',
          paymentDate: '2026-10-17',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.type).toBe('EXPENSE');
      expect(res.body.amount_cents).toBe(25000);
      expect(res.body.status).toBe('PAID');

      // Verifica no banco
      const check = await db.query(
        `SELECT * FROM financial_transactions WHERE id = $1 AND tenant_id = $2`,
        [res.body.id, tenantId]
      );
      expect(check.rows).toHaveLength(1);
      expect(check.rows[0].category).toBe('Laboratório Prótese');
    });

    it('AC-034: Soft Delete e integridade contábil em cancelamento de transações @spec:AC-034', async () => {
      const expenseId = '99999999-eeee-9999-eeee-999999999999';

      await db.query(
        `INSERT INTO financial_transactions 
         (id, tenant_id, type, category, amount_cents, status, due_date)
         VALUES ($1, $2, 'EXPENSE', 'Material', 15000, 'PAID', '2026-10-17')`,
        [expenseId, tenantId]
      );

      const res = await request(testApp)
        .delete(`/api/financial/transactions/${expenseId}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);

      // Garante que o registro AINDA EXISTE fisicamente (Soft Delete), mas is_active = false
      const physicalCheck = await db.query(
        `SELECT is_active, deleted_at FROM financial_transactions WHERE id = $1`,
        [expenseId]
      );
      expect(physicalCheck.rows).toHaveLength(1);
      expect(physicalCheck.rows[0].is_active).toBe(false);
      expect(physicalCheck.rows[0].deleted_at).toBeDefined();
    });
  });
});
