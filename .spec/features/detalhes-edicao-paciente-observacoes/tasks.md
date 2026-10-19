# Tarefas: Detalhes, Observações Clínicas e Edição de Pacientes

> feature: detalhes-edicao-paciente-observacoes

## T-097 — Frontend: Atualização de CreatePatientModal.tsx com Suporte ao Modo de Edição [concluida]
- Refs: US-068, AC-112
- Arquivos: frontend/src/features/patients/components/CreatePatientModal.tsx
- Notas: Adicionar prop opcional `patientToEdit?: LocalPatient | null` e `onPatientSaved?: (patient: LocalPatient) => void`. Ajustar título para "Editar Paciente", pré-carregar nome, whatsapp e notes, alterar texto do botão para "Salvar Alterações" (`data-testid="btn-save-patient"`) e invocar `patientRepo.updatePatient`.

## T-098 — Frontend: Expansão Interativa, Ícone Indicativo de Observações e Ação de Edição no Card [concluida]
- Refs: US-067, US-068, AC-110, AC-111, AC-112
- Arquivos: frontend/src/features/patients/components/PatientCard.tsx, frontend/src/features/patients/components/PatientList.tsx
- Notas: Implementar estado `isExpanded` no `PatientCard`, badge de observações no cabeçalho quando `patient.notes` estiver preenchido, seção expansível com as observações e histórico, e botão "Editar Cadastro" (`data-testid="btn-edit-patient-{id}"`) acionando `onEdit(patient)`.

## T-099 — Frontend: Destaque de Observações Clínicas em InlinePatientForm.tsx e Integração no App.tsx [concluida]
- Refs: US-069, AC-113, AC-112
- Arquivos: frontend/src/features/agenda/components/InlinePatientForm.tsx, frontend/src/App.tsx
- Notas: Exibir bloco com as observações clínicas do paciente selecionado no `InlinePatientForm` (`data-testid="selected-patient-notes"`). No `App.tsx`, conectar estado `editingPatient` com `PatientList` e `CreatePatientModal`.

## T-100 — Testes Automatizados TDD com Prova Mecânica e Auditoria CI [concluida]
- Refs: US-067, US-068, US-069, AC-110, AC-111, AC-112, AC-113
- Arquivos: frontend/src/features/patients/__tests__/detalhes-edicao-paciente.spec.tsx
- Notas: Criar suíte de testes com @spec:AC-110 a AC-113, registrar prova com `onp-spec verify detalhes-edicao-paciente-observacoes` e assegurar código 0 no `onp-spec audit --ci`.
