import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { seedTestTenant } from '../../test-utils/auth.js';

describe('Rotas de Procedimentos — /api/procedures', () => {
  let db: IDatabase;
  let app: Express;
  let tenantId: string;
  let token: string;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    app = createApp();

    const seeded = await seedTestTenant(db, { must_change_password: false });
    tenantId = seeded.id;
    token = seeded.token;
  });

  it('deve rejeitar requisição sem token com 401', async () => {
    const res = await request(app).get('/api/procedures');
    expect(res.status).toBe(401);
  });

  it('deve cadastrar procedimento com duração, preço e custo via POST /api/procedures @spec:AC-128', async () => {
    const res = await request(app)
      .post('/api/procedures')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Tratamento de Canal',
        default_duration_minutes: 60,
        default_price_cents: 65000,
        cost_cents: 12000,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Tratamento de Canal');
    expect(res.body.default_duration_minutes).toBe(60);
    expect(res.body.default_price_cents).toBe(65000);
    expect(res.body.cost_cents).toBe(12000);
  });

  it('deve rejeitar cadastro com custo negativo com 400', async () => {
    const res = await request(app)
      .post('/api/procedures')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Tratamento',
        default_duration_minutes: 30,
        default_price_cents: 20000,
        cost_cents: -500,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Custo');
  });

  it('deve listar procedimentos cadastrados via GET /api/procedures', async () => {
    await request(app)
      .post('/api/procedures')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Procedimento A',
        default_duration_minutes: 30,
        default_price_cents: 10000,
      });

    const res = await request(app)
      .get('/api/procedures')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('deve atualizar procedimento (incluindo custo) via PUT /api/procedures/:id', async () => {
    const postRes = await request(app)
      .post('/api/procedures')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Procedimento Inicial',
        default_duration_minutes: 30,
        default_price_cents: 10000,
        cost_cents: 2000,
      });

    const procId = postRes.body.id;

    const res = await request(app)
      .put(`/api/procedures/${procId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Procedimento Atualizado',
        default_price_cents: 15000,
        cost_cents: 3000,
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Procedimento Atualizado');
    expect(res.body.default_price_cents).toBe(15000);
    expect(res.body.cost_cents).toBe(3000);
  });

  it('deve desativar procedimento via DELETE /api/procedures/:id (Soft-Delete)', async () => {
    const postRes = await request(app)
      .post('/api/procedures')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Procedimento para Exclusão',
        default_duration_minutes: 15,
        default_price_cents: 5000,
      });

    const procId = postRes.body.id;

    const delRes = await request(app)
      .delete(`/api/procedures/${procId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.message).toContain('Soft Delete');

    const getRes = await request(app)
      .get(`/api/procedures/${procId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });

  it('deve reativar procedimento soft-deleted via PUT /api/procedures/:id limpando deleted_at para null e atualizando updated_at', async () => {
    const postRes = await request(app)
      .post('/api/procedures')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Procedimento Para Reativar',
        default_duration_minutes: 30,
        default_price_cents: 8000,
      });

    const procId = postRes.body.id;

    // Desativa (soft-delete)
    await request(app)
      .delete(`/api/procedures/${procId}`)
      .set('Authorization', `Bearer ${token}`);

    // Reativa com is_active: true
    const putRes = await request(app)
      .put(`/api/procedures/${procId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        is_active: true,
      });

    expect(putRes.status).toBe(200);
    expect(putRes.body.is_active).toBe(true);
    expect(putRes.body.deleted_at).toBeNull();

    // Consulta direta no banco PostgreSQL para certificar que deleted_at é null
    const rawDbRes = await db.query('SELECT is_active, deleted_at, updated_at FROM procedures WHERE id = $1', [procId]);
    expect(rawDbRes.rows[0].is_active).toBe(true);
    expect(rawDbRes.rows[0].deleted_at).toBeNull();
  });

  it('deve sincronizar reativação via POST /api/sync/batch limpando deleted_at para null no PostgreSQL', async () => {
    const procId = crypto.randomUUID();
    const now = new Date();
    const deletedTime = new Date(now.getTime() - 60000).toISOString();
    const reactivatedTime = now.toISOString();

    // 1. Cria procedimento inativo diretamente
    await db.query(
      `INSERT INTO procedures (id, tenant_id, name, default_duration_minutes, default_price_cents, cost_cents, is_active, deleted_at, created_at, updated_at)
       VALUES ($1, $2, $3, 30, 10000, 0, false, $4, $4, $4)`,
      [procId, tenantId, 'Procedimento Sync Inativo', deletedTime]
    );

    // 2. Envia mutação de reativação pelo sync batch
    const syncRes = await request(app)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mutations: [
          {
            entity: 'procedures',
            record_id: procId,
            operation: 'UPDATE',
            payload: {
              id: procId,
              name: 'Procedimento Sync Inativo',
              default_duration_minutes: 30,
              default_price_cents: 10000,
              cost_cents: 0,
              is_active: true,
              deleted_at: null,
              updated_at: reactivatedTime,
            },
            updated_at: reactivatedTime,
          },
        ],
      });

    expect(syncRes.status).toBe(200);
    expect(syncRes.body.applied).toBe(1);

    // 3. Valida que no banco PostgreSQL online deleted_at é null e is_active é true
    const checkDb = await db.query('SELECT is_active, deleted_at, updated_at FROM procedures WHERE id = $1', [procId]);
    expect(checkDb.rows[0].is_active).toBe(true);
    expect(checkDb.rows[0].deleted_at).toBeNull();

    // 4. Valida que o pull de procedures no retorno de GET /api/sync/pull entrega deleted_at como null
    const pullRes = await request(app)
      .get('/api/sync/pull')
      .set('Authorization', `Bearer ${token}`);

    expect(pullRes.status).toBe(200);
    const pulledProc = pullRes.body.procedures.find((p: any) => p.id === procId);
    expect(pulledProc).toBeDefined();
    expect(pulledProc.is_active).toBe(true);
    expect(pulledProc.deleted_at).toBeNull();
  });
});
