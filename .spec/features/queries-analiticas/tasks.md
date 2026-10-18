# Tasks: Queries analiticas

> feature: queries-analiticas

## T-023 — Repositório de Queries Analíticas SQL Otimizadas [concluida]
- Refs: US-018, US-019, US-020, AC-035, AC-036, AC-037, AC-038, AC-039, AC-040
- Arquivos: backend/src/repositories/analytics-repository.ts
- Notas: Implementação de queries SQL analíticas com agregação (`COALESCE`, `NULLIF`, `CASE WHEN`, `GROUP BY`, `HAVING`) para taxa de No-Show, DRE simplificado, projeção de 30/60/90 dias, ranking de procedimentos e pacientes inativos (> 180 dias).

## T-024 — Rotas REST de Relatórios e Dashboard Gerencial [concluida]
- Refs: US-018, US-019, US-020, AC-035, AC-036, AC-037, AC-038, AC-039, AC-040
- Arquivos: backend/src/routes/analytics.ts, backend/src/app.ts
- Notas: Endpoints protegidos para consumo dos relatórios gerenciais com filtros de datas (`startDate`, `endDate`) e isolamento multi-tenant estrito.

## T-025 — Suíte Integrada de Testes Automatizados TDD de Analytics [pendente]
- Refs: US-018, US-019, US-020, AC-035, AC-036, AC-037, AC-038, AC-039, AC-040
- Arquivos: backend/src/analytics/__tests__/analytics.spec.ts
- Notas: Testes de ponta a ponta com pg-mem cobrindo todos os critérios AC-035 a AC-040 e edge cases como divisão por zero em clínicas novas.
