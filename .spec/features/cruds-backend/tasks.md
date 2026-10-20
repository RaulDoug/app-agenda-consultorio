# Tasks: CRUDs do Backend — 4 Camadas, Validações e Métricas

> feature: cruds-backend

## T-115 — DDL, Migrations e Contratos Compartilhados [concluida]

- Refs: US-077, US-079, US-080, AC-128, AC-134
- Arquivos: backend/src/db/migrations/002_cruds_schema_updates.sql, backend/src/db/schema.sql, shared/src/types/procedure.ts, shared/src/types/appointment.ts, shared/src/types/financial.ts
- Notas: Criação da tabela financial_categories, group_id em transações, cost_cents em procedimentos e itens de agendamento.

## T-116 — Camada de Pacientes e Procedimentos com Custo e Preço [concluida]

- Refs: US-077, AC-128, AC-129
- Arquivos: backend/src/repositories/patient-repository.ts, backend/src/repositories/procedure-repository.ts, backend/src/services/patient-service.ts, backend/src/services/procedure-service.ts, backend/src/controllers/patient-controller.ts, backend/src/controllers/procedure-controller.ts, backend/src/routes/patients.ts, backend/src/routes/procedures.ts
- Notas: CRUD completo em 4 camadas com soft-delete e isolamento multi-tenant estrito.

## T-117 — Camada de Horários de Atendimento e Bloqueios de Agenda [concluida]

- Refs: US-078, AC-130, AC-131
- Arquivos: backend/src/repositories/business-hours-repository.ts, backend/src/repositories/schedule-block-repository.ts, backend/src/services/business-hours-service.ts, backend/src/services/schedule-block-service.ts, backend/src/controllers/business-hours-controller.ts, backend/src/controllers/schedule-block-controller.ts, backend/src/routes/business-hours.ts, backend/src/routes/schedule-blocks.ts
- Notas: Expediente semanal de 7 dias com auto-seed sem delete, e bloqueios temporais com validação e soft-delete.

## T-118 — Camada de Agendamentos, Conflito Triplo e Estorno Contábil Automático (D-09) [concluida]

- Refs: US-079, AC-132, AC-133
- Arquivos: backend/src/repositories/appointment-repository.ts, backend/src/services/appointment-service.ts, backend/src/controllers/appointment-controller.ts, backend/src/routes/appointments.ts
- Notas: Verificação de bloqueios com título no 409, suporte a encaixe e estorno automático de receitas em cancelamentos de consultas concluídas.

## T-119 — Camada Financeira, Categorias e Métricas em Regime de Caixa [concluida]

- Refs: US-080, AC-134, AC-135, AC-136
- Arquivos: backend/src/repositories/financial-category-repository.ts, backend/src/repositories/financial-repository.ts, backend/src/services/financial-category-service.ts, backend/src/services/financial-service.ts, backend/src/controllers/financial-category-controller.ts, backend/src/controllers/financial-controller.ts, backend/src/routes/financial.ts
- Notas: Categorias por tenant, parcelas agrupadas por group_id, escopo ALL preservando pagas, proteção D-06 e dashboard em regime de caixa.
