# Tarefas: Fundação Frontend — CliniAssist (Sprint FE-0)

> feature: fundacao-frontend

## T-033 — Setup de Dependências, Vite, Tailwind CSS, Design Tokens e PWA Manifest [concluida]
- Refs: US-028, US-029, AC-051, AC-052
- Arquivos: frontend/package.json, frontend/vite.config.ts, frontend/tailwind.config.js, frontend/postcss.config.js, frontend/public/manifest.json, frontend/index.html, frontend/src/index.css
- Notas: Configurar React 18, Vite, Tailwind CSS v3 com paleta de tokens clínicos (#0D9488, #0284C7, cores semânticas de status), Lucide React para ícones, manifesto PWA com tema e suporte standalone.

## T-034 — Implementação do Shell Adaptativo e Componentes de Navegação [concluida]
- Refs: US-027, AC-049, AC-050
- Arquivos: frontend/src/components/layout/AppShell.tsx, frontend/src/components/layout/BottomNav.tsx, frontend/src/components/layout/DesktopSidebar.tsx, frontend/src/components/layout/TopBar.tsx, frontend/src/theme/tokens.ts, frontend/src/App.tsx, frontend/src/main.tsx
- Notas: Construir shell responsivo com alternância entre BottomNav (em telas < 768px, com touch target >= 44px) e Sidebar lateral retrátil (em telas >= 768px), TopBar com status de conexão e rotas das abas (Agenda, Clientes, Caixa, Ajustes).

## T-035 — Configuração da Infraestrutura de Testes e Suíte TDD Automatizada [concluida]
- Refs: US-027, US-028, US-029, AC-049, AC-050, AC-051, AC-052
- Arquivos: frontend/vitest.config.ts, frontend/src/test/setup.ts, frontend/playwright.config.ts, frontend/src/__tests__/fundacao-frontend.spec.tsx
- Notas: Configurar Vitest + jsdom + RTL + fake-indexeddb + Playwright. Implementar suíte de testes com prova mecânica cobrindo AC-049, AC-050, AC-051 e AC-052.
