# Tarefas: Correções e Edição de Procedimentos na Agenda

> feature: correcoes-agenda-procedimentos

## T-070 — Frontend: Reset de Ciclo de Vida da Gaveta de Criação Rápida [concluida]
- Refs: US-053, AC-089
- Arquivos: frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx
- Notas: Limpar paciente, procedimentos, notas e destravar isSubmitting ao abrir ou fechar a gaveta.

## T-071 — Frontend: Deduplicação e Seeds Determinísticos de Procedimentos [concluida]
- Refs: US-053, AC-090
- Arquivos: frontend/src/db/repositories/procedure-local-repository.ts, frontend/src/features/agenda/components/InlineProcedureForm.tsx
- Notas: Usar IDs determinísticos para seeds e checagem de existência por nome antes de inserir, evitando duplicações por concorrência.

## T-072 — Frontend: Ocupação Contínua de Horários em Consultas Longas no ScheduleGrid [concluida]
- Refs: US-054, AC-091
- Arquivos: frontend/src/features/agenda/components/ScheduleGrid.tsx
- Notas: Calcular ocupação por sobreposição completa de minutos, bloqueando horários intermediários de consultas com duração > 30 minutos.

## T-073 — Frontend: Edição Interativa de Procedimentos na Gaveta de Detalhes [concluida]
- Refs: US-054, AC-092
- Arquivos: frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx, frontend/src/App.tsx, frontend/src/db/repositories/appointment-local-repository.ts
- Notas: Permitir alterar serviços do agendamento existente na gaveta de detalhes com recálculo automático de duração e horário de término.

## T-074 — Testes Automatizados com Prova Mecânica e Auditoria CI [concluida]
- Refs: US-053, US-054, AC-089, AC-090, AC-091, AC-092
- Arquivos: frontend/src/features/agenda/__tests__/agenda-fixes-ui.spec.tsx
- Notas: Suíte de testes completa cobrindo os 4 critérios de aceite com anotação @spec: e prova mecânica.
