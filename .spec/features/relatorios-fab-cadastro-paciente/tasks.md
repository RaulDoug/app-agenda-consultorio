# Tarefas: Relatórios & Métricas, Botão Central '+' (FAB) e Cadastro Direto de Pacientes

> feature: relatorios-fab-cadastro-paciente

## T-090 — Motor de Cálculo Offline-First de Relatórios e Métricas [concluida]
- Refs: US-064, AC-106
- Arquivos: frontend/src/features/analytics/utils/reports-calculator.ts
- Notas: Implementar algoritmo para agregação em tempo real a partir de dados do Dexie: taxa de no-show com perda financeira em R$, DRE simples, projeção de recebíveis em 30/60/90 dias e ranking de procedimentos por volume e faturamento.

## T-091 — Frontend: Componente de Tela de Relatórios & Métricas Gerenciais [concluida]
- Refs: US-064, AC-106
- Arquivos: frontend/src/features/analytics/components/ReportsView.tsx
- Notas: Criar componente da tela de relatórios com seletor de períodos (Hoje, Este Mês, 30d, Todos), cards para No-Show, DRE, Projeção Futura, Tabela de Ranking de Procedimentos e Lista de Pacientes Inativos com botão de WhatsApp.

## T-092 — Frontend: Modal e Ação de Cadastro Direto de Pacientes [concluida]
- Refs: US-065, AC-107
- Arquivos: frontend/src/features/patients/components/CreatePatientModal.tsx, frontend/src/features/patients/components/PatientList.tsx
- Notas: Criar modal `CreatePatientModal` com validação de nome e WhatsApp, e adicionar botão `+ Novo Paciente` em `PatientList` conectado a `patientRepo.createPatient`.

## T-093 — Frontend: Layout Mobile com Botão Central '+' Elevado e Hub 'Mais' [concluida]
- Refs: US-063, AC-104, AC-105
- Arquivos: frontend/src/components/layout/BottomNav.tsx, frontend/src/components/layout/MoreMenuHub.tsx, frontend/src/components/layout/DesktopSidebar.tsx, frontend/src/components/layout/AppShell.tsx, frontend/src/App.tsx
- Notas: Reestruturar `BottomNav` com botão circular central elevado `-top-5` com gradiente azul/teal chamando `onQuickAppointment`, adicionar aba `Relatórios` e aba `Mais` com `MoreMenuHub`, e exibir todas as opções diretamente no `DesktopSidebar`.

## T-094 — Testes Automatizados TDD com Prova Mecânica e Auditoria CI [concluida]
- Refs: US-063, US-064, US-065, AC-104, AC-105, AC-106, AC-107
- Arquivos: frontend/src/features/analytics/__tests__/relatorios-fab-paciente.spec.tsx
- Notas: Criar suíte TDD RTL + Dexie cobrindo os critérios AC-104 a AC-107, registrar prova via `onp-spec verify` e auditoria `audit --ci` com saída código 0.
