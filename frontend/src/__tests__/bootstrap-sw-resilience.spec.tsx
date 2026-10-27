/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import * as AppExports from '../App.js';
import * as MainExports from '../main.js';
import fs from 'fs';
import path from 'path';

const mockRender = vi.fn();
const mockCreateRoot = vi.fn((container: HTMLElement) => ({
  render: mockRender,
  unmount: vi.fn(),
}));

vi.mock('react-dom/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom/client')>();
  return {
    ...actual,
    default: {
      ...actual,
      createRoot: (container: HTMLElement) => mockCreateRoot(container),
    },
    createRoot: (container: HTMLElement) => mockCreateRoot(container),
  };
});

describe('Resiliência de Bootstrap e Service Worker Offline (US-119)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    mockRender.mockClear();
    mockCreateRoot.mockClear();
    container = document.createElement('div');
    container.id = 'root';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('AC-207: Isolamento de AuthenticatedApp em App.tsx e Montagem Idempotente do React Root @spec:AC-207', () => {
    // 1. Verifica se AuthenticatedApp está devidamente exportado em App.tsx
    expect(AppExports).toHaveProperty('AuthenticatedApp');
    expect(typeof (AppExports as any).AuthenticatedApp).toBe('function');

    // 2. Executa a montagem no container pela primeira vez
    const root1 = (MainExports as any).mountApp(container);
    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    expect(mockRender).toHaveBeenCalledTimes(1);
    expect(root1).toBeDefined();

    // 3. Executa a montagem novamente sobre o mesmo container (simulando reload/HMR)
    const root2 = (MainExports as any).mountApp(container);
    // Não deve chamar createRoot uma segunda vez
    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    // Mas deve chamar mockRender novamente na raiz existente
    expect(mockRender).toHaveBeenCalledTimes(2);
    expect(root2).toBe(root1);
  });

  it('AC-208: Estratégia Network-First com Fallback Offline e Filtro de Segurança no Service Worker @spec:AC-208', () => {
    const swPath = fs.existsSync(path.resolve(process.cwd(), 'public/sw.js'))
      ? path.resolve(process.cwd(), 'public/sw.js')
      : path.resolve(process.cwd(), 'frontend/public/sw.js');

    expect(fs.existsSync(swPath)).toBe(true);
    const swContent = fs.readFileSync(swPath, 'utf8');

    // 1. Verificação de versão atualizada do cache
    expect(swContent).toContain("cliniassist-app-shell-v5");

    // 2. Trava de segurança: somente métodos GET
    expect(swContent).toMatch(/request\.method\s*!==\s*['"]GET['"]/);

    // 3. Exclusão mandatória de /api (nenhum dado multi-tenant ou clínico em cache estático)
    expect(swContent).toMatch(/url\.pathname\.startsWith\(['"]\/api['"]\)/);

    // 4. Estratégia Network-First nos ativos estáticos com fallback offline no catch
    expect(swContent).toContain("fetch(event.request)");
    expect(swContent).toContain(".catch(");
  });
});
