# Tarefas: Banco Local IndexedDB (Dexie.js) e Sincronização Offline-First — CliniAssist (Sprint FE-1)

> feature: banco-local-sync

## T-036 — Definição do Schema Dexie.js e Inicialização do Banco Local [concluida]
- Refs: US-030, AC-053
- Arquivos: frontend/src/db/local-db.ts, frontend/src/db/types.ts
- Notas: Implementar classe Dexie com tabelas locais indexadas: `patients`, `procedures`, `appointments`, `appointment_items`, `financial_transactions`, `business_hours`, `schedule_blocks` e `sync_outbox`.

## T-037 — Escrita Otimista com Enfileiramento na Outbox [concluida]
- Refs: US-031, AC-054
- Arquivos: frontend/src/db/outbox.ts, frontend/src/db/repositories/appointment-local-repository.ts, frontend/src/db/repositories/patient-local-repository.ts
- Notas: Implementar repositórios locais para agendamentos e pacientes que executam gravação atômica no Dexie e enfileiramento na `sync_outbox` com status `PENDING`.

## T-038 — Sincronizador Bidirecional, Poda de Cache e Hook de Conexão [concluida]
- Refs: US-032, US-033, AC-055, AC-056
- Arquivos: frontend/src/sync/sync-manager.ts, frontend/src/sync/pruning.ts, frontend/src/hooks/useConnectionStatus.ts
- Notas: Implementar `SyncManager` para push e pull delta com resiliência a falhas de rede, rotina de poda para registros concluídos com mais de 90 dias, e hook reativo `useConnectionStatus`.

## T-039 — Suíte de Testes Automatizados TDD do Banco Local e Sincronização [concluida]
- Refs: US-030, US-031, US-032, US-033, AC-053, AC-054, AC-055, AC-056
- Arquivos: frontend/src/db/__tests__/local-db.spec.ts
- Notas: Suíte de testes com fake-indexeddb cobrindo AC-053 a AC-056 com prova mecânica completa.
