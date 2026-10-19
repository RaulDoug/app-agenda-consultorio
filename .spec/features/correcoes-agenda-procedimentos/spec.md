# Spec: Correções e Edição de Procedimentos na Agenda

> feature: correcoes-agenda-procedimentos
> status: pronta

## Contexto

Eliminação de falhas de usabilidade na agenda (duplicação de procedimentos, botão de salvar travado após o primeiro envio, retenção de dados prévios e slots intermediários livres em atendimentos longos) e inclusão da funcionalidade de edição de procedimentos em consultas já agendadas.

## Histórias

### US-053 — Estabilidade e Limpeza do Ciclo de Vida da Gaveta de Agendamento Rápido

Como profissional utilizando o aplicativo na recepção ou consultório,
quero que cada novo agendamento inicie com formulário limpo, botão de salvar sempre reativo e listagem de procedimentos sem duplicidades,
para que eu possa agendar atendimentos consecutivos com rapidez e sem travamentos.

#### AC-089 — Reset completo de formulário e reativação do botão ao reabrir a gaveta

- **Dado** que um primeiro agendamento foi salvo com sucesso ou cancelado na gaveta de criação rápida
- **Quando** o profissional clica em um novo horário vago ou no botão "+ Novo Agendamento"
- **Então** o formulário deve iniciar limpo (sem paciente anterior retido, sem procedimentos pré-selecionados e sem notas), e o botão deve exibir "Salvar Agendamento" devidamente habilitado (não travado em "Salvando...").

#### AC-090 — Deduplicação idempotente e IDs determinísticos na lista de procedimentos

- **Dado** o primeiro carregamento ou sincronização concorrente do banco de dados local Dexie
- **Quando** a lista de procedimentos/serviços for carregada na gaveta
- **Então** cada serviço padrão (Consulta Inicial, Atendimento Padrão, Retorno, Procedimento Especializado) deve ser exibido exatamente uma vez, impedindo duplicações.

### US-054 — Ocupação Contínua de Horários e Edição de Procedimentos em Consulta Existente

Como profissional organizando a grade de atendimentos,
quero que consultas com duração estendida ocupem todos os slots abrangidos e que seja possível editar os procedimentos da consulta,
para manter a agenda precisa e flexível a alterações no atendimento.

#### AC-091 — Bloqueio e cobertura visual contínua de slots intermediários em consultas longas

- **Dado** um agendamento com duração estendida (ex: 11:00 às 12:30, cobrindo 90 minutos)
- **Quando** a grade de horários diária renderiza os slots
- **Então** os slots intermediários abrangidos (ex: 11:30 e 12:00) devem ser indicados como ocupados pelo atendimento em curso, não exibindo o botão de "+ Horário Vago".

#### AC-092 — Edição interativa de procedimentos vinculados na consulta com recálculo de duração

- **Dado** um agendamento existente com procedimentos selecionados
- **Quando** o profissional abre os detalhes da consulta e altera os procedimentos vinculados
- **Então** os novos procedimentos devem ser persistidos no banco local, recalculando a duração total e o novo horário de término (`end_time`) da consulta.

## Fora de escopo

- Reagendamento automático em massa de outras consultas em caso de estouro de horário.
- Gestão de múltiplos profissionais simultâneos na mesma grade (planejado para versão clínica multi-sala).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-028 | IDs determinísticos e verificação de existência impedem duplicação de procedimentos mesmo com React StrictMode executando montagens duplas. | confirmada | Validado nos repositórios locais do Dexie. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-028 | Ao alterar os procedimentos de uma consulta, a duração e o horário final (`end_time`) devem ser atualizados proporcionalmente? | respondida | Sim, o novo horário final reflete a soma das durações dos novos procedimentos selecionados. |
