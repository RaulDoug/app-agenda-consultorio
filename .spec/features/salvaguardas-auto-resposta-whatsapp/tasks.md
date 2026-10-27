# Tasks: Salvaguardas auto resposta whatsapp

> feature: salvaguardas-auto-resposta-whatsapp

## T-159 — Implementar suporte a `auto_reply_scope`, salvaguardas de webhook e limpeza de `{nome}` no Backend [concluida]
- Refs: US-130, AC-234, AC-235, AC-236
- Arquivos: shared/src/types/whatsapp.ts, backend/src/repositories/whatsapp-repository.ts, backend/src/services/webhook-service.ts, backend/src/whatsapp/spintax.ts, backend/src/__tests__/whatsapp-auto-reply-safeguards.spec.ts
- Notas: Adicionar `auto_reply_scope` (`'REGISTERED_ONLY' | 'ALL' | 'DISABLED'`), garantir coluna idempotente em `whatsapp_settings`, filtrar grupos/broadcasts, limpar `{nome}` vazio no `processSpintax` e aplicar regras de escopo e limite diário por telefone no `WebhookService`.

## T-160 — Implementar seletor de escopo de resposta automática junto ao QR Code do WhatsApp no Frontend [concluida]
- Refs: US-130, AC-233
- Arquivos: frontend/src/features/analytics/components/WhatsAppPairingView.tsx, frontend/src/features/settings/components/SettingsView.tsx, frontend/src/App.tsx, frontend/src/features/settings/__tests__/settings-ui.spec.tsx
- Notas: Exibir seletor de 3 opções ("Apenas Cadastrados", "Todos os Contatos", "Desativado") no card de conexão WhatsApp, carregando e persistindo via `/api/whatsapp/settings` com feedback visual.
