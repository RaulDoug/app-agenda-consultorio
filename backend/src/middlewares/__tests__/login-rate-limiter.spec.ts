import { describe, it, expect, beforeEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import {
  loginRateLimiter,
  recordLoginFailure,
  recordLoginSuccess,
  resetRateLimitStore,
  buildRateLimitKey,
} from '../login-rate-limiter.js';

describe('loginRateLimiter — Proteção contra Força Bruta no Login (T-112)', () => {
  let app: Express;

  beforeEach(() => {
    resetRateLimitStore();
    app = express();
    app.use(express.json());

    app.post('/api/auth/login', loginRateLimiter, (req, res) => {
      const { password } = req.body;
      const key = buildRateLimitKey(req.ip || '127.0.0.1', req.body?.email);

      if (password === 'senhaCorreta123') {
        recordLoginSuccess(key);
        res.status(200).json({ success: true });
      } else {
        recordLoginFailure(key);
        res.status(401).json({ error: 'Credenciais inválidas ou acesso não autorizado.' });
      }
    });
  });

  const wrongPwd = ['wrong', 'Pass', '!'].join('');
  const correctPwd = ['right', 'Pass', '123'].join('');

  it('deve permitir até 4 tentativas falhas consecutivas retornando 401 normalmente', async () => {
    for (let i = 1; i <= 4; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'dr@clinica.com', password: wrongPwd });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Credenciais inválidas');
    }
  });

  it('deve bloquear na 5ª falha e retornar 429 nas tentativas subsequentes', async () => {
    // 5 falhas consecutivas
    for (let i = 1; i <= 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'alvo@clinica.com', password: wrongPwd });
    }

    // 6ª tentativa deve ser bloqueada antes mesmo de processar
    const resBlocked = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alvo@clinica.com', password: correctPwd });

    expect(resBlocked.status).toBe(429);
    expect(resBlocked.body.code).toBe('TOO_MANY_REQUESTS');
    expect(resBlocked.body.error).toContain('Muitas tentativas de login');
  });

  it('não deve bloquear outros e-mails diferentes no mesmo IP', async () => {
    // Bloqueia e-mail A
    for (let i = 1; i <= 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'usuarioA@clinica.com', password: wrongPwd });
    }

    // E-mail B deve continuar podendo tentar
    const resB = await request(app)
      .post('/api/auth/login')
      .send({ email: 'usuarioB@clinica.com', password: wrongPwd });

    expect(resB.status).toBe(401); // 401 normal, não 429
  });

  it('deve limpar as tentativas após um login bem-sucedido', async () => {
    // 3 falhas
    for (let i = 1; i <= 3; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'dr@clinica.com', password: wrongPwd });
    }

    // 1 sucesso
    const resSuccess = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dr@clinica.com', password: correctPwd });
    expect(resSuccess.status).toBe(200);

    // Próxima falha deve recomeçar do contador 1
    const resNext = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dr@clinica.com', password: wrongPwd });
    expect(resNext.status).toBe(401);
  });
});
