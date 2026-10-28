# Tasks: Gestão do Catálogo de Procedimentos e Serviços

> feature: gestao-catalogo-procedimentos

## T-161 — Extensão do Modelo Local e Métodos no ProcedureLocalRepository [concluida]

- Refs: US-134, AC-243
- Arquivos: frontend/src/db/types.ts, frontend/src/db/repositories/procedure-local-repository.ts, frontend/src/db/repositories/__tests__/procedure-local-repository.spec.ts
- Notas: Adicionar campos `cost_cents` e `deleted_at` em `LocalProcedure`, métodos `updateProcedure` e `deleteProcedure` (soft-delete) com transação Dexie e mutação na `sync_outbox`, validações de duração > 0 e valores >= 0, e cobertura de testes com `fake-indexeddb`.

## T-162 — Campo de Custo no Cadastro Rápido de Procedimento na Agenda [concluida]

- Refs: US-133, AC-242
- Arquivos: frontend/src/features/agenda/components/InlineProcedureForm.tsx, frontend/src/features/agenda/__tests__/inline-procedure-cost.spec.tsx
- Notas: Permitir preenchimento do custo operacional (em R$) durante o cadastro inline de procedimentos na gaveta de novo agendamento, persistindo `cost_cents` no repositório.

## T-163 — Componentes de Apresentação da Gestão de Procedimentos [concluida]

- Refs: US-132, AC-239, AC-240, AC-241
- Arquivos: frontend/src/features/procedures/types.ts, frontend/src/features/procedures/components/ProcedureCard.tsx, frontend/src/features/procedures/components/ProcedureList.tsx, frontend/src/features/procedures/components/ProcedureFormModal.tsx, frontend/src/features/procedures/components/ConfirmDeleteProcedureModal.tsx
- Notas: Criar os componentes modulares seguindo padrão One-Thumb mobile, Tailwind CSS, com busca reativa, exibição de duração, preço, custo e margem, modal de criação/edição e modal de exclusão segura.

## T-164 — Integração na Navegação do App (Mais e Desktop) e Testes UI da Feature [concluida]

- Refs: US-132, AC-238, AC-239, AC-240, AC-241
- Arquivos: frontend/src/components/layout/MoreMenuHub.tsx, frontend/src/components/layout/BottomNav.tsx, frontend/src/components/layout/DesktopSidebar.tsx, frontend/src/App.tsx, frontend/src/features/procedures/__tests__/gestao-procedimentos-ui.spec.tsx
- Notas: Conectar o card "Procedimentos & Serviços" na tela Mais com contador de itens, incluir aba no BottomNav e DesktopSidebar, renderizar tela no App.tsx e cobrir fluxos de visualização, busca, criação, edição e exclusão via testes de componentes.

## T-165 — Atualização da Documentação Técnica e Auditoria Final [concluida]

- Refs: US-132, US-133, US-134, AC-238, AC-239, AC-240, AC-241, AC-242, AC-243
- Arquivos: docs/frontend/funcionalidades/gestao_procedimentos.md, docs/frontend/funcionalidades/regras_globais.md
- Notas: Registrar os novos fluxos e padrões na documentação de funcionalidades do frontend e auditar mecanicamente via onp-spec audit --ci.

## T-166 — Filtro de Procedimentos Inativos e Ação de Reativação no Frontend [concluida]
- Refs: US-135, AC-244
- Arquivos: frontend/src/features/procedures/components/ProcedureList.tsx, frontend/src/features/procedures/components/ProcedureCard.tsx, frontend/src/db/repositories/procedure-local-repository.ts, frontend/src/App.tsx, frontend/src/features/procedures/__tests__/gestao-procedimentos-ui.spec.tsx
- Notas: Implementar pílulas de filtro de status (Ativos/Inativos/Todos) em ProcedureList, badge visual Inativo e botão Reativar em ProcedureCard, método reactivateProcedure no repositório local e testes UI automatizados.

## T-167 — Auto-Seed de Procedimentos Padrões no PostgreSQL e Sincronização Outbox [concluida]
- Refs: US-136, AC-245
- Arquivos: backend/src/repositories/procedure-repository.ts, backend/src/routes/sync.ts, backend/src/repositories/__tests__/procedure-repository.spec.ts, frontend/src/db/repositories/procedure-local-repository.ts, frontend/src/sync/__tests__/sync-manager.spec.ts
- Notas: Implementar ensureDefaultProcedures no backend PostgreSQL em findAll e /api/sync/batch, enfileirar mutações INSERT na sync_outbox para seeds locais e cobrir com testes de repositório e sincronização multi-dispositivo.
