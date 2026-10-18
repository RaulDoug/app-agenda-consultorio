import { describe, it, expect } from 'vitest';
import {
  calculateDiscountDistribution,
  generateInstallmentSchedule,
  validateInstallmentPlan,
  validateBusinessHours,
  suggestSmartReturnSlots,
  type BusinessHours,
} from '../index.js';

describe('US-026 — Domínio Compartilhado em @cliniassist/shared para Execução Offline', () => {
  it('AC-048: Disponibilização e validação das regras de negócio em @cliniassist/shared @spec:AC-048', () => {
    // 1. Validação do cálculo de rateio financeiro com O Teste do Centavo
    const discountRes = calculateDiscountDistribution(
      [
        { procedureId: 'p1', priceCents: 10000 },
        { procedureId: 'p2', priceCents: 10000 },
        { procedureId: 'p3', priceCents: 10000 },
      ],
      { discountCents: 10000 }
    );
    expect(discountRes.totalOriginalCents).toBe(30000);
    expect(discountRes.discountAppliedCents).toBe(10000);
    expect(discountRes.totalEffectiveCents).toBe(20000);
    expect(discountRes.items.map((i) => i.effectivePriceCents)).toEqual([6667, 6667, 6666]);

    // 2. Validação do parcelamento inteligente com entrada e virada de mês/ano
    const schedule = generateInstallmentSchedule({
      totalAmountCents: 150000,
      downPaymentCents: 30000,
      installmentsCount: 3,
      firstDueDate: '2026-12-31',
      paymentDate: '2026-10-18',
    });
    expect(schedule).toHaveLength(4);
    expect(schedule[0]).toMatchObject({ installmentNumber: 1, amountCents: 30000, status: 'PAID' });
    expect(schedule[1]).toMatchObject({ installmentNumber: 2, amountCents: 40000, dueDate: '2026-12-31', status: 'PENDING' });
    expect(schedule[2]).toMatchObject({ installmentNumber: 3, amountCents: 40000, dueDate: '2027-01-31', status: 'PENDING' });
    expect(schedule[3]).toMatchObject({ installmentNumber: 4, amountCents: 40000, dueDate: '2027-02-28', status: 'PENDING' });

    // 3. Validação de rejeição de entrada maior ou igual ao total
    expect(() =>
      validateInstallmentPlan({
        totalAmountCents: 10000,
        downPaymentCents: 10000,
        installmentsCount: 2,
      })
    ).toThrow('Valor da entrada não pode ser maior ou igual ao valor total em plano parcelado');

    // 4. Validação de expediente e encaixe
    const businessHours: BusinessHours[] = [
      {
        id: '1',
        tenant_id: 'tenant-1',
        day_of_week: 1, // Segunda
        is_open: true,
        start_time: '08:00',
        end_time: '18:00',
        break_start_time: '12:00',
        break_end_time: '13:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Dentro do horário regular (segunda-feira 09:00 - 10:00)
    const validSlot = validateBusinessHours(
      '2026-10-19T09:00:00',
      '2026-10-19T10:00:00',
      businessHours
    );
    expect(validSlot.allowed).toBe(true);
    expect(validSlot.outside_business_hours).toBe(false);

    // Encaixe fora do expediente (19:00)
    const overtimeSlot = validateBusinessHours(
      '2026-10-19T19:00:00',
      '2026-10-19T19:30:00',
      businessHours,
      { confirm_overtime: true }
    );
    expect(overtimeSlot.allowed).toBe(true);
    expect(overtimeSlot.is_overtime).toBe(true);

    // 5. Validação da busca inteligente de retorno
    const returnSlots = suggestSmartReturnSlots({
      targetDate: '2026-10-19T09:00:00',
      durationMinutes: 30,
      businessHours,
      count: 2,
    });
    expect(returnSlots.length).toBeGreaterThanOrEqual(1);
  });
});
