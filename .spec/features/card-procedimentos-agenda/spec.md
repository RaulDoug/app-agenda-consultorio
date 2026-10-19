# Spec: Visualização Compacta de Procedimentos no Card da Agenda

> feature: card-procedimentos-agenda
> status: pronta

## Contexto

Quando um agendamento possui múltiplos procedimentos/serviços vinculados, a listagem em linha única ou texto corrido longo provocava quebra de layout e transbordamento (overflow) do card em relação ao tamanho da tela. Esta funcionalidade reorganiza a visualização para listar os procedimentos empilhados (um abaixo do outro), limitados a no máximo 2 itens no card fechado com reticências informando o excedente, mantendo a listagem completa ao abrir a gaveta de detalhes.

## Histórias

### US-058 — Visualização Compacta e Empilhada de Procedimentos no Card da Agenda

Como recepcionista ou profissional consultando a grade diária no celular ou desktop,
quero que os procedimentos de cada agendamento apareçam organizados verticalmente e limitados a 2 itens no card fechado com reticências indicativas,
para que o card mantenha dimensões limpas sem estourar o layout da tela.

#### AC-096 — Renderização vertical limitada a no máximo 2 procedimentos com reticências no card fechado

- **Dado** um agendamento com 3 ou mais procedimentos vinculados
- **Quando** o card for renderizado na grade diária da agenda
- **Então** os procedimentos devem ser exibidos um abaixo do outro (empilhados verticalmente), limitados aos 2 primeiros itens, acompanhados de uma linha com reticências indicando os itens restantes (ex: `... (+X mais)`), sem ultrapassar a largura do card ou da tela.

#### AC-097 — Exibição completa de todos os procedimentos na abertura da gaveta de detalhes

- **Dado** um agendamento com múltiplos procedimentos (2 ou mais)
- **Quando** o profissional clica sobre o card para abrir a gaveta de detalhes da consulta
- **Então** todos os procedimentos vinculados devem ser exibidos integralmente com seus respectivos preços e duração, sem omissões.

## Fora de escopo

- Reordenação drag-and-drop de procedimentos dentro do card fechado.
- Alteração da altura dinâmica dos slots de 30min em função do número de itens.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-030 | O limite de 2 procedimentos empilhados com indicador de reticências garante proporção visual harmônica tanto em telas compactas (mobile 360px) quanto em desktop. | confirmada | Validado nos wireframes e diretrizes de design do projeto. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-030 | O que deve ser exibido quando o agendamento tiver exatamente 1 ou 2 procedimentos? | respondida | Exibe os procedimentos diretamente (1 ou 2), sem a linha de reticências excedentes. |
