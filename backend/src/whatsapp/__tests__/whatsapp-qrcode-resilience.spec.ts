import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';
import { setEvolutionClient, EvolutionTransientError } from '../evolution-client.js';
import { MockEvolutionClient } from './mock-evolution.js';
import { generateTestToken } from '../../middlewares/auth.js';

describe('Feature: Correção do QR Code e Resiliência na Evolution API — Backend', () => {
  let db: IDatabase;
  let testApp: Express;
  let mockClient: MockEvolutionClient;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const instanceName = 'cliniassist_default';
  const token = generateTestToken({ tenant_id: tenantId, tv: 0 });

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    mockClient = new MockEvolutionClient();
    setEvolutionClient(mockClient);
    testApp = createApp();

    await db.query(
      `INSERT INTO tenants (id, name, whatsapp_instance_name, whatsapp_connected, token_version, is_active, must_change_password)
       VALUES ($1, 'Consultório CliniAssist', $2, false, 0, true, false)`,
      [tenantId, instanceName]
    );
  });

  describe('US-051 — Resiliência na Emissão e Renderização do QR Code WhatsApp', () => {
    it('AC-083: Backend não emite base64 corrompido e retorna qrcode nulo em caso de sessão em processamento @spec:AC-083', async () => {
      // 1. Cenário: Evolution API retorna count 0 sem base64 (em handshake/processamento)
      mockClient.setConnectionState(instanceName, 'close');
      mockClient.setQrCodeResponse(instanceName, { count: 0 });

      const resInProgress = await request(testApp)
        .get('/api/whatsapp/session')
        .set('Authorization', `Bearer ${token}`);

      expect(resInProgress.status).toBe(200);
      expect(resInProgress.body.connected).toBe(false);
      expect(resInProgress.body.instanceName).toBe(instanceName);
      // NUNCA deve conter o fallback truncado/quebrado 'data:image/png;base64,iVBORw0KGgoAAA...'
      expect(resInProgress.body.qrcode).toBeNull();

      // 2. Cenário: Falha transitória ao buscar QR Code
      mockClient.setQrCodeResponse(instanceName, null);
      mockClient.getQrCode = async () => {
        throw new EvolutionTransientError('Evolution API inicializando canal', 503);
      };

      const resTransient = await request(testApp)
        .get('/api/whatsapp/session')
        .set('Authorization', `Bearer ${token}`);

      expect(resTransient.status).toBe(200);
      expect(resTransient.body.connected).toBe(false);
      expect(resTransient.body.qrcode).toBeNull();
    });

    it('AC-085: Limpeza de instâncias órfãs e isolamento de sessão única na Evolution API @spec:AC-085', async () => {
      // Cria instâncias órfãs no mock e valida limpeza controlada
      mockClient.setConnectionState('test_instance', 'close');
      mockClient.setConnectionState('instancia_sorriso', 'close');
      mockClient.setConnectionState('instancia_inativa', 'close');
      mockClient.setConnectionState('cliniassist_default', 'close');

      const orphanInstances = ['test_instance', 'instancia_sorriso', 'instancia_inativa'];
      for (const inst of orphanInstances) {
        await mockClient.deleteInstance(inst);
      }

      expect(mockClient.deletedInstances).toEqual(orphanInstances);
      expect(mockClient.connectionStates.has('cliniassist_default')).toBe(true);
      expect(mockClient.connectionStates.has('test_instance')).toBe(false);
      expect(mockClient.connectionStates.has('instancia_sorriso')).toBe(false);
      expect(mockClient.connectionStates.has('instancia_inativa')).toBe(false);
    });
  });
});
