/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { AppShell } from '../components/layout/AppShell.js';
import { BottomNav, NAV_ITEMS } from '../components/layout/BottomNav.js';
import { DesktopSidebar } from '../components/layout/DesktopSidebar.js';
import { STATUS_TOKENS, BRAND_COLORS } from '../theme/tokens.js';
import fs from 'fs';
import path from 'path';

describe('Fundação Frontend — CliniAssist (Sprint FE-0)', () => {
  describe('US-027 — Shell Adaptativo e Navegação Mobile/Desktop', () => {
    it('AC-049: Layout Mobile com Bottom Navigation em viewports estreitos @spec:AC-049', () => {
      const onTabChange = vi.fn();
      render(
        <AppShell activeTab="agenda" onTabChange={onTabChange}>
          <div>Conteúdo Principal</div>
        </AppShell>
      );

      // 1. BottomNav renderizado com testid apropriado
      const bottomNav = screen.getByTestId('bottom-navigation');
      expect(bottomNav).toBeInTheDocument();
      expect(bottomNav.className).toContain('md:hidden');
      expect(bottomNav.className).toContain('fixed');
      expect(bottomNav.className).toContain('bottom-0');

      // 2. Abas principais presentes: Agenda, Clientes, Caixa, Ajustes
      const tabAgenda = screen.getByTestId('nav-tab-agenda');
      const tabClientes = screen.getByTestId('nav-tab-clientes');
      const tabCaixa = screen.getByTestId('nav-tab-caixa');
      const tabAjustes = screen.getByTestId('nav-tab-ajustes');

      expect(tabAgenda).toBeInTheDocument();
      expect(tabClientes).toBeInTheDocument();
      expect(tabCaixa).toBeInTheDocument();
      expect(tabAjustes).toBeInTheDocument();

      // 3. Padrão de acessibilidade WCAG: Touch target de pelo menos 44px
      expect(tabAgenda.className).toContain('min-h-[44px]');
      expect(tabAgenda.className).toContain('min-w-[44px]');

      // 4. Interação de toque/clique chama onTabChange
      fireEvent.click(tabClientes);
      expect(onTabChange).toHaveBeenCalledWith('clientes');
    });

    it('AC-050: Layout Desktop com Sidebar retrátil em viewports amplos @spec:AC-050', () => {
      const onTabChange = vi.fn();
      render(
        <AppShell
          activeTab="agenda"
          onTabChange={onTabChange}
          clinicName="Clínica Odontológica Moderna"
          whatsappConnected={true}
        >
          <div>Conteúdo Principal</div>
        </AppShell>
      );

      // 1. Sidebar desktop renderizada com classe responsiva md:flex
      const sidebar = screen.getByTestId('desktop-sidebar');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar.className).toContain('hidden');
      expect(sidebar.className).toContain('md:flex');

      // 2. Logotipo e nome do consultório dentro da sidebar
      expect(within(sidebar).getByText('CliniAssist')).toBeInTheDocument();
      expect(within(sidebar).getByText('Clínica Odontológica Moderna')).toBeInTheDocument();

      // 3. Indicador da sessão do WhatsApp
      const waIndicator = screen.getByTestId('whatsapp-status-indicator');
      expect(waIndicator).toBeInTheDocument();
      expect(screen.getByText('Conectado')).toBeInTheDocument();

      // 4. Navegação pela sidebar
      const sidebarTabCaixa = screen.getByTestId('sidebar-tab-caixa');
      fireEvent.click(sidebarTabCaixa);
      expect(onTabChange).toHaveBeenCalledWith('caixa');
    });
  });

  describe('US-028 — Identidade Visual e Tokens de Design Semânticos', () => {
    it('AC-051: Tokens de design para status da agenda e botões acessíveis @spec:AC-051', () => {
      // 1. Validação das cores semânticas padronizadas
      expect(STATUS_TOKENS.CONFIRMED.hex).toBe('#10B981');
      expect(STATUS_TOKENS.CONFIRMED.label).toBe('Confirmado');

      expect(STATUS_TOKENS.PENDING.hex).toBe('#F59E0B');
      expect(STATUS_TOKENS.PENDING.label).toBe('Pendente');

      expect(STATUS_TOKENS.RESCHEDULE_REQUESTED.hex).toBe('#F97316');
      expect(STATUS_TOKENS.RESCHEDULE_REQUESTED.label).toBe('Reagendamento Solicitado');

      expect(STATUS_TOKENS.MESSAGE_RECEIVED.hex).toBe('#3B82F6');
      expect(STATUS_TOKENS.MESSAGE_RECEIVED.label).toBe('Mensagem Recebida');

      expect(STATUS_TOKENS.COMPLETED.hex).toBe('#64748B');
      expect(STATUS_TOKENS.COMPLETED.label).toBe('Concluído');

      expect(STATUS_TOKENS.NO_SHOW.hex).toBe('#EF4444');
      expect(STATUS_TOKENS.NO_SHOW.label).toBe('Paciente Faltou');

      // 2. Cores da marca do CliniAssist
      expect(BRAND_COLORS.primary).toBe('#0D9488');
      expect(BRAND_COLORS.secondary).toBe('#0284C7');
    });
  });

  describe('US-029 — Configuração PWA e Infraestrutura de Testes Automatizados', () => {
    it('AC-052: Manifesto PWA e suíte de testes com fake-indexeddb e MSW @spec:AC-052', async () => {
      // 1. Verificação do manifesto PWA
      const manifestPath = path.resolve(__dirname, '../../public/manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(manifestContent.name).toBe('CliniAssist');
      expect(manifestContent.short_name).toBe('CliniAssist');
      expect(manifestContent.display).toBe('standalone');
      expect(manifestContent.theme_color).toBe('#0D9488');
      expect(manifestContent.background_color).toBe('#F8FAFC');
      expect(manifestContent.icons.length).toBeGreaterThanOrEqual(2);

      // 2. Verificação do suporte offline a IndexedDB via fake-indexeddb
      expect(window.indexedDB).toBeDefined();

      const dbOpenReq = window.indexedDB.open('cliniassist_test_db', 1);
      const dbPromise = new Promise<boolean>((resolve, reject) => {
        dbOpenReq.onupgradeneeded = () => {
          const db = dbOpenReq.result;
          db.createObjectStore('test_store', { keyPath: 'id' });
        };
        dbOpenReq.onsuccess = () => {
          const db = dbOpenReq.result;
          const tx = db.transaction('test_store', 'readwrite');
          tx.objectStore('test_store').put({ id: 'item_1', name: 'Item Teste Offline' });
          tx.oncomplete = () => {
            db.close();
            resolve(true);
          };
          tx.onerror = () => reject(tx.error);
        };
        dbOpenReq.onerror = () => reject(dbOpenReq.error);
      });

      const dbResult = await dbPromise;
      expect(dbResult).toBe(true);
    });
  });
});
