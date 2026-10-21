import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { generateTestToken } from '../../middlewares/auth.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { createApp } from '../../app.js';

describe('Feature sincronizacao-financeiro-offline — TDD Spec Anchor', () => {
  let db: IDatabase;
  let testApp: express.Express;

  const tenantA = '11111111-1111-1111-1111-111111111111';
  const tenantB = '22222222-2222-2222-2222-222222222222';
  const tokenTenantA = generateTestToken({ tenant_id: tenantA, user_id: 'user-a' });
  const tokenTenantB = generateTestToken({ tenant_id: tenantB, user_id: 'user-b' });

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);

    await db.query(`INSERT INTO tenants (id, name) VALUES ($1, $2)`, [tenantA, 'Clínica A']);
    await db.query(`INSERT INTO tenants (id, name) VALUES ($1, $2)`, [tenantB, 'Clínica B']);

    testApp = createApp();
  });

  // AC-193: Ingestão e persistência de transações financeiras em lote no backend via POST /api/sync/batch
  it('AC-193: Ingestão e persistência de transações financeiras em lote no backend via POST /api/sync/batch @spec:AC-193', async () => {
    const txId = '44444444-0000-0000-0000-000000000001';
    const batchPayload = {
      mutations: [
        {
          client_mutation_id: 'mut-tx-1',
          entity: 'financial_transactions',
          record_id: txId,
          operation: 'INSERT',
          payload: {
            id: txId,
            type: 'INCOME',
            category: 'ATENDIMENTO',
            description: 'Consulta Dr. Silva',
            amount_cents: 25000,
            payment_method: 'PIX',
            status: 'PAID',
            due_date: '2026-10-21',
            payment_date: '2026-10-21T10:00:00.000Z',
            installment_number: 1,
            total_installments: 1,
            is_active: true,
            created_at: '2026-10-21T10:00:00.000Z',
            updated_at: '2026-10-21T10:00:00.000Z',
          },
          timestamp: '2026-10-21T10:00:00.000Z',
        },
      ],
    };

    const res = await request(testApp)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${tokenTenantA}`)
      .send(batchPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.applied).toBe(1);

    // Valida gravação no banco PostgreSQL
    const checkTx = await db.query(
      `SELECT * FROM financial_transactions WHERE id = $1 AND tenant_id = $2`,
      [txId, tenantA]
    );
    expect(checkTx.rows.length).toBe(1);
    expect(checkTx.rows[0].amount_cents).toBe(25000);
    expect(checkTx.rows[0].status).toBe('PAID');
    expect(checkTx.rows[0].payment_method).toBe('PIX');

    // Isolamento multi-tenant: tenant B não enxerga o registro
    const checkTenantB = await db.query(
      `SELECT * FROM financial_transactions WHERE id = $1 AND tenant_id = $2`,
      [txId, tenantB]
    );
    expect(checkTenantB.rows.length).toBe(0);
  });

  // AC-194: Resolução de conflitos Last-Write-Wins e exclusão lógica de transações financeiras no sync/batch
  it('AC-194: Resolução de conflitos Last-Write-Wins e exclusão lógica de transações financeiras no sync/batch @spec:AC-194', async () => {
    const txId = '44444444-0000-0000-0000-000000000002';
    // 1. Cria transação inicial
    await db.query(
      `INSERT INTO financial_transactions (
        id, tenant_id, type, category, description, amount_cents, payment_method,
        status, due_date, installment_number, total_installments, is_active, created_at, updated_at
      ) VALUES ($1, $2, 'INCOME', 'ATENDIMENTO', 'Parcela 1', 10000, 'PIX', 'PENDING', '2026-11-01', 1, 1, true, $3, $3)`,
      [txId, tenantA, new Date('2026-10-20T10:00:00.000Z').toISOString()]
    );

    // 2. Mutação mais recente de UPDATE (Quitação)
    const updatePayload = {
      mutations: [
        {
          client_mutation_id: 'mut-update-1',
          entity: 'financial_transactions',
          record_id: txId,
          operation: 'UPDATE',
          payload: {
            id: txId,
            status: 'PAID',
            payment_date: '2026-10-21T12:00:00.000Z',
            updated_at: '2026-10-21T12:00:00.000Z',
          },
          timestamp: '2026-10-21T12:00:00.000Z',
        },
      ],
    };

    const resUpdate = await request(testApp)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${tokenTenantA}`)
      .send(updatePayload);

    expect(resUpdate.status).toBe(200);
    expect(resUpdate.body.applied).toBe(1);

    const checkUpdated = await db.query(
      `SELECT status, payment_date FROM financial_transactions WHERE id = $1`,
      [txId]
    );
    expect(checkUpdated.rows[0].status).toBe('PAID');

    // 3. Mutação obsoleta (timestamp anterior) deve ser ignorada por LWW
    const obsoletePayload = {
      mutations: [
        {
          client_mutation_id: 'mut-obsolete',
          entity: 'financial_transactions',
          record_id: txId,
          operation: 'UPDATE',
          payload: {
            id: txId,
            status: 'PENDING',
            updated_at: '2026-10-19T00:00:00.000Z',
          },
        },
      ],
    };

    const resObsolete = await request(testApp)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${tokenTenantA}`)
      .send(obsoletePayload);

    expect(resObsolete.status).toBe(200);
    expect(resObsolete.body.ignored).toBe(1);

    // 4. Exclusão lógica (Soft Delete)
    const deletePayload = {
      mutations: [
        {
          client_mutation_id: 'mut-delete',
          entity: 'financial_transactions',
          record_id: txId,
          operation: 'DELETE',
          payload: {
            id: txId,
            is_active: false,
            deleted_at: '2026-10-21T15:00:00.000Z',
            updated_at: '2026-10-21T15:00:00.000Z',
          },
          timestamp: '2026-10-21T15:00:00.000Z',
        },
      ],
    };

    const resDelete = await request(testApp)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${tokenTenantA}`)
      .send(deletePayload);

    expect(resDelete.status).toBe(200);
    expect(resDelete.body.applied).toBe(1);

    const checkDeleted = await db.query(
      `SELECT is_active, deleted_at FROM financial_transactions WHERE id = $1`,
      [txId]
    );
    expect(checkDeleted.rows[0].is_active).toBe(false);
    expect(checkDeleted.rows[0].deleted_at).not.toBeNull();
  });

  // AC-195: Restauração íntegra de transações financeiras no GET /api/sync/pull após novo login
  it('AC-195: Restauração íntegra de transações financeiras no GET /api/sync/pull após novo login @spec:AC-195', async () => {
    const txId = '44444444-0000-0000-0000-000000000003';
    // 1. Simula envio prévio pelo batch
    await request(testApp)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${tokenTenantA}`)
      .send({
        mutations: [
          {
            client_mutation_id: 'mut-restore-1',
            entity: 'financial_transactions',
            record_id: txId,
            operation: 'INSERT',
            payload: {
              id: txId,
              type: 'INCOME',
              category: 'ATENDIMENTO',
              description: 'Restauração pós-login',
              amount_cents: 35000,
              payment_method: 'CARTAO_CREDITO',
              status: 'PAID',
              due_date: '2026-10-21',
              payment_date: '2026-10-21T08:00:00.000Z',
              installment_number: 1,
              total_installments: 1,
              is_active: true,
              created_at: '2026-10-21T08:00:00.000Z',
              updated_at: '2026-10-21T08:00:00.000Z',
            },
          },
        ],
      });

    // 2. Simula login com pull desde a época zero (como ocorre após o wipe do IndexedDB no logout)
    const pullRes = await request(testApp)
      .get('/api/sync/pull?since=1970-01-01T00:00:00.000Z')
      .set('Authorization', `Bearer ${tokenTenantA}`);

    expect(pullRes.status).toBe(200);
    expect(pullRes.body.financial_transactions).toBeDefined();
    expect(Array.isArray(pullRes.body.financial_transactions)).toBe(true);

    const restoredTx = pullRes.body.financial_transactions.find((t: any) => t.id === txId);
    expect(restoredTx).toBeDefined();
    expect(restoredTx.amount_cents).toBe(35000);
    expect(restoredTx.description).toBe('Restauração pós-login');
  });
});
