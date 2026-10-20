# Tasks: Automacao whatsapp evolution

> feature: automacao-whatsapp-evolution

## T-127 — DDL, Migrations e Contratos Compartilhados [concluida]
- Refs: US-088, US-089, US-090, AC-146, AC-148
- Arquivos: backend/src/db/schema.sql, shared/src/types/whatsapp.ts, shared/src/index.ts
- Notas: Criação das tabelas `whatsapp_settings` e `whatsapp_messages`, modelagem de interfaces e DTOs no shared.

## T-128 — Camada de Repositórios SQL do WhatsApp [concluida]
- Refs: US-089, US-090, AC-146, AC-147, AC-148, AC-149, AC-150
- Arquivos: backend/src/repositories/whatsapp-repository.ts, backend/src/repositories/__tests__/whatsapp-repository.spec.ts
- Notas: Queries parametrizadas para settings, busca de consultas candidatas para confirmação e histórico de mensagens com tenant isolation e soft delete.

## T-129 — Camada de Serviços de Negócio e Scheduler Diário [concluida]
- Refs: US-088, US-089, US-090, AC-144, AC-146, AC-147, AC-148, AC-150
- Arquivos: backend/src/services/whatsapp-service.ts, backend/src/services/whatsapp-scheduler-service.ts, backend/src/services/webhook-service.ts, backend/src/services/__tests__/whatsapp-service.spec.ts, backend/src/services/__tests__/whatsapp-scheduler-service.spec.ts
- Notas: Orquestração do lote de confirmação, parser, réplicas, retry e gravação de histórico de mensagens.

## T-130 — Camada de Controllers HTTP e Validações [concluida]
- Refs: US-088, US-089, US-090, AC-145, AC-146, AC-147, AC-149, AC-150
- Arquivos: backend/src/controllers/whatsapp-controller.ts, backend/src/controllers/webhook-controller.ts, backend/src/controllers/__tests__/whatsapp-controller.spec.ts, backend/src/controllers/__tests__/webhook-controller.spec.ts
- Notas: Controllers desacoplados das rotas, validação de payload, headers e mapeamento de status codes.

## T-131 — Rotas REST, Registro no Express e Suíte Integrada [concluida]
- Refs: US-088, US-089, US-090, US-091, AC-144, AC-145, AC-146, AC-147, AC-148, AC-149, AC-150
- Arquivos: backend/src/routes/whatsapp.routes.ts, backend/src/routes/webhooks.routes.ts, backend/src/routes/__tests__/whatsapp.routes.spec.ts, backend/src/app.ts
- Notas: Roteamento limpo delegado aos controllers com proteção authMiddleware onde aplicável.

## T-132 — Documentação Técnica do Subsistema de WhatsApp [concluida]
- Refs: US-091, AC-150
- Arquivos: docs/backend/funcionalidades/whatsapp_evolution.md, docs/backend/funcionalidades/regras_globais.md
- Notas: Documentação detalhada em docs/backend/funcionalidades/ e atualização de regras_globais.md.
