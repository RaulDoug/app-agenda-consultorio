# Tarefas: Seleção de Data no Agendamento Rápido

> feature: correcao-data-agendamento-rapido

## T-095 — Frontend: Adição do Campo de Data e Recálculo Reativo de Conflitos [concluida]
- Refs: US-066, AC-108, AC-109
- Arquivos: frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx, frontend/src/App.tsx
- Notas: Implementar estado `dateStr` inicializado com a data local `YYYY-MM-DD`, renderizar input `type="date"` com `data-testid="input-appointment-date"`, recalcular `startIso`, `endIso`, `isOverlapping` e o cabeçalho formatado com base na data selecionada, e sincronizar a data criada no `App.tsx`.

## T-096 — Testes Automatizados TDD com Prova Mecânica e Auditoria CI [concluida]
- Refs: US-066, AC-108, AC-109
- Arquivos: frontend/src/features/agenda/__tests__/quick-appointment-date.spec.tsx
- Notas: Criar suíte TDD RTL cobrindo AC-108 e AC-109, registrar prova mecânica via `onp-spec verify correcao-data-agendamento-rapido` e garantir saída zero no `onp-spec audit --ci`.
