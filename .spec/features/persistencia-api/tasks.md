# Tasks: Persistencia api

> feature: persistencia-api

## T-008 — Infraestrutura SQL: Schema DDL e Gerenciador de Conexão com Postgres [em-andamento]
- Refs: US-007, US-008, US-009, US-010
- Arquivos: backend/src/db/schema.sql, backend/src/db/connection.ts
- Notas: Definição do schema SQL compatível com pg e pg-mem e factory de pool/cliente.

## T-009 — Middleware de Autenticação JWT e Contexto Multi-Tenant [concluida]
- Refs: US-007, AC-011, AC-012
- Arquivos: backend/src/middlewares/auth.ts, backend/src/routes/__tests__/api.spec.ts
- Notas: Extração de tenant_id a partir do Bearer Token e bloqueio 401 Unauthorized para acessos sem token.

## T-010 — Repositórios SQL e Rotas de Pacientes e Procedimentos [concluida]
- Refs: US-008, AC-013, AC-014
- Arquivos: backend/src/repositories/patient-repository.ts, backend/src/repositories/procedure-repository.ts, backend/src/routes/patients.ts, backend/src/routes/procedures.ts, backend/src/routes/__tests__/api.spec.ts
- Notas: CRUD on-the-fly, queries parametrizadas ($1, $2) e soft delete obrigatório com is_active: false e deleted_at.

## T-011 — Repositório Transacional e Rotas de Agendamentos [pendente]

- Refs: US-009, AC-015, AC-016
- Arquivos: backend/src/repositories/appointment-repository.ts, backend/src/routes/appointments.ts, backend/src/routes/__tests__/api.spec.ts
- Notas: Inserção atômica em appointments e appointment_items com rollback automático e rejeição 409 Conflict em double booking.

## T-012 — Rota de Sincronização em Lote Offline-First e Setup do App Express [pendente]

- Refs: US-010, AC-017, AC-018
- Arquivos: backend/src/routes/sync.ts, backend/src/app.ts, backend/src/routes/__tests__/api.spec.ts
- Notas: Endpoint POST /api/sync/batch com resolução Last-Write-Wins e idempotência por UUID.
