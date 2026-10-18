# Tasks: Api complementar

> feature: api-complementar

## T-026 — Migração dos Algoritmos de Domínio Puro para `@cliniassist/shared` [concluida]
- Refs: US-026, AC-048
- Arquivos: shared/src/domain/business-hours.ts, shared/src/domain/smart-return.ts, shared/src/financial/calculator.ts, shared/src/financial/installments.ts, shared/src/index.ts
- Notas: Mover funções puras para o pacote compartilhado com testes unitários em `shared/`, mantendo reexportação no backend para preservar 100% de compatibilidade.

## T-027 — Módulo de Autenticação e Emissão de Token JWT Multi-Tenant [concluida]
- Refs: US-021, AC-041, AC-042
- Arquivos: backend/src/routes/auth.ts, backend/src/services/auth-service.ts, backend/src/app.ts
- Notas: Implementar rota `POST /api/auth/login` com validação de senha (ou credencial padrão do tenant), emissão de JWT com `tenant_id` e retorno dos dados cadastrais do consultório.

## T-028 — Sincronização Delta (Pull Sync) do Servidor para o Dispositivo [concluida]
- Refs: US-022, AC-043
- Arquivos: backend/src/routes/sync.ts, backend/src/db/schema.sql
- Notas: Implementar endpoint `GET /api/sync/pull?since=<iso_timestamp>` retornando deltas de alterações ocorridas no servidor para `appointments`, `patients`, `procedures`, `financial_transactions` e `schedule_blocks`.

## T-029 — Gerenciamento de Sessão e Status do WhatsApp com QR Code [concluida]
- Refs: US-023, AC-044
- Arquivos: backend/src/routes/whatsapp.ts, backend/src/whatsapp/evolution-client.ts, backend/src/app.ts
- Notas: Endpoint `GET /api/whatsapp/session` e `POST /api/whatsapp/connect` para verificar conexão e retornar QR Code (base64) em instâncias desconectadas.

## T-030 — Gestão de Expediente e Bloqueios de Agenda [concluida]
- Refs: US-024, AC-045, AC-046
- Arquivos: backend/src/routes/business-hours.ts, backend/src/routes/schedule-blocks.ts, backend/src/app.ts
- Notas: Endpoints REST para consulta/atualização de expediente semanal (`/api/business-hours`) e bloqueios/férias (`/api/schedule-blocks`).

## T-031 — Listagem e Filtro de Transações Financeiras para o Extrato [concluida]
- Refs: US-025, AC-047
- Arquivos: backend/src/routes/financial.ts, backend/src/repositories/financial-repository.ts
- Notas: Implementar `GET /api/financial/transactions` com suporte a filtros de data (`startDate`, `endDate`), status (`PAID`, `PENDING`) e tipo (`INCOME`, `EXPENSE`), respeitando soft delete.

## T-032 — Suíte Integrada de Testes Automatizados TDD da API Complementar [concluida]
- Refs: US-021, US-022, US-023, US-024, US-025, US-026, AC-041, AC-042, AC-043, AC-044, AC-045, AC-046, AC-047, AC-048
- Arquivos: backend/src/api-complementar/__tests__/api-complementar.spec.ts
- Notas: Testes de integração de ponta a ponta com pg-mem cobrindo todos os critérios de aceite AC-041 a AC-048 com prova mecânica.
