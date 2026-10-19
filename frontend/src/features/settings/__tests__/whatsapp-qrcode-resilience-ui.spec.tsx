/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CliniAssistLocalDB } from '../../../db/local-db.js';
import { SettingsLocalRepository } from '../../../db/repositories/settings-local-repository.js';
import { SettingsView } from '../components/SettingsView.js';

describe('Feature: Correção do QR Code e Resiliência na Evolution API — Frontend UI', () => {
  let testDb: CliniAssistLocalDB;
  let settingsRepo: SettingsLocalRepository;
  const tenantId = 'tenant-test-resilience';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-resilience-${Date.now()}-${Math.random()}`);
    await testDb.open();
    settingsRepo = new SettingsLocalRepository(testDb);
  });

  describe('US-051 — Resiliência na Emissão e Renderização do QR Code WhatsApp', () => {
    it('AC-084: Frontend exibe placeholder amigável com spinner e proteção contra falha de imagem @spec:AC-084', () => {
      // 1. Cenário: qrcodeBase64 é null (backend ainda aguardando geração da Evolution API)
      const { rerender } = render(
        <SettingsView
          tenantId={tenantId}
          repo={settingsRepo}
          whatsappConnected={false}
          qrCodeBase64={null}
        />
      );

      // Deve exibir placeholder com spinner e texto explicativo, sem renderizar tag <img>
      const placeholder = screen.getByTestId('whatsapp-qrcode-placeholder');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveTextContent('Aguardando QR Code');
      expect(placeholder).toHaveTextContent('Gerando sessão com a Evolution API...');
      expect(screen.queryByTestId('whatsapp-qrcode-image')).not.toBeInTheDocument();

      // 2. Cenário: Recebe um QR code e renderiza a imagem
      const sampleQr = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      rerender(
        <SettingsView
          tenantId={tenantId}
          repo={settingsRepo}
          whatsappConnected={false}
          qrCodeBase64={sampleQr}
        />
      );

      const qrImage = screen.getByTestId('whatsapp-qrcode-image');
      expect(qrImage).toBeInTheDocument();

      // 3. Cenário de Resiliência: Imagem corrompida dispara evento onError
      fireEvent.error(qrImage);

      // O fallback automático deve assumir o controle, exibindo o placeholder em vez do ícone de imagem quebrada
      const recoveredPlaceholder = screen.getByTestId('whatsapp-qrcode-placeholder');
      expect(recoveredPlaceholder).toBeInTheDocument();
      expect(recoveredPlaceholder).toHaveTextContent('Aguardando QR Code');
      expect(screen.queryByTestId('whatsapp-qrcode-image')).not.toBeInTheDocument();
    });
  });
});
