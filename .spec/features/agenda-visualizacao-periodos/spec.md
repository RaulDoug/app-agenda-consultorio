# Spec: Agenda visualizacao periodos

> feature: agenda-visualizacao-periodos
> status: pronta

## Contexto

Ao navegar pela agenda nos modos Dia, Semana e Mês, a interface atualmente exibe apenas o dia fixo e sem contexto de intervalo, dificultando a percepção temporal do profissional. Esta melhoria introduz formatação dinâmica de data/período conforme o modo de visualização (Abordagem Direta e Limpa) e um contador reativo de atendimentos no período exibido, além de corrigir a duplicidade no botão de agendamento rápido.

## Histórias

### US-118 — Visualização Dinâmica de Período e Resumo de Atendimentos na Agenda

Como profissional ou recepcionista da clínica,
quero ver o período formatado adequadamente (dia, semana com intervalo de dias ou mês corrente) e a quantidade de atendimentos agendados para aquele intervalo,
para que eu tenha clareza instantânea da minha disponibilidade e do volume de pacientes ao navegar pelo calendário.

#### AC-204 — Formatação Dinâmica de Período no Cabeçalho da Agenda (Dia, Semana, Mês)

- **Dado** que estou na aba de Agenda de Atendimentos
- **Quando** o modo de visualização for alternado entre "Dia", "Semana" e "Mês"
- **Então** o texto de navegação da data deve exibir:
  - No modo **Dia**: `Ter., 27 de out. de 2026` (dia da semana e data com preposições em minúsculo e sem maiúsculas indevidas de CSS);
  - No modo **Semana**: o intervalo de segunda-feira a domingo da semana corrente, usando formato limpo:
    - Mesma semana e mês: `19 – 25 de out. de 2026`
    - Entre meses diferentes: `26 de out. – 01 de nov. de 2026`
    - Entre anos diferentes: `28 de dez. de 2026 – 03 de jan. de 2027`
  - No modo **Mês**: `Outubro de 2026` (mês por extenso capitalizado e ano).

#### AC-205 — Contador Reativo de Atendimentos por Período Visualizado e Limpeza do Botão de Agendamento

- **Dado** que há consultas cadastradas na base local (ativas e canceladas)
- **Quando** visualizo a barra de navegação de períodos da agenda
- **Então** deve ser exibido um indicador textual abaixo da data com a contagem de atendimentos ativos (`status !== 'CANCELLED'`) dentro do período corrente:
  - Se houver 0 atendimentos: `Nenhum atendimento`
  - Se houver 1 atendimento: `1 atendimento`
  - Se houver 2 ou mais: `X atendimentos`
- **E** o botão de ação no topo da agenda deve exibir o rótulo limpo `Novo Agendamento` acompanhado de seu ícone, sem duplicidade de sinal `+`.

#### AC-206 — Disposição Vertical em Coluna e Botão de Retorno Contextual ("Hoje", "Esta semana", "Este mês")

- **Dado** o card seletor de modo de visualização da agenda (`ViewModeSelector`)
- **Quando** for renderizado na interface
- **Então** seus elementos devem estar distribuídos verticalmente em 3 níveis:
  1. Topo: botões de navegação rápida com `<` `>` e botão central de retorno;
  2. Meio: identificação do período e contador de atendimentos centralizados;
  3. Abaixo: seletor de abas ("Dia", "Semana", "Mês");
- **E** o rótulo do botão de retorno deve ser adaptado dinamicamente:
  - No modo **Dia**: `Hoje`;
  - No modo **Semana**: `Esta semana`;
  - No modo **Mês**: `Este mês`.

## Fora de escopo

- Alterações na grade de horários diária (ScheduleGrid) ou nos filtros avançados de pacientes.
- Agendamento em lote ou relatórios analíticos de fechamento.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-067 | A semana na agenda clínica tem início na segunda-feira e término no domingo, compatível com a grade semanal existente. | confirmada | Confirmado com a implementação atual de renderWeekView do ScheduleGrid. |

## Perguntas em aberto

| ID | Pergunta | Status | Resolução |
|---|---|---|---|
| Q-057 | Qual formato adotar para a navegação: abordagem direta/limpa ou narrativa com "Semana de..."? | respondida | Usuário optou explicitamente pela Abordagem A (Direta e Limpa) com inclusão do contador de atendimentos. |
