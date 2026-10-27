# Tasks: Reagendamento mensagem whatsapp

> feature: reagendamento-mensagem-whatsapp

## T-144 — Atualizar parser semântico de WhatsApp no Backend [concluida]
- Refs: US-125, AC-219
- Arquivos: backend/src/whatsapp/parser.ts, backend/src/whatsapp/__tests__/whatsapp.spec.ts
- Notas: Expandir padrões de remarcação para incluir "pedido de agendamento", "reagendamento", "remarcação", etc., sem falsos positivos em confirmações.

## T-145 — Alternar botão de confirmação manual para reagendamento na Central de WhatsApp [concluida]
- Refs: US-125, AC-220
- Arquivos: frontend/src/features/whatsapp/components/WhatsappQueueView.tsx, frontend/src/features/whatsapp/__tests__/WhatsappQueueView.spec.tsx
- Notas: Identificar itens com pedido de agendamento/reagendamento e renderizar botão "Reagendar Consulta" em vez de "Confirmar Manualmente".

## T-146 — Integrar abertura do RescheduleModal e sincronização na Fila WhatsApp [concluida]
- Refs: US-125, AC-221
- Arquivos: frontend/src/App.tsx, frontend/src/features/whatsapp/components/WhatsappQueueView.tsx, frontend/src/features/whatsapp/__tests__/WhatsappQueueView.spec.tsx
- Notas: Permitir abrir o modal de remarcação ao clicar no botão, persistir no banco local e sincronizar com recarregamento da fila.
