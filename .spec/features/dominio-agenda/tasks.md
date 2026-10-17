# Tasks: Dominio agenda

> feature: dominio-agenda

## T-001 — Modelagem dos Tipos e Contratos Compartilhados [em-andamento]
- Refs: US-001, US-002, US-003, US-004, US-005, US-006
- Arquivos: shared/src/types/appointment.ts, shared/src/types/patient.ts, shared/src/types/procedure.ts, shared/src/types/business-hours.ts, shared/src/types/financial.ts, shared/src/index.ts
- Notas: Contratos e interfaces base para agendamentos, procedimentos, pacientes e expediente compartilhados entre backend e frontend.

## T-002 — Funções de Domínio: Duração Dinâmica e Validação de Procedimentos [pendente]

- Refs: US-001, AC-001, AC-002
- Arquivos: backend/src/domain/duration.ts, backend/src/domain/__tests__/schedule-domain.spec.ts
- Notas: Cálculo cumulativo de duração de múltiplos procedimentos e validação de durações positivas.

## T-003 — Funções de Domínio: Normalização e Validação de Telefones WhatsApp [pendente]

- Refs: US-002, AC-003, AC-004
- Arquivos: backend/src/domain/phone.ts, backend/src/domain/__tests__/schedule-domain.spec.ts
- Notas: Sanitização para DDI 55 + DDD + 9 dígitos e rejeição de entradas inválidas.

## T-004 — Funções de Domínio: Validação de Expediente e Encaixe com Soft-Warning [pendente]

- Refs: US-003, AC-005, AC-006
- Arquivos: backend/src/domain/business-hours.ts, backend/src/domain/__tests__/schedule-domain.spec.ts
- Notas: Identificação de conflito com intervalo de almoço e fechamento, com aprovação via flag confirm_overtime.

## T-005 — Funções de Domínio: Algoritmo de Retorno Inteligente [pendente]

- Refs: US-004, AC-007
- Arquivos: backend/src/domain/smart-return.ts, backend/src/domain/__tests__/schedule-domain.spec.ts
- Notas: Retorno dos 3 slots vagos mais próximos dentro do expediente em caso de colisão ou dia fechado.

## T-006 — Funções de Domínio: Máquina de Estados e Imutabilidade de Status [pendente]

- Refs: US-005, AC-008, AC-009
- Arquivos: backend/src/domain/appointment-state.ts, backend/src/domain/__tests__/schedule-domain.spec.ts
- Notas: Validação de transições do ciclo de vida e bloqueio de alteração em consultas COMPLETED ou CANCELLED.

## T-007 — Funções de Domínio: Fuso Horário UTC-3 e Exportações [pendente]

- Refs: US-006, AC-010
- Arquivos: backend/src/domain/timezone.ts, backend/src/domain/index.ts, backend/src/domain/__tests__/schedule-domain.spec.ts
- Notas: Preservação de data civil em consultas noturnas no fuso America/Sao_Paulo e index agregador.
