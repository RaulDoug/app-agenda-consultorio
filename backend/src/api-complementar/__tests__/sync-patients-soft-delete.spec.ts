import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { generateTestToken } from '../../middlewares/auth.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { createApp } from '../../app.js';

describe('Sync Patients — Soft-Delete e Preservação de deleted_at', () => {
  let db: IDatabase;
  let testApp: express.Express;

  const tenantId = '11111111-2222-3333-4444-555555555555';
  const tokenTenant = generateTestToken({ tenant_id: tenantId, user_id: 'user-admin' });

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);

    await db.query(`INSERT INTO tenants (id, name) VALUES ($1, $2)`, [tenantId, 'Clínica Odonto Teste']);
    testApp = createApp();
  });

  it('AC-200: Soft-delete de pacientes no endpoint /api/sync/batch preservando deleted_at e is_active no PostgreSQL @spec:AC-200', async () => {
    const patientId = '99999999-0000-0000-0000-000000000001';

    // 1. Cria o paciente no banco via sync inicial
    const insertPayload = {
      mutations: [
        {
          client_mutation_id: 'mut-pat-1',
          entity: 'patients',
          record_id: patientId,
          operation: 'INSERT',
          payload: {
            id: patientId,
            name: 'Mariana Costa',
            whatsapp: '11988776655',
            notes: 'Alérgica a dipirona',
            is_active: true,
            created_at: '2026-10-26T10:00:00.000Z',
            updated_at: '2026-10-26T10:00:00.000Z',
          },
          timestamp: '2026-10-26T10:00:00.000Z',
        },
      ],
    };

    const resInsert = await request(testApp)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${tokenTenant}`)
      .send(insertPayload);

    expect(resInsert.status).toBe(200);
    expect(resInsert.body.applied).toBe(1);

    // Valida paciente ativo no banco
    const beforeCheck = await db.query(`SELECT is_active, deleted_at FROM patients WHERE id = $1`, [patientId]);
    expect(beforeCheck.rows[0].is_active).toBe(true);
    expect(beforeCheck.rows[0].deleted_at).toBeNull();

    // 2. Envia mutação de exclusão (DELETE) gerada pelo frontend
    const deleteTime = '2026-10-26T12:00:00.000Z';
    const deletePayload = {
      mutations: [
        {
          client_mutation_id: 'mut-pat-2',
          entity: 'patients',
          record_id: patientId,
          operation: 'DELETE',
          payload: {
            id: patientId,
            name: 'Mariana Costa',
            whatsapp: '11988776655',
            is_active: false,
            deleted_at: deleteTime,
            updated_at: deleteTime,
          },
          timestamp: deleteTime,
        },
      ],
    };

    const resDelete = await request(testApp)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${tokenTenant}`)
      .send(deletePayload);

    expect(resDelete.status).toBe(200);
    expect(resDelete.body.applied).toBe(1);

    // 3. Valida que no PostgreSQL o registro agora está com is_active = false e deleted_at preenchido
    const afterCheck = await db.query(
      `SELECT is_active, deleted_at, updated_at FROM patients WHERE id = $1 AND tenant_id = $2`,
      [patientId, tenantId]
    );

    expect(afterCheck.rows.length).toBe(1);
    expect(afterCheck.rows[0].is_active).toBe(false);
    expect(afterCheck.rows[0].deleted_at).not.toBeNull();
  });
});

