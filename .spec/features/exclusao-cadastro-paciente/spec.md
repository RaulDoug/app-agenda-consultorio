# Spec: Exclusão de Cadastro de Paciente

> feature: exclusao-cadastro-paciente
> status: pronta

## Contexto

O sistema permite o cadastro e edição de pacientes, porém não disponibilizava uma opção para excluir clientes que não fazem mais parte do consultório ou foram cadastrados por engano. Para manter a integridade referencial de atendimentos anteriores e transações do fluxo de caixa, a exclusão deve ser lógica (`is_active: false`), removendo o cliente da listagem ativa e das opções de agendamento, com confirmação obrigatória para prevenir exclusões acidentais.

## Histórias

### US-071 — Exclusão Segura de Pacientes da Listagem Ativa

Como recepcionista ou profissional da clínica,
quero poder excluir um paciente diretamente pela interface de clientes,
para manter a base de contatos limpa e remover cadastros indevidos ou obsoletos, com salvaguarda contra exclusões acidentais.

#### AC-116 — Exclusão Lógica e Desativação no Repositório Local de Pacientes

- **Dado** que existe um paciente cadastrado no banco local IndexedDB
- **Quando** o método `deletePatient(id)` do repositório for executado
- **Então** o registro do paciente deve ser atualizado com `is_active: false` e `updated_at` atualizado
- **E** uma mutação do tipo `DELETE` para a entidade `patients` deve ser enfileirada na tabela `sync_outbox`
- **E** os métodos `listPatients` e `searchPatients` não devem mais retornar este paciente na listagem ativa.

#### AC-117 — Ação de Exclusão no Card do Paciente e Modal de Confirmação

- **Dado** que o usuário está visualizando a listagem de clientes e expande o card de um paciente (ou abre o modal de edição)
- **Quando** clica no botão "Excluir" (`data-testid="btn-delete-patient-{id}"`)
- **Então** um modal de confirmação deve ser exibido com o nome do paciente e aviso de remoção da lista ativa
- **E** ao clicar em "Cancelar", a exclusão é abortada mantendo o paciente intacto
- **E** ao clicar em "Sim, Excluir", o paciente é desativado no repositório, o modal se fecha e o paciente desaparece reativamente da listagem de clientes.

## Fora de escopo

- Exclusão física (hard-delete) cascateada de prontuários, agendamentos passados ou transações financeiras vinculadas (histórico preservado por integridade).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-037 | A exclusão do paciente deve ser lógica (`is_active: false`) para preservar o histórico financeiro e clínico de consultas passadas. | confirmada | Confirmado pela arquitetura do sistema e boas práticas clínicas. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-037 | A exclusão de paciente deve exigir confirmação explícita em dois passos? | respondida | Sim, deve haver um diálogo de confirmação claro para prevenir exclusões acidentais. |
