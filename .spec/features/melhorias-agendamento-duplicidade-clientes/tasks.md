# Tasks: Melhorias em Agendamento e Bloqueio de Duplicidade de Clientes

> feature: melhorias-agendamento-duplicidade-clientes

## T-001 — Utilitário de Data/Horário Inteligente e Integração no Agendamento [concluida]

- Refs: US-098, AC-175
- Arquivos: frontend/src/features/agenda/utils/time-slots.ts, frontend/src/App.tsx, frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx
- Notas: Implementado algoritmo que calcula slot futuro para hoje ou avança para dia seguinte pós-expediente.

## T-002 — Exibição Condicional Estrita de Encaixe na Gaveta de Agendamento [concluida]

- Refs: US-099, AC-176
- Arquivos: frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx
- Notas: Removido bloco else de encaixe em horários regulares e resetada flag isExtraFitOverride quando não houver conflito.

## T-003 — Validação de Duplicidade de WhatsApp no Repositório Local e Forms Frontend [concluida]

- Refs: US-100, AC-177
- Arquivos: frontend/src/db/repositories/patient-local-repository.ts, frontend/src/features/patients/components/CreatePatientModal.tsx, frontend/src/features/agenda/components/InlinePatientForm.tsx
- Notas: Bloqueio de criação e edição de paciente com mesmo WhatsApp no IndexedDB e exibição de alerta descritivo.

## T-004 — Validação de Duplicidade de WhatsApp no Repositório e Serviço Backend [concluida]

- Refs: US-100, AC-177
- Arquivos: backend/src/repositories/patient-repository.ts, backend/src/services/patient-service.ts, backend/src/routes/patients.ts
- Notas: Checagem de unicidade por tenant no backend e rejeição com HTTP 409 em tentativas de cadastro com mesmo número.

## T-005 — Suíte de Testes Automatizados TDD, Prova Mecânica e Auditoria CI [concluida]

- Refs: US-098, US-099, US-100, AC-175, AC-176, AC-177
- Arquivos: frontend/src/features/agenda/__tests__/melhorias-agendamento-duplicidade.spec.tsx, backend/src/services/__tests__/patient-service.spec.ts, backend/src/routes/__tests__/patients.routes.spec.ts
- Notas: Cobertura de todos os critérios com @spec:AC-xxx garantindo prova mecânica e aprovação na auditoria CI.
