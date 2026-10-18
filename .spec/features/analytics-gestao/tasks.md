# Tarefas: Gestão Financeira de Caixa, Conexão WhatsApp e Reativação de Clientes (Sprint FE-4)

> feature: analytics-gestao

## T-050 — Dashboard de Caixa, DRE Rápido e Quitação de Parcelas Pendentes [concluida]
- Refs: US-042, AC-070, AC-071
- Arquivos: frontend/src/features/analytics/components/CashFlowDashboard.tsx, frontend/src/features/analytics/components/ReceivablesList.tsx, frontend/src/features/analytics/utils/cash-calculator.ts
- Notas: Cards de receitas pagas, despesas, saldo líquido, parcelas a receber no mês e ação de 1 toque para dar baixa (quitar) parcela com outbox.

## T-051 — Monitoramento de Conexão WhatsApp e Tela de QR Code [concluida]
- Refs: US-043, AC-072
- Arquivos: frontend/src/features/analytics/components/WhatsAppPairingView.tsx, frontend/src/features/analytics/components/WhatsAppAlertBanner.tsx
- Notas: Exibição de QR Code da Evolution API, status verde de conectado e banner de alerta no topo quando desconectado.

## T-052 — Lista de Reativação de Clientes Inativos (>180 dias) com Atalho de WhatsApp [pendente]
- Refs: US-044, AC-073
- Arquivos: frontend/src/features/analytics/components/InactivePatientsList.tsx, frontend/src/features/analytics/utils/inactive-finder.ts
- Notas: Identificação de pacientes sem consulta há >180 dias e sem agendamentos futuros, com botão direto de conversa no WhatsApp.

## T-053 — Suíte de Testes Automatizados TDD de Caixa, WhatsApp e Reativação de Clientes [pendente]
- Refs: US-042, US-043, US-044, AC-070, AC-071, AC-072, AC-073
- Arquivos: frontend/src/features/analytics/__tests__/analytics-ui.spec.tsx
- Notas: Suíte completa com React Testing Library e fake-indexeddb com anotações @spec:AC-070 a @spec:AC-073 para prova mecânica.
