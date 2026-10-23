# Funcionalidade: Gestão de Clientes e Pacientes

> **Localização:** `docs/frontend/funcionalidades/cadastro_pacientes.md`  
> **Status:** Ativo / Implementado  
> **Camadas Envolvidas:** `src/features/patients/components/`, `src/features/patients/hooks/`, `src/db/repositories/patient-local-repository.ts`

---

## 1. Visão Geral
Gerenciamento completo da base de pacientes cadastrados no consultório. Focado em velocidade de busca, consulta de histórico clínico, edição de observações importantes e exclusão lógica segura.

---

## 2. Componentes Principais
- `PatientList.tsx`: Listagem com campo de busca em tempo real (filtrando por nome ou WhatsApp), cards expansíveis e contadores de consultas.
- `CreatePatientModal.tsx`: Modal para cadastro ágil de novos pacientes diretamente da aba Clientes.
- `InlinePatientForm.tsx`: Componente de criação rápida inserido na gaveta de agendamento (on-the-fly).
- `ConfirmDeletePatientModal.tsx`: Modal de confirmação segura antes da exclusão lógica de um paciente.

---

## 3. Regras de Interação e Negócio
1. **Busca Instantânea:**
   - A busca atua sobre o cache local Dexie via `useLiveQuery` com resposta em tempo real conforme a digitação.
2. **Formatação e Unicidade de WhatsApp:**
   - Limpeza automática de caracteres não numéricos e formatação visual padrão `(DD) 9XXXX-XXXX`.
   - Bloqueio imediato no salvamento caso já exista outro paciente ativo cadastrado com o mesmo número de WhatsApp no mesmo consultório, exibindo alerta claro com o nome do paciente existente.
3. **Observações Clínicas Contextuais:**
   - Observações e alergias são exibidas em destaque durante o fluxo de agendamento e detalhes da consulta.
4. **Exclusão Lógica (Soft-Delete Local):**
   - Ao excluir um paciente, o registro é marcado com `is_active: false` e enfileirado na `sync_outbox` como `DELETE` (ou update com soft-delete), desaparecendo da listagem ativa sem violar o histórico de atendimentos e transações passadas.
5. **Modal de Confirmação Segura de Exclusão:**
   - A ação de exclusão no card expandido ou no modal de edição aciona obrigatoriamente o `ConfirmDeletePatientModal`. O modal detalha o nome do paciente e avisa sobre a manutenção do histórico financeiro e relatórios passados antes de confirmar a exclusão lógica no Dexie.
