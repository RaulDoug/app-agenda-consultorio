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
});
