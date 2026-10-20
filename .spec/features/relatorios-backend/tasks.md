# Tasks: Relatórios Gerenciais do Backend — 4 Camadas, Rentabilidade e Períodos

> feature: relatorios-backend

## T-121 — Modelagem dos Contratos TypeScript de Relatórios [concluida]

- Refs: US-081, US-082, US-083, US-084, US-085, US-086, US-087, AC-137, AC-138, AC-139, AC-140, AC-141, AC-142, AC-143
- Arquivos: shared/src/types/report.ts, shared/src/index.ts
- Notas: Interfaces de entrada (filtros de período) e saída para No-Show, DRE, Recebíveis, Procedimentos Rentáveis, Pacientes Inativos e Histórico.

## T-122 — Camada de Persistência SQL de Relatórios (ReportsRepository) [concluida]

- Refs: US-081, US-082, US-083, US-084, US-085, US-086, AC-137, AC-138, AC-139, AC-140, AC-141, AC-142
- Arquivos: backend/src/repositories/reports-repository.ts, backend/src/repositories/__tests__/reports-repository.spec.ts
- Notas: Queries analíticas parametrizadas com isolamento por tenant_id, filtro de soft-delete (deleted_at IS NULL) e agregação SQL.

## T-123 — Camada de Negócio e Resolução de Períodos (ReportsService) [concluida]

- Refs: US-081, US-082, US-083, US-084, US-085, US-086, US-087, AC-137, AC-138, AC-139, AC-140, AC-141, AC-142, AC-143
- Arquivos: backend/src/services/reports-service.ts, backend/src/services/__tests__/reports-service.spec.ts
- Notas: Lógica de fronteiras de datas para today, this_month, last_30_days, all; cálculo de margens percentuais com 2 casas decimais e resumo amigável.

## T-124 — Camada de Controllers de Relatórios (ReportsController) [concluida]

- Refs: US-081, US-082, US-083, US-084, US-085, US-086, US-087, AC-137, AC-138, AC-139, AC-140, AC-141, AC-142, AC-143
- Arquivos: backend/src/controllers/reports-controller.ts, backend/src/controllers/__tests__/reports-controller.spec.ts
- Notas: Handlers de requisição HTTP, extração e validação de query params e tenant_id com tratamento seguro de erros.

## T-125 — Camada de Rotas REST e Compatibilidade de Analytics [concluida]

- Refs: US-081, US-082, US-083, US-084, US-085, US-086, US-087, AC-137, AC-138, AC-139, AC-140, AC-141, AC-142, AC-143
- Arquivos: backend/src/routes/reports.ts, backend/src/routes/analytics.ts, backend/src/app.ts, backend/src/routes/__tests__/reports.routes.spec.ts
- Notas: Registro de /api/reports com authMiddleware e redirecionamento das rotas antigas de /api/analytics mantendo compatibilidade.

## T-126 — Documentação Técnica das Funcionalidades de Relatórios [concluida]

- Refs: US-081, US-082, US-083, US-084, US-085, US-086, US-087
- Arquivos: docs/backend/funcionalidades/relatorios_gerenciais.md, docs/backend/funcionalidades/regras_globais.md
- Notas: Documentação completa dos contratos, regras de cálculo e consolidação na Seção 9.5 de regras_globais.md.
