# Spec: Agendamento com Paciente Pré-Selecionado via Atalho do Card

> feature: agendamento-atalho-paciente-preselecionado
> status: pronta

## Contexto

Ao navegar pela listagem de Clientes & Pacientes (ou pela lista de reativação de inativos), o usuário clica no botão de atalho "+ Agendar" presente no card de um cliente específico. Atualmente, a gaveta de agendamento abria com o campo de paciente vazio, exigindo que o usuário buscasse e selecionasse o mesmo paciente novamente. O fluxo esperado é que a gaveta abra imediatamente com o paciente em questão já pré-selecionado, pronto para a escolha de horário e procedimentos.

## Histórias

### US-070 — Agendamento Rápido com Paciente Pré-Carregado a partir do Atalho de Cliente

Como recepcionista ou profissional do consultório,
quero que ao clicar no botão "+ Agendar" no card de um cliente, a gaveta de agendamento abra com esse paciente já selecionado,
para economizar tempo e evitar a necessidade de redigitar ou buscar o mesmo cliente duas vezes.

#### AC-114 — Pré-Seleção Automática do Paciente ao Acionar o Atalho "+ Agendar"

- **Dado** que o usuário está visualizando a lista de clientes
- **Quando** clica no botão de atalho "+ Agendar" no card de um paciente
- **Então** a gaveta de agendamento rápido deve abrir com esse paciente já selecionado no formulário (`selectedPatient`), exibindo seu nome, WhatsApp e observações clínicas (se houver)
- **E** o botão "Salvar Agendamento" deve considerar o paciente selecionado válido para envio.

#### AC-115 — Isolamento e Reset de Seleção para Aberturas Avulsas

- **Dado** que um agendamento foi aberto anteriormente através de um atalho de cliente
- **Quando** a gaveta é fechada e posteriormente aberta pelo botão central '+' flutuante da barra de navegação ou pelo clique em um slot vago da grade
- **Então** o formulário deve abrir limpo, sem nenhum paciente pré-selecionado.

## Fora de escopo

- Alteração da lógica de concorrência ou detecção de conflitos de horário.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-036 | O paciente pré-selecionado pode ser alterado através do botão "Trocar" dentro do próprio formulário | confirmada | Comportamento padrão do InlinePatientForm |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-036 | Nenhuma pergunta pendente | respondida | Requisito direto do teste TM-PAC-03 |
