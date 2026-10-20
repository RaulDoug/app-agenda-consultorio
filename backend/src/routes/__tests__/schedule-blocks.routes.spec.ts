import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { seedTestTenant } from '../../test-utils/auth.js';

describe('Rotas de Bloqueios de Agenda — /api/schedule-blocks', () => {
  let db: IDatabase;
  let app: Express;
  let token: string;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    app = createApp();

    const seeded = await seedTestTenant(db, { must_change_password: false });
    token = seeded.token;
  });

  it('deve rejeitar requisição sem token com 401', async () => {
    const res = await request(app).get('/api/schedule-blocks');
    expect(res.status).toBe(401);
  });

  it('deve cadastrar bloqueio de agenda via POST /api/schedule-blocks @spec:AC-131', async () => {
    const res = await request(app)
      .post('/api/schedule-blocks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Feriado Municipal',
        start_time: '2026-11-20T00:00:00.000Z',
        end_time: '2026-11-20T23:59:59.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('Feriado Municipal');
  });

  it('deve listar bloqueios cadastrados via GET /api/schedule-blocks', async () => {
    await request(app)
      .post('/api/schedule-blocks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Bloqueio Teste',
        start_time: '2026-11-22T08:00:00.000Z',
        end_time: '2026-11-22T10:00:00.000Z',
      });

    const res = await request(app)
      .get('/api/schedule-blocks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('deve atualizar bloqueio via PUT /api/schedule-blocks/:id', async () => {
    const postRes = await request(app)
      .post('/api/schedule-blocks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Bloqueio Antigo',
        start_time: '2026-11-23T14:00:00.000Z',
        end_time: '2026-11-23T15:00:00.000Z',
      });

    const blockId = postRes.body.id;

    const res = await request(app)
      .put(`/api/schedule-blocks/${blockId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Bloqueio Atualizado' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Bloqueio Atualizado');
  });

  it('deve excluir bloqueio via DELETE /api/schedule-blocks/:id (Soft-Delete)', async () => {
    const postRes = await request(app)
      .post('/api/schedule-blocks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Bloqueio Para Excluir',
        start_time: '2026-11-24T09:00:00.000Z',
        end_time: '2026-11-24T10:00:00.000Z',
      });

    const blockId = postRes.body.id;

    const delRes = await request(app)
      .delete(`/api/schedule-blocks/${blockId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.message).toContain('Soft Delete');

    const getRes = await request(app)
      .get(`/api/schedule-blocks/${blockId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });
});
