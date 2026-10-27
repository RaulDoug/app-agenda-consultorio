# Tasks: Fluxo resposta reagendamento whatsapp

> feature: fluxo-resposta-reagendamento-whatsapp

## T-149 — Suporte à resolução de inbound e disparo de aviso de novo horário no Backend [concluida]
- Refs: US-127, AC-225, AC-226
- Arquivos: shared/src/types/whatsapp.ts, backend/src/db/schema.sql, backend/src/repositories/whatsapp-repository.ts, backend/src/services/whatsapp-service.ts, backend/src/controllers/whatsapp-controller.ts, backend/src/routes/whatsapp.routes.ts, backend/src/whatsapp/__tests__/whatsapp-queue-reply.spec.ts
- Notas: Suportar flag whatsapp_inbound_resolved, computar is_replied na fila e fornecer endpoints para marcar como respondido e disparar confirmação de remarcação.

## T-150 — Ocultação do botão de reagendamento após conclusão da remarcação no Frontend [concluida]
- Refs: US-127, AC-224
- Arquivos: frontend/src/features/whatsapp/components/WhatsappQueueView.tsx, frontend/src/features/whatsapp/__tests__/WhatsappQueueView.spec.tsx
- Notas: Não exibir botão de reagendar se a consulta já estiver com status CONFIRMED e data/hora atualizada.

## T-151 — Exibição de opções de resposta e disparo de confirmação de reagendamento no Frontend [concluida]
- Refs: US-127, AC-225
- Arquivos: frontend/src/features/whatsapp/services/whatsapp-queue-api.ts, frontend/src/features/whatsapp/hooks/useWhatsappQueue.ts, frontend/src/features/whatsapp/components/WhatsappQueueView.tsx, frontend/src/features/whatsapp/__tests__/WhatsappQueueView.spec.tsx
- Notas: Exibir botão de enviar confirmação de novo horário e marcar como respondido enquanto is_replied for falso.

## T-152 — Transição visual para estado de respondido e ocultação dos botões no Frontend [concluida]
- Refs: US-127, AC-226
- Arquivos: frontend/src/features/whatsapp/components/WhatsappQueueView.tsx, frontend/src/features/whatsapp/__tests__/WhatsappQueueView.spec.tsx
- Notas: Quando is_replied for verdadeiro, ocultar botões de resposta e exibir badge elegante Respondido.
