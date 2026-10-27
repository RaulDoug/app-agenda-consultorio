# Tasks: Agenda visualizacao periodos

> feature: agenda-visualizacao-periodos

## T-133 — Criar utilitário de formatação de período e contagem de agendamentos [concluida]
- Refs: US-118, AC-204, AC-205
- Arquivos: frontend/src/features/agenda/utils/date-formatters.ts
- Notas: Implementar formatAgendaPeriod, getAgendaPeriodRange e countAppointmentsInPeriod cobrindo dia, semana (mesmo mês, meses distintos e virada de ano) e mês.

## T-134 — Atualizar ViewModeSelector com suporte a período dinâmico e contador [concluida]
- Refs: US-118, AC-204, AC-205
- Arquivos: frontend/src/features/agenda/components/ViewModeSelector.tsx
- Notas: Exibir formatAgendaPeriod, prop appointmentsCount opcional com badge/texto semântico e remover classe CSS capitalize.

## T-135 — Integrar contador reativo e ajuste visual do botão em App.tsx [concluida]
- Refs: US-118, AC-205
- Arquivos: frontend/src/App.tsx
- Notas: Calcular appointmentsCount via useMemo no App.tsx e corrigir o texto do botão para "+ Novo Agendamento" limpo.

## T-136 — Implementar testes automatizados com prova mecânica [concluida]
- Refs: US-118, AC-204, AC-205
- Arquivos: frontend/src/features/agenda/__tests__/agenda-visualizacao-periodos.spec.tsx
- Notas: Testar AC-204 e AC-205 com cenários de borda e validar com onp-spec verify e onp-spec audit.

## T-137 — Atualizar layout em coluna e botão contextual no ViewModeSelector [concluida]
- Refs: US-118, AC-206
- Arquivos: frontend/src/features/agenda/components/ViewModeSelector.tsx, frontend/src/features/agenda/__tests__/agenda-visualizacao-periodos.spec.tsx
- Notas: Implementar layout vertical em 3 linhas (navegação rápida no topo, período/contador centralizados no meio, abas abaixo) e rótulo dinâmico ("Hoje", "Esta semana", "Este mês").
