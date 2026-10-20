# Tasks: Sincronização e Ciclo de Vida de Agendamentos

> feature: sincronizacao-agendamentos

## T-001 — Backend Parser e Persistência de Mutações (POST /api/sync/batch) [concluida]

- Refs: US-095, AC-166, AC-167
- Arquivos: backend/src/routes/sync.ts, backend/src/routes/__tests__/api.spec.ts
- Notas: Suporte a mutations e persistência atômica com appointment_items implementado e validado.

## T-002 — Backend Idempotência, Last-Write-Wins e Validação de Conflito de Horário [concluida]

- Refs: US-096, AC-169, AC-170, AC-171
- Arquivos: backend/src/routes/sync.ts, backend/src/routes/__tests__/api.spec.ts
- Notas: Idempotência de UUID, LWW por updated_at e encaixes is_extra_fit implementados e validados.

## T-003 — Frontend SyncManager Push e Pull Enriquecido com Confirmação [concluida]

- Refs: US-095, AC-168, AC-174
- Arquivos: frontend/src/sync/sync-manager.ts, frontend/src/sync/__tests__/sync-manager.spec.ts
- Notas: Sincronização segura de outbox e restauração de agendamentos e itens validados.

## T-004 — Frontend Flush Automático no Logout e Alerta de Pendências [concluida]

- Refs: US-097, AC-172, AC-173
- Arquivos: frontend/src/features/auth/hooks/AuthContext.tsx, frontend/src/features/auth/hooks/__tests__/auth-context.spec.tsx, frontend/src/features/auth/components/LogoutConfirmDrawer.tsx
- Notas: Flush automático antes de limpar tabelas locais e alerta no drawer validados.

## T-005 — Testes Integrados, E2E e Documentação Técnica [concluida]

- Refs: US-097, AC-174
- Arquivos: frontend/e2e/sync-appointments.spec.ts, docs/backend/funcionalidades/sincronizacao_agendamentos.md, docs/backend/funcionalidades/regras_globais.md
- Notas: Teste E2E e documentações técnicas finalizadas e atualizadas.
