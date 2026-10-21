# Tasks: Sincronização de Movimentações Financeiras Offline-First

> feature: sincronizacao-financeiro-offline

## T-001 — Ingestão e Upsert de Transações Financeiras com LWW no Sync Batch [concluida]

- Refs: US-112, AC-193, AC-194
- Arquivos: `backend/src/routes/sync.ts`
- Notas: Extrair mutações com `m.entity === 'financial_transactions'` no endpoint `POST /api/sync/batch`. Implementar persistência atômica no PostgreSQL com cláusula `tenant_id = req.tenantId`, resolução Last-Write-Wins (comparando `updated_at`) e suporte a operações INSERT, UPDATE e DELETE (soft-delete).

## T-002 — Suporte a Procedimentos Cadastrados Offline no Sync Batch [concluida]

- Refs: US-112, AC-193
- Arquivos: `backend/src/routes/sync.ts`
- Notas: Tratar mutações de `m.entity === 'procedures'` no `POST /api/sync/batch` para que novos procedimentos cadastrados offline também sejam salvos com segurança no PostgreSQL.

## T-003 — Blindagem de Sincronização e Restauração no Frontend [concluida]

- Refs: US-113, AC-195
- Arquivos: `frontend/src/sync/sync-manager.ts`, `frontend/src/features/auth/hooks/AuthContext.tsx`
- Notas: Assegurar que o `SyncManager.push()` verifique a resposta do backend e que o `pull()` inicial hidrate o IndexedDB localmente, restaurando integralmente os lançamentos de receitas e despesas no Livro Caixa.

## T-004 — Suíte de Testes Automatizados TDD Integrada e Prova Mecânica [concluida]

- Refs: US-112, US-113, AC-193, AC-194, AC-195
- Arquivos: `backend/src/routes/__tests__/sincronizacao-financeiro-offline.spec.ts`
- Notas: Implementar testes automatizados cobrindo os critérios AC-193, AC-194 e AC-195 com prova mecânica via `onp-spec verify` e `onp-spec audit`.
