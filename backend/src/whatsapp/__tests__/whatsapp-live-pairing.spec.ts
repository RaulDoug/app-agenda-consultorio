import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { setEvolutionClient } from '../evolution-client.js';
import { MockEvolutionClient } from './mock-evolution.js';

describe('Feature: Pareamento WhatsApp Live — Backend', () => {
  let db: IDatabase;
  let testApp: Express;
  let mockClient: MockEvolutionClient;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const instanceName = 'cliniassist_test_instance';

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    mockClient = new MockEvolutionClient();
    setEvolutionClient(mockClient);
    testApp = createApp();

    await db.query(
      `INSERT INTO tenants (id, name, whatsapp_instance_name, whatsapp_connected)
       VALUES ($1, 'Consultório OdontoFlow', $2, false)`,
      [tenantId, instanceName]
    );
  });

  describe('US-048 — Inicialização Dev com TypeScript Watch', () => {
    it('AC-079: Inicialização do backend com tsx watch e flag de ambiente @spec:AC-079', () => {
      // Lê o package.json do backend e valida sintaxe correta do tsx watch
      const pkgPath = fileURLToPath(new URL('../../../package.json', import.meta.url));
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

      expect(pkg.scripts).toBeDefined();
      expect(pkg.scripts.dev).toBe('npx tsx watch --env-file=.env src/app.ts');
      expect(pkg.scripts.dev.indexOf('watch')).toBeLessThan(pkg.scripts.dev.indexOf('--env-file'));
    });
  });

  describe('US-049 — Gestão de Sessão e Ciclo de Vida na Evolution API', () => {
    it('AC-080: Consulta de sessão com sincronização do estado e auto-criação de instância para QR Code @spec:AC-080', async () => {
      // 1. Cenário Desconectado: mock emite QR Code e estado 'close'
      mockClient.setConnectionState(instanceName, 'close');

      const resDisconnected = await request(testApp)
        .get('/api/whatsapp/session')
        .set('x-tenant-id', tenantId);

      expect(resDisconnected.status).toBe(200);
      expect(resDisconnected.body.connected).toBe(false);
      expect(resDisconnected.body.instanceName).toBe(instanceName);
      expect(resDisconnected.body.state).toBe('close');
      expect(resDisconnected.body.qrcode).toMatch(/^data:image\/png;base64,/);

      // 2. Cenário Conectado: Evolution API reporta 'open'
      mockClient.setConnectionState(instanceName, 'open');

      const resConnected = await request(testApp)
        .get('/api/whatsapp/session')
        .set('x-tenant-id', tenantId);

      expect(resConnected.status).toBe(200);
      expect(resConnected.body.connected).toBe(true);
      expect(resConnected.body.state).toBe('open');

      // Verifica se o banco foi sincronizado com sucesso
      const dbCheck = await db.query(`SELECT whatsapp_connected FROM tenants WHERE id = $1`, [tenantId]);
      expect(dbCheck.rows[0].whatsapp_connected).toBe(true);
    });

    it('AC-081: Desconexão controlada de instância WhatsApp via API @spec:AC-081', async () => {
      // Marca tenant inicialmente como conectado
      await db.query(`UPDATE tenants SET whatsapp_connected = true WHERE id = $1`, [tenantId]);
      mockClient.setConnectionState(instanceName, 'open');

      // Executa desconexão
      const resDisconnect = await request(testApp)
        .post('/api/whatsapp/disconnect')
        .set('x-tenant-id', tenantId);

      expect(resDisconnect.status).toBe(200);
      expect(resDisconnect.body.success).toBe(true);
      expect(resDisconnect.body.connected).toBe(false);

      // Verifica se o estado no banco foi atualizado para false
      const dbCheck = await db.query(`SELECT whatsapp_connected FROM tenants WHERE id = $1`, [tenantId]);
      expect(dbCheck.rows[0].whatsapp_connected).toBe(false);

      // Nova consulta de sessão deve retornar desconectado e novo QR Code
      const resSessionAfter = await request(testApp)
        .get('/api/whatsapp/session')
        .set('x-tenant-id', tenantId);

      expect(resSessionAfter.status).toBe(200);
      expect(resSessionAfter.body.connected).toBe(false);
      expect(resSessionAfter.body.qrcode).toBeDefined();
    });
  });
});
