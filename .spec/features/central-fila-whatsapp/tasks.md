# Tasks: Central fila whatsapp

> feature: central-fila-whatsapp

## T-138 — Contratos Compartilhados e Migração de Schema para Fila WhatsApp [concluida]
- Refs: US-120, US-121, US-122, AC-209, AC-211, AC-212, AC-213, AC-214
- Arquivos: shared/src/types/whatsapp.ts, shared/src/index.ts, backend/src/db/schema.sql, backend/src/db/migrations/003_whatsapp_queue_columns.sql
- Notas: Tipos WhatsappQueueItem, WhatsappQueueListResponse e colunas whatsapp_queue_excluded, whatsapp_custom_message, whatsapp_queue_order.

## T-139 — Repositório SQL e Métodos de Fila BullMQ com Isolamento Multi-Tenant [concluida]
- Refs: US-120, US-121, AC-209, AC-211, AC-212, AC-213
- Arquivos: backend/src/repositories/whatsapp-repository.ts, backend/src/whatsapp/queue.ts, backend/src/repositories/__tests__/whatsapp-repository.spec.ts
- Notas: Queries parametrizadas para listagem da fila com subqueries de última mensagem, exclusão lógica, edição de mensagem customizada e reordenação.

## T-140 — Services, Controllers e Rotas REST da Central de Fila [concluida]
- Refs: US-120, US-121, US-122, US-123, AC-209, AC-211, AC-212, AC-213, AC-214, AC-215, AC-216
- Arquivos: backend/src/services/whatsapp-service.ts, backend/src/services/whatsapp-scheduler-service.ts, backend/src/controllers/whatsapp-controller.ts, backend/src/routes/whatsapp.routes.ts, backend/src/services/__tests__/whatsapp-service.spec.ts, backend/src/controllers/__tests__/whatsapp-controller.spec.ts
- Notas: Endpoints /api/whatsapp/queue (GET, send-now, message, reorder, pause/resume, status).

## T-141 — Componentes da Central de Fila com Drag & Drop, Filtros e Modais [concluida]
- Refs: US-120, US-121, US-122, US-123, AC-209, AC-210, AC-211, AC-212, AC-213, AC-214, AC-216
- Arquivos: frontend/src/features/whatsapp/components/WhatsappQueueView.tsx, frontend/src/features/whatsapp/components/EditQueueMessageDrawer.tsx, frontend/src/features/whatsapp/components/WhatsappTemplatesDrawer.tsx, frontend/src/features/whatsapp/hooks/useWhatsappQueue.ts, frontend/src/features/whatsapp/services/whatsapp-queue-api.ts, frontend/src/features/whatsapp/__tests__/WhatsappQueueView.spec.tsx
- Notas: Tela reativa com lista reordenável por Drag & Drop, pílulas de status, balão de resposta do paciente, botão wa.me e gavetas.

## T-142 — Integração no MoreMenuHub, App.tsx, Desktop e Auditoria de Ponta a Ponta [concluida]
- Refs: US-124, AC-217
- Arquivos: frontend/src/components/layout/BottomNav.tsx, frontend/src/components/layout/MoreMenuHub.tsx, frontend/src/App.tsx, frontend/src/features/whatsapp/__tests__/WhatsappNavigation.spec.tsx, docs/backend/funcionalidades/whatsapp_evolution.md, docs/frontend/funcionalidades/whatsapp_conexao_qrcode.md
- Notas: Card na aba Mais, navegação, documentação e gate de auditoria.

## T-143 — Botão de Recarregar Lista e Sincronização Sob Demanda na Fila WhatsApp [concluida]
- Refs: US-120, AC-218
- Arquivos: frontend/src/features/whatsapp/components/WhatsappQueueView.tsx, frontend/src/App.tsx, frontend/src/features/whatsapp/__tests__/WhatsappQueueView.spec.tsx
- Notas: Botão de recarregamento manual com animação de spinner, flush da sincronização Dexie outbox e atualização da query REST.
