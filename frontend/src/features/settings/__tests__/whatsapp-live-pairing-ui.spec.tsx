/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CliniAssistLocalDB } from '../../../db/local-db.js';
import { SettingsLocalRepository } from '../../../db/repositories/settings-local-repository.js';
import { SettingsView } from '../components/SettingsView.js';
import { App } from '../../../App.js';

describe('Feature: Pareamento WhatsApp Live — Frontend UI', () => {
  let testDb: CliniAssistLocalDB;
  let settingsRepo: SettingsLocalRepository;
  const tenantId = 'tenant-test-pairing';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-pairing-${Date.now()}-${Math.random()}`);
    await testDb.open();
    settingsRepo = new SettingsLocalRepository(testDb);
  });

  describe('US-050 — Interface de Pareamento em Tempo Real no Frontend', () => {
    it('AC-082: Exibição dinâmica do QR Code e polling reativo de conexão na interface @spec:AC-082', async () => {
      const sampleQr = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      // 1. Renderiza SettingsView no estado desconectado com QR Code dinâmico
      const { rerender, unmount } = render(
        <SettingsView
          tenantId={tenantId}
          repo={settingsRepo}
          whatsappConnected={false}
          qrCodeBase64={sampleQr}
        />
      );

      // Valida badge Desconectado e presença da imagem de QR Code
      const statusBadge = screen.getByTestId('whatsapp-status-badge');
      expect(statusBadge).toHaveTextContent('Desconectado');

      const qrImage = screen.getByTestId('whatsapp-qrcode-image') as HTMLImageElement;
      expect(qrImage).toBeInTheDocument();
      expect(qrImage.src).toContain(sampleQr);

      // 2. Simula transição para o estado Conectado (após escaneamento)
      rerender(
        <SettingsView
          tenantId={tenantId}
          repo={settingsRepo}
          whatsappConnected={true}
          connectedNumber="5511999998888"
        />
      );

      // Valida badge Conectado (Verde) e remoção da imagem do QR Code
      await waitFor(() => {
        expect(screen.getByTestId('whatsapp-status-badge')).toHaveTextContent('Conectado (Verde)');
      });
      expect(screen.queryByTestId('whatsapp-qrcode-image')).not.toBeInTheDocument();
      expect(screen.getByText(/5511999998888/)).toBeInTheDocument();

      // Limpa a montagem anterior para evitar conflito de IDs no DOM
      unmount();

      // 3. Validação da integração no shell App com atualização reativa
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/whatsapp/session')) {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ connected: false, qrcode: sampleQr }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => ({ connected: true, number: '5511999998888' }),
          });
        }
        if (url.includes('/api/whatsapp/connect')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: 'connecting' }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      render(
        <App
          initialTab="ajustes"
          db={testDb}
          tenantId={tenantId}
          initialWhatsappConnected={false}
        />
      );

      // Verifica carregamento do QR Code inicial
      await waitFor(() => {
        expect(screen.getByTestId('whatsapp-qrcode-image')).toBeInTheDocument();
      });

      // Clica em Atualizar QR Code para forçar nova checagem e transição para conectado
      const refreshBtn = screen.getByRole('button', { name: /Atualizar QR Code/i });
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(screen.getByTestId('whatsapp-status-badge')).toHaveTextContent('Conectado (Verde)');
      });
    });
  });
});
