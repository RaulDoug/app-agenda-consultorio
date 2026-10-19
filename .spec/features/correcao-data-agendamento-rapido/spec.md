# Spec: Seleção de Data no Agendamento Rápido

> feature: correcao-data-agendamento-rapido
> status: pronta

## Contexto

Ao acionar o botão de agendamento rápido (seja pelo botão central '+' flutuante na barra inferior ou a partir de qualquer atalho), o profissional precisa poder selecionar a data do atendimento além do horário de início, permitindo agendar consultas para qualquer dia futuro diretamente pelo formulário.

## Histórias

### US-066 — Seleção Dinâmica de Data no Card/Gaveta de Agendamento Rápido

Como profissional ou recepcionista do consultório,
quero poder escolher e alterar a data do agendamento dentro da gaveta de criação rápida,
para conseguir agendar atendimentos para dias futuros sem ter que navegar manualmente pela grade antes de abrir o formulário.

#### AC-108 — Campo de Seleção de Data no Agendamento Rápido

- **Dado** que a gaveta de agendamento rápido (`QuickAppointmentDrawer`) é aberta a partir de qualquer atalho ou botão central '+'
- **Quando** o formulário é exibido na tela
- **Então** deve estar presente um campo interativo de seleção de data (`input[type="date"]`) pré-preenchido com a data inicial
- **E** ao alterar a data no campo, o cabeçalho e a data do atendimento gravado devem refletir a nova data escolhida.

#### AC-109 — Validação de Conflito Reativo ao Alterar a Data

- **Dado** que já existe uma consulta agendada em um dia específico às 14:00
- **Quando** o usuário abre o agendamento rápido e altera a data para esse dia com conflito no horário das 14:00
- **Então** o sistema deve detectar reativamente a sobreposição e exibir o alerta de encaixe para o novo dia selecionado.

## Fora de escopo

- Alteração da grade de horários do passado para edição retroativa.
- Agendamentos recorrentes automáticos em lote (fora deste escopo).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-034 | A data sugerida por padrão no input de data é a data selecionada atualmente na grade ou a data atual (Hoje) | confirmada | Inicializa com initialDate |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-034 | Nenhuma pergunta pendente | respondida | Decisão aprovada pelo usuário |
