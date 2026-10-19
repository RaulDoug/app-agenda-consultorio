# Tarefas: Integração da Conclusão de Atendimento com Checkout Financeiro

> feature: checkout-conclusao-agenda

## T-082 — Frontend: Conexão do Botão de Conclusão com Abertura do CheckoutDrawer [concluida]
- Refs: US-059, AC-098
- Arquivos: frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx, frontend/src/App.tsx
- Notas: Adicionar prop `onOpenCheckout` no `AppointmentDetailsDrawer` e conectar no `App.tsx` para abrir o `CheckoutDrawer` com o agendamento selecionado.

## T-083 — Frontend: Atualização do Agendamento para COMPLETED após Checkout [concluida]
- Refs: US-059, AC-098, AC-099
- Arquivos: frontend/src/App.tsx
- Notas: Em `handleCompleteCheckout`, atualizar o status do agendamento para `COMPLETED` através do `appointmentRepo.updateStatus` após registro financeiro.

## T-084 — Testes Automatizados com Prova Mecânica e Auditoria CI [concluida]
- Refs: US-059, AC-098, AC-099
- Arquivos: frontend/src/features/agenda/__tests__/concluir-atendimento-checkout.spec.tsx
- Notas: Testes cobrindo clique em "Concluir Atendimento", abertura de checkout, edição de procedimentos, seleção de pagamento e baixa financeira.
