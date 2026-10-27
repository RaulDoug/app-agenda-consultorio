import { describe, it, expect } from 'vitest';
import { calculateReceivablesProjection } from '../utils/reports-calculator';
import { LocalFinancialTransaction } from '../../../db/types';

describe('ReportsCalculator — Projeção Trimestral de Recebíveis DRE', () => {
  it('AC-203: Projeção trimestral de recebíveis (30, 60 e 90 dias) considerando meses de 31 dias @spec:AC-203', () => {
    // Data base: 26 de Outubro de 2026 (Outubro tem 31 dias, Dezembro tem 31 dias)
    const refDate = new Date(2026, 9, 26, 15, 30, 0); // 26/10/2026

    // Parcelamento em 3x de R$ 300,00 (total R$ 900,00)
    // 1ª parcela: 25/11/2026 (30 dias)
    // 2ª parcela: 25/12/2026 (60 dias)
    // 3ª parcela: 25/01/2027 (91 dias a partir de 26/10/2026 devido a 31 dias em Outubro e Dezembro)
    const transactions: LocalFinancialTransaction[] = [
      {
        id: 'tx-1',
        tenant_id: 'tenant-1',
        type: 'INCOME',
        status: 'PENDING',
        amount_cents: 30000,
        due_date: '2026-11-25',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tx-2',
        tenant_id: 'tenant-1',
        type: 'INCOME',
        status: 'PENDING',
        amount_cents: 30000,
        due_date: '2026-12-25',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tx-3',
        tenant_id: 'tenant-1',
        type: 'INCOME',
        status: 'PENDING',
        amount_cents: 30000,
        due_date: '2027-01-25',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const projection = calculateReceivablesProjection(transactions, refDate);

    // Valida acumulados:
    // Até 30 dias: 1ª parcela = R$ 300,00 (30000 cents)
    expect(projection.pendingNext30Cents).toBe(30000);
    // Até 60 dias: 1ª + 2ª parcela = R$ 600,00 (60000 cents)
    expect(projection.pendingNext60Cents).toBe(60000);
    // Até 90 dias: 1ª + 2ª + 3ª parcela = R$ 900,00 (90000 cents) — não pode ser 60000!
    expect(projection.pendingNext90Cents).toBe(90000);
  });
});

