import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { seedTestTenant } from '../../test-utils/auth.js';

describe('Rotas de Pacientes (Clientes) — /api/patients', () => {
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
    const res = await request(app).get('/api/patients');
    expect(res.status).toBe(401);
  });

  it('deve cadastrar paciente com sucesso via POST /api/patients @spec:AC-129', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Juliana Paes',
        whatsapp: '11987654321',
        notes: 'Primeira consulta de avaliação',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Juliana Paes');
    expect(res.body.whatsapp).toBe('11987654321');
  });

  it('deve retornar 409 Conflict ao tentar cadastrar paciente com WhatsApp duplicado @spec:AC-177', async () => {
    // Primeiro cadastro
    await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Juliana Paes',
        whatsapp: '11987654321',
      });

    // Tentativa duplicada com formatação diferente (mesmos dígitos)
    const resDuplicado = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Juliana Outra',
        whatsapp: '(11) 98765-4321',
      });

    expect(resDuplicado.status).toBe(409);
    expect(resDuplicado.body.error).toContain('Já existe um paciente cadastrado com este WhatsApp');
  });

  it('deve rejeitar cadastro sem nome com 400', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        whatsapp: '11987654321',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Nome');
  });

  it('deve listar pacientes via GET /api/patients', async () => {
    await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Paciente 1', whatsapp: '11900000001' });

    await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Paciente 2', whatsapp: '11900000002' });

    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  it('deve buscar paciente por ID via GET /api/patients/:id', async () => {
    const postRes = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Busca ID', whatsapp: '11911111111' });

    const patientId = postRes.body.id;

    const res = await request(app)
      .get(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(patientId);
    expect(res.body.name).toBe('Busca ID');
  });

  it('deve atualizar paciente via PUT /api/patients/:id', async () => {
    const postRes = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nome Antigo', whatsapp: '11922222222' });

    const patientId = postRes.body.id;

    const res = await request(app)
      .put(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nome Atualizado 2026' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Nome Atualizado 2026');
  });

  it('deve realizar soft-delete via DELETE /api/patients/:id', async () => {
    const postRes = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Para Deletar', whatsapp: '11933333333' });

    const patientId = postRes.body.id;

    const delRes = await request(app)
      .delete(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.message).toContain('Soft Delete');

    // Consulta subsequente deve retornar 404
    const getRes = await request(app)
      .get(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });
});
