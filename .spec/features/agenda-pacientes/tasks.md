# Tarefas: Agenda de Atendimentos e Gestão de Clientes (Sprint FE-2)

> feature: agenda-pacientes

## T-040 — Componentes da Grade de Horários (Dia/Semana/Mês) em slots de 30m e Cards com Cores Semânticas [concluida]
- Refs: US-034, AC-057, AC-058
- Arquivos: frontend/src/features/agenda/components/ScheduleGrid.tsx, frontend/src/features/agenda/components/AppointmentCard.tsx, frontend/src/features/agenda/components/ViewModeSelector.tsx
- Notas: Renderização dos slots de 30 minutos, intervalo de almoço visual, seletor de visão (Dia, Semana, Mês), e cards com cores semânticas e acessíveis dos status.

## T-041 — Gaveta de Criação Rápida (<10s) com Cadastro On-the-Fly e Alerta de Encaixe [concluida]
- Refs: US-035, AC-059, AC-060
- Arquivos: frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx, frontend/src/features/agenda/components/InlinePatientForm.tsx, frontend/src/features/agenda/components/InlineProcedureForm.tsx
- Notas: Abertura da gaveta rápida ao clicar no slot, autocomplete ou criação inline de paciente/procedimento, detecção de sobreposição/fora do horário com banner de "Encaixe" e prevenção contra duplo clique.

## T-042 — Ações Rápidas de Status (Marcar Falta) e Modal de Remarcação com Calendário [pendente]
- Refs: US-036, AC-061, AC-062
- Arquivos: frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx, frontend/src/features/agenda/components/RescheduleModal.tsx
- Notas: Ação de 1 toque para marcar falta (NO_SHOW), alteração de status com sincronização no Dexie e modal de remarcação com calendário e escolha de novos horários livres.

## T-043 — Carteira de Clientes com Indicadores de Retorno/Cancelamento e Procedimentos Padrão [pendente]
- Refs: US-037, AC-063, AC-064
- Arquivos: frontend/src/features/patients/components/PatientList.tsx, frontend/src/features/patients/components/PatientCard.tsx, frontend/src/features/agenda/hooks/useAgendaProcedures.ts
- Notas: Listagem com busca de clientes, badges ("Novo / Sem consultas anteriores", "Próxima consulta: DD/MM", "Consulta cancelada sem reagendamento") e procedimentos padrão genéricos com multisseleção e cálculo de duração/valor total.

## T-044 — Suíte de Testes Automatizados TDD da Agenda e Pacientes no Frontend [pendente]
- Refs: US-034, US-035, US-036, US-037, AC-057, AC-058, AC-059, AC-060, AC-061, AC-062, AC-063, AC-064
- Arquivos: frontend/src/features/agenda/__tests__/agenda-ui.spec.ts, frontend/src/features/patients/__tests__/patients-ui.spec.ts
- Notas: Suíte completa com React Testing Library e fake-indexeddb com anotações @spec:AC-057 a @spec:AC-064 para verificação mecânica.
