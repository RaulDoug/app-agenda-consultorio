# Tarefas: Ajustes do Consultório, Integração do Shell e Suíte E2E Playwright

> feature: ajustes-e2e-playwright

## T-054 — Repositório Local de Ajustes e Bloqueios com Outbox [concluida]
- Refs: US-045, AC-074, AC-075
- Arquivos: frontend/src/db/repositories/settings-local-repository.ts
- Notas: Suporte a get/save de business_hours (dias 0-6, horário de início, término e almoço) e schedule_blocks (inserção e soft-delete) com gravação na sync_outbox.

## T-055 — Componente de Ajustes do Consultório e Bloqueios de Agenda [concluida]
- Refs: US-045, AC-074, AC-075
- Arquivos: frontend/src/features/settings/components/SettingsView.tsx, frontend/src/features/settings/components/ScheduleBlocksManager.tsx
- Notas: Interface visual para definir expediente semanal, intervalo de almoço e cadastro/remoção de bloqueios pontuais.

## T-056 — Integração Completa do AppShell com Todas as Abas e Status [concluida]
- Refs: US-046, AC-076
- Arquivos: frontend/src/App.tsx, frontend/src/components/layout/AppShell.tsx
- Notas: Conectar Agenda (ScheduleGrid), Clientes (PatientList), Caixa (CashFlowDashboard) e Ajustes (SettingsView + WhatsApp) com TopBar e alertas.

## T-057 — Suíte de Testes Unitários e Componentes TDD de Ajustes e Integração [concluida]
- Refs: US-045, US-046, AC-074, AC-075, AC-076
- Arquivos: frontend/src/features/settings/__tests__/settings-ui.spec.tsx
- Notas: Testes React Testing Library com fake-indexeddb cobrindo AC-074, AC-075 e AC-076 com prova mecânica.

## T-058 — Suíte End-to-End Mobile e Resiliência Modo Avião (Playwright) [concluida]
- Refs: US-047, AC-077, AC-078
- Arquivos: frontend/e2e/cliniassist-mobile.spec.ts
- Notas: Testes E2E em viewport móvel iPhone 14 (390x844) validando jornada completa de atendimento e persistência/sincronização offline-first.
