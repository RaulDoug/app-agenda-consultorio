# Tasks: Filtro e Reativação de Clientes Inativos

> feature: filtro-reativacao-clientes

## T-168 — Suporte a Reativação e Consulta de Inativos no Backend PostgreSQL [concluida]
- Refs: US-139, AC-249
- Arquivos: backend/src/repositories/patient-repository.ts, backend/src/services/patient-service.ts, backend/src/repositories/__tests__/patient-repository.spec.ts
- Notas: Ajustar `findAll` no repositório de pacientes para incluir registros soft-deleted quando `includeInactive: true`, ajustar `update` para remover a restrição `deleted_at IS NULL` permitindo reativação (`is_active: true` redefine `deleted_at = NULL`), e cobrir com testes unitários no PostgreSQL.

## T-169 — Método reactivatePatient e Busca por Telefone no Repositório Local [concluida]
- Refs: US-138, AC-248
- Arquivos: frontend/src/db/repositories/patient-local-repository.ts, frontend/src/db/repositories/__tests__/patient-local-repository.spec.ts
- Notas: Implementar `reactivatePatient` e `findPatientByPhone` no `PatientLocalRepository` com validação de colisão de WhatsApp com outros pacientes ativos, persistência atômica no Dexie (`is_active: true`, `deleted_at: null`), enfileiramento de mutação `UPDATE` na `sync_outbox` e testes unitários com `fake-indexeddb`.

## T-170 — Filtro de Status, Badges Visuais e Reativação em PatientList e PatientCard [concluida]
- Refs: US-137, AC-246, AC-247
- Arquivos: frontend/src/features/patients/components/PatientList.tsx, frontend/src/features/patients/components/PatientCard.tsx, frontend/src/App.tsx, frontend/src/features/patients/__tests__/filtro-reativacao-paciente-ui.spec.tsx
- Notas: Implementar pílulas de filtro ("Ativos", "Inativos", "Todos") com contadores, busca contextual e empty states em `PatientList`; estilização tracejada/esmaecida, badge "Inativo" e botão "Reativar" em `PatientCard`; passar `allPatients` e `handleReactivatePatient` no `App.tsx`; e criar suíte de testes de UI.

## T-171 — Validação de WhatsApp Ativo/Inativo e Reativação nos Cadastros (Modal e Agenda) [concluida]
- Refs: US-140, AC-250
- Arquivos: frontend/src/features/patients/components/CreatePatientModal.tsx, frontend/src/features/agenda/components/InlinePatientForm.tsx, frontend/src/features/patients/__tests__/cadastro-duplicidade-reativacao.spec.tsx
- Notas: Detectar ao validar ou cadastrar se o número informado pertence a um cliente inativo; exibir alerta específico identificando o paciente inativo e fornecendo botão "Reativar Cadastro" que restaura o paciente e o seleciona/salva de imediato; manter aviso padrão de bloqueio caso o cliente já seja ativo; e cobrir com testes de componente para ambos os formulários.

## T-172 — Card de Lista de Pacientes Ordenada Alfabeticamente com Rolagem Dinâmica na Agenda [concluida]
- Refs: US-141, AC-251
- Arquivos: frontend/src/features/agenda/components/InlinePatientForm.tsx, frontend/src/features/agenda/__tests__/busca-dinamica-pacientes-agenda.spec.tsx
- Notas: Remover a limitação fixa de 5 itens no `InlinePatientForm`, implementar card com listagem ordenada alfabeticamente por nome e carregamento dinâmico incremental por scroll (`infinite scroll` ou paginação virtual), exibição de indicador de quantidade e testes automatizados de rolagem e busca.

## T-173 — Atualização da Documentação Técnica de Frontend e Backend [concluida]
- Refs: US-137, US-138, US-139, US-140, US-141, AC-246, AC-247, AC-248, AC-249, AC-250, AC-251
- Arquivos: docs/frontend/funcionalidades/regras_globais.md, docs/frontend/funcionalidades/cadastro_clientes.md, docs/backend/funcionalidades/regras_globais.md, docs/backend/funcionalidades/cadastro_clientes.md
- Notas: Documentar as novas regras de filtro e reativação de clientes, detecção assistida em cadastros duplicados e a listagem dinâmica com rolagem na agenda rápida em `docs/frontend/funcionalidades/` e `docs/backend/funcionalidades/`.
