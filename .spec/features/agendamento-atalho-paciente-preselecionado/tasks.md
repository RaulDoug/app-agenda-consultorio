# Tarefas: Agendamento com Paciente Pré-Selecionado via Atalho do Card

> feature: agendamento-atalho-paciente-preselecionado

## T-101 — Frontend: Suporte a initialPatient em QuickAppointmentDrawer.tsx e Conexão em App.tsx [concluida]
- Refs: US-070, AC-114, AC-115
- Arquivos: frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx, frontend/src/App.tsx
- Notas: Adicionar prop opcional `initialPatient?: LocalPatient | null` no `QuickAppointmentDrawer`, inicializar `selectedPatient` com `initialPatient || null` no `useEffect` de abertura, e no `App.tsx` gerenciar o estado `quickPatient: LocalPatient | null` preenchendo-o no `onSchedule` do `PatientList` e `InactivePatientsList`, e limpando-o nas aberturas via slot ou FAB.

## T-102 — Testes Automatizados TDD com Prova Mecânica e Auditoria CI [concluida]
- Refs: US-070, AC-114, AC-115
- Arquivos: frontend/src/features/agenda/__tests__/quick-appointment-preselected-patient.spec.tsx
- Notas: Criar suíte TDD RTL cobrindo os critérios AC-114 e AC-115, gravar a prova via `onp-spec verify agendamento-atalho-paciente-preselecionado` e garantir código 0 no `onp-spec audit --ci`.
