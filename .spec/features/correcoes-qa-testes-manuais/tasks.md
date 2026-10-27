# Tasks: Correções de QA dos Testes Manuais

> feature: correcoes-qa-testes-manuais

## T-001 — Service Worker para Offline Shell e Tratamento de 401 no Sync [concluida]
- Refs: US-114, AC-196, AC-197
- Arquivos: `frontend/public/sw.js`, `frontend/src/main.tsx`, `frontend/src/sync/sync-manager.ts`, `frontend/src/features/auth/hooks/AuthContext.tsx`, `frontend/src/sync/__tests__/sync-manager.spec.ts`
- Notas: Implementar sw.js com cache do App Shell e fallback offline para /index.html. Registrar no main.tsx. Adicionar onUnauthorized no SyncManager tratando status 401 para logout imediato.

## T-002 — Expansão Dinâmica da Grade Diária para Encaixes Fora de Expediente [concluida]
- Refs: US-115, AC-198
- Arquivos: `frontend/src/features/agenda/components/ScheduleGrid.tsx`, `frontend/src/features/agenda/__tests__/schedule-grid-extra-fit.spec.tsx`
- Notas: Em ScheduleGrid.tsx, expandir slots dinamicamente quando houver agendamentos fora de [startHour, endHour) e sinalizar com badge 'Horário Extra'.

## T-003 — Validações de Conflito, Almoço e Expediente no RescheduleModal [concluida]
- Refs: US-115, AC-199
- Arquivos: `frontend/src/features/agenda/components/RescheduleModal.tsx`, `frontend/src/db/repositories/appointment-local-repository.ts`, `frontend/src/features/agenda/__tests__/agenda-ux-reschedule.spec.tsx`
- Notas: Verificar se nova data/horário conflita com consulta ativa, almoço, fora de expediente ou domingo, exigindo autorização de encaixe via checkbox antes de confirmar.

## T-004 — Soft-Delete de Pacientes no Sync/Batch e Normalização DDI 55 [concluida]
- Refs: US-116, AC-200, AC-201
- Arquivos: `backend/src/routes/sync.ts`, `frontend/src/db/types.ts`, `frontend/src/db/repositories/patient-local-repository.ts`, `backend/src/api-complementar/__tests__/sync-patients-soft-delete.spec.ts`, `frontend/src/db/repositories/__tests__/patient-local-repository.spec.ts`
- Notas: Tratar isDeleteOp em patients no sync/batch gravando is_active = false e deleted_at no PostgreSQL. Adicionar deleted_at em LocalPatient e normalizar DDI 55 na checagem de duplicidade.

## T-005 — Bloqueio de Entrada Maior ou Igual ao Total no Parcelamento [concluida]
- Refs: US-117, AC-202
- Arquivos: `frontend/src/features/checkout/components/InstallmentsForm.tsx`, `frontend/src/features/checkout/__tests__/checkout-ui.spec.tsx`
- Notas: Alterar validação para entryCents >= totalCents, exibindo erro orientativo e impedindo submissão com 0 parcelas futuras.

## T-006 — Projeção Trimestral de Recebíveis no Relatório DRE (30/60/90 Dias) [concluida]
- Refs: US-117, AC-203
- Arquivos: `frontend/src/features/analytics/utils/reports-calculator.ts`, `frontend/src/features/analytics/__tests__/reports-calculator.spec.ts`
- Notas: Ajustar calculateReceivablesProjection para usar janelas de meses de calendário (31, 62 e 93 dias) normalizadas à meia-noite local, cobrindo as 3 parcelas mensais de R$ 300.

## T-007 — Correção do Script test-confirmation-flow.ts para Tenant Dinâmico e Sem Duplicação [concluida]
- Refs: US-116, AC-201
- Arquivos: `backend/scripts/test-confirmation-flow.ts`
- Notas: Tornar tenantId dinâmico buscando primeiro tenant ativo, higienizar telefone com e sem 55 e buscar paciente existente sem gerar duplicata.

## T-004 — Soft-Delete de Pacientes no Sync/Batch e Normalização DDI 55 [concluida]
- Refs: US-116, AC-200, AC-201
- Arquivos: `backend/src/routes/sync.ts`, `frontend/src/db/types.ts`, `frontend/src/db/repositories/patient-local-repository.ts`, `backend/src/api-complementar/__tests__/sync-patients-soft-delete.spec.ts`, `frontend/src/db/repositories/__tests__/patient-local-repository.spec.ts`
- Notas: Tratar isDeleteOp em patients no sync/batch gravando is_active = false e deleted_at no PostgreSQL. Adicionar deleted_at em LocalPatient e normalizar DDI 55 na checagem de duplicidade.

## T-005 — Bloqueio de Entrada Maior ou Igual ao Total no Parcelamento [concluida]
- Refs: US-117, AC-202
- Arquivos: `frontend/src/features/checkout/components/InstallmentsForm.tsx`, `frontend/src/features/checkout/__tests__/checkout-ui.spec.tsx`
- Notas: Alterar validação para entryCents >= totalCents, exibindo erro orientativo e impedindo submissão com 0 parcelas futuras.

## T-006 — Projeção Trimestral de Recebíveis no Relatório DRE (30/60/90 Dias) [concluida]
- Refs: US-117, AC-203
- Arquivos: `frontend/src/features/analytics/utils/reports-calculator.ts`, `frontend/src/features/analytics/__tests__/reports-calculator.spec.ts`
- Notas: Ajustar calculateReceivablesProjection para usar janelas de meses de calendário (31, 62 e 93 dias) normalizadas à meia-noite local, cobrindo as 3 parcelas mensais de R$ 300.

## T-007 — Correção do Script test-confirmation-flow.ts para Tenant Dinâmico e Sem Duplicação [concluida]
- Refs: US-116, AC-201
- Arquivos: `backend/scripts/test-confirmation-flow.ts`
- Notas: Tornar tenantId dinâmico buscando primeiro tenant ativo, higienizar telefone com e sem 55 e buscar paciente existente sem gerar duplicata.

