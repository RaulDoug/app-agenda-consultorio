# Spec: Reagendamento mensagem whatsapp

> feature: reagendamento-mensagem-whatsapp
> status: pronta

## Contexto

Quando um paciente responde à notificação do WhatsApp solicitando reagendamento ou novo agendamento, a Central de Envios do WhatsApp deve substituir o botão de "Confirmar Manualmente" por um botão de "Reagendar Consulta", abrindo o fluxo/modal de remarcação para definir nova data e horário.

## Histórias

### US-125 — Botão de Reagendamento na Central de WhatsApp

Como recepcionista ou dentista gerenciando a fila de mensagens do WhatsApp,
quero que consultas com pedido de reagendamento/agendamento exibam a ação direta de "Reagendar" em vez de confirmação manual,
para que eu possa remarcar o horário do paciente imediatamente sem inconsistências de fluxo.

#### AC-219 — Reconhecimento semântico de pedido de agendamento e reagendamento no parser
- **Dado** uma mensagem recebida de paciente contendo termos como "pedido de agendamento", "reagendamento", "remarcação" ou "agendar outro dia"
- **Quando** o parser de mensagens do WhatsApp processar o texto
- **Então** a mensagem deve ser classificada como `RESCHEDULE_REQUESTED`, preservando respostas legítimas de confirmação ("sim, confirmo agendamento") como `CONFIRMED`.

#### AC-220 — Substituição do botão de confirmação manual por botão de reagendamento
- **Dado** um card de agendamento na Central de WhatsApp com resposta do paciente solicitando reagendamento (`queue_category` ou status `RESCHEDULE_REQUESTED` ou texto correspondente)
- **Quando** o card for renderizado em tela
- **Então** o botão "Confirmar Manualmente" deve ser substituído pelo botão "Reagendar Consulta" com estilo destacado e ícone de calendário.

#### AC-221 — Acionamento e conclusão do modal de remarcação a partir da fila
- **Dado** o botão "Reagendar Consulta" exibido no card da fila de WhatsApp
- **Quando** o usuário clicar no botão
- **Então** o modal de remarcação (`RescheduleModal`) deve ser aberto com os dados da consulta, permitindo escolher nova data/horário e, ao confirmar, atualizar o agendamento no banco local e sincronizar com o backend.

## Fora de escopo

- Alteração na lógica de envio de mensagens do robô em lote (BullMQ).
- Modificação dos modelos de dados SQL do PostgreSQL ou das migrations existentes.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-071 | Quando o agendamento estiver com pedido de reagendamento, a ação prioritária no balão de resposta deve ser "Reagendar Consulta" em vez de "Confirmar Manualmente". | confirmada | Confirmado conforme solicitação do usuário. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-060 | O botão de confirmação manual deve desaparecer completamente no caso de pedido de reagendamento, ou deve ser mantido como ação secundária? | respondida | Sim, substituir completamente pelo botão "Reagendar Consulta", conforme aprovação explícita do usuário. |
