# Tarefas: Bloqueio de Cobrança Duplicada, Parcelamento Nativo e Estorno de Pagamento

> feature: bloqueio-recorrencia-parcelamento-checkout

## T-085 — Repositório Financeiro: Salvaguarda Idempotente e Método de Estorno (`revertCheckout`) [concluida]
- Refs: US-060, US-062, AC-101, AC-103
- Arquivos: frontend/src/db/repositories/financial-local-repository.ts
- Notas: Implementar verificação de transações ativas pré-existentes em `recordCheckout` e adicionar método `revertCheckout(appointmentId: string)` que marca transações com `is_active: false` e `deleted_at: now`, além de restaurar o agendamento para `CONFIRMED`.

## T-086 — Frontend: Bloqueio de Ações Rápidas, Banner Informativo e Botão com Confirmação de Estorno [concluida]
- Refs: US-060, US-062, AC-100, AC-103
- Arquivos: frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx
- Notas: Quando `appointment.status === 'COMPLETED'`, ocultar edição de procedimentos e botões normais de status. Exibir banner verde de atendimento faturado e botão secundário com caixa de confirmação em 2 passos para acionar `revertCheckout`.

## T-087 — Frontend: Integração Nativa de `InstallmentsForm` e Validação no `CheckoutDrawer` [concluida]
- Refs: US-061, AC-102
- Arquivos: frontend/src/features/checkout/components/CheckoutDrawer.tsx
- Notas: Renderizar `InstallmentsForm` nativamente ao escolher 'PARCELADO', gerenciar o estado do plano de parcelas e repassá-lo no `CheckoutResult` com bloqueio do botão se inválido.

## T-088 — Frontend: Conexão do Repositório Financeiro e Suporte a Parcelas no `App.tsx` [concluida]
- Refs: US-061, US-062, AC-102, AC-103
- Arquivos: frontend/src/App.tsx
- Notas: Repassar as parcelas configuradas no checkout para `financialRepo.recordCheckout` e repassar a instância `financialRepo` para o `AppointmentDetailsDrawer`.

## T-089 — Testes Automatizados TDD com Prova Mecânica e Auditoria CI [pendente]
- Refs: US-060, US-061, US-062, AC-100, AC-101, AC-102, AC-103
- Arquivos: frontend/src/features/agenda/__tests__/bloqueio-status-parcelamento.spec.tsx
- Notas: Suíte de testes RTL + IndexedDB cobrindo AC-100, AC-101, AC-102 e AC-103, validação com `onp-spec verify` e auditoria `audit --ci`.
