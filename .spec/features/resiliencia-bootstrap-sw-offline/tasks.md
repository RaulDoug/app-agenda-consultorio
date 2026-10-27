# Tasks: Resiliencia bootstrap sw offline

> feature: resiliencia-bootstrap-sw-offline

## T-001 — Mover AuthenticatedApp para App.tsx e implementar mountApp idempotente em main.tsx [concluida]
- Refs: US-119, AC-207
- Arquivos: `frontend/src/App.tsx`, `frontend/src/main.tsx`, `frontend/src/__tests__/bootstrap-sw-resilience.spec.tsx`
- Notas: Exportar AuthenticatedApp a partir de App.tsx, remover do main.tsx e criar mountApp idempotente armazenando a referência de root para evitar duplicidade de createRoot.

## T-002 — Refatorar sw.js para Network-First com trava de segurança GET e atualizar documentação [concluida]
- Refs: US-119, AC-208
- Arquivos: `frontend/public/sw.js`, `frontend/src/__tests__/bootstrap-sw-resilience.spec.tsx`, `docs/frontend/funcionalidades/regras_globais.md`
- Notas: Atualizar sw.js com versão v5, filtro estrito de GET e exclusão de /api, inverter para Network-First com fallback no catch para cache offline, e atualizar regras globais.
