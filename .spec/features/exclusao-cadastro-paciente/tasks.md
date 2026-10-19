# Tasks: Exclusão de Cadastro de Paciente

> feature: exclusao-cadastro-paciente

## T-103 — Método deletePatient com soft-delete e mutação na outbox em PatientLocalRepository [concluida]
- Refs: US-071, AC-116
- Arquivos: frontend/src/db/repositories/patient-local-repository.ts
- Notas: Implementa exclusão lógica atualizando is_active para false e gravando evento DELETE na outbox.

## T-104 — Ação de exclusão no PatientCard, modal de confirmação e integração reativa no App [concluida]
- Refs: US-071, AC-117
- Arquivos: frontend/src/features/patients/components/PatientCard.tsx, frontend/src/features/patients/components/ConfirmDeletePatientModal.tsx, frontend/src/features/patients/components/PatientList.tsx, frontend/src/features/patients/components/CreatePatientModal.tsx, frontend/src/App.tsx
- Notas: Adiciona botão de excluir com diálogo de confirmação seguro e atualização da lista em tempo real.

## T-105 — Testes automatizados TDD com prova mecânica e auditoria CI [concluida]
- Refs: US-071, AC-116, AC-117
- Arquivos: frontend/src/features/patients/__tests__/exclusao-paciente.spec.tsx
- Notas: Garante cobertura completa de AC-116 e AC-117 e gate de auditoria limpo com exit 0.
