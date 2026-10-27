# Tasks: Limite diario replica whatsapp

> feature: limite-diario-replica-whatsapp

## T-147 — Implementar verificação de limite diário de réplicas automáticas no Repositório e Parser [concluida]
- Refs: US-126, AC-222, AC-223
- Arquivos: backend/src/db/schema.sql, backend/src/repositories/whatsapp-repository.ts, backend/src/whatsapp/parser.ts
- Notas: Adicionar suporte à coluna idempotente `is_auto_reply` em `whatsapp_messages`, método `hasAutoReplySentToday` em `WhatsappRepository`, incluir `RESCHEDULE_REQUESTED` em `findRelevantAppointmentForPatient` e preservar status `RESCHEDULE_REQUESTED`/`CONFIRMED` em mensagens livres subsequentes.

## T-148 — Aplicar trava diária de réplica no WebhookService e suíte de testes automatizados [concluida]
- Refs: US-126, AC-222, AC-223
- Arquivos: backend/src/services/webhook-service.ts, backend/src/whatsapp/__tests__/whatsapp-auto-reply.spec.ts, backend/src/services/__tests__/webhook-service.spec.ts
- Notas: Verificar no `WebhookService` se o paciente já recebeu réplica automática no dia atual antes de chamar `sendTextMessage`, gravando o log de mensagens recebidas normalmente e cobrindo com testes `@spec:AC-222` e `@spec:AC-223`.
