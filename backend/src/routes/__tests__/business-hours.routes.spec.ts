import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { seedTestTenant } from '../../test-utils/auth.js';

describe('Rotas de Horários de Atendimento — /api/business-hours', () => {
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
    const res = await request(app).get('/api/business-hours');
    expect(res.status).toBe(401);
  });

  it('deve listar horários de atendimento via GET /api/business-hours', async () => {
    const res = await request(app)
      .get('/api/business-hours')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('deve atualizar expediente via PUT /api/business-hours @spec:AC-130', async () => {
    const res = await request(app)
      .put('/api/business-hours')
      .set('Authorization', `Bearer ${token}`)
      .send([
        {
          day_of_week: 1,
          is_open: true,
          start_time: '08:00',
          end_time: '17:00',
          break_start_time: '12:00',
          break_end_time: '13:00',
        },
      ]);

    expect(res.status).toBe(200);
    const seg = res.body.find((d: any) => d.day_of_week === 1);
    expect(seg.end_time).toContain('17:00');
  });

  it('deve rejeitar horário inconsistente com 400', async () => {
    const res = await request(app)
      .put('/api/business-hours')
      .set('Authorization', `Bearer ${token}`)
      .send([
        {
          day_of_week: 1,
          is_open: true,
          start_time: '18:00',
          end_time: '08:00',
        },
      ]);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('término deve ser posterior');
  });
});
