# Spec: Réplica Automática de Confirmação e Remarcação no WhatsApp

> feature: replica-confirmacao-whatsapp
> status: pronta

## Contexto

Implementação de mensagens automáticas de retorno (réplica/feedback) para o paciente quando ele responde à notificação de confirmação no WhatsApp, informando-o imediatamente de que seu agendamento foi confirmado ou que seu pedido de remarcação foi recebido, garantindo uma experiência humanizada sem deixá-lo sem resposta.

## Histórias

### US-052 — Réplica Automática de Confirmação e Remarcação para o Paciente

Como paciente que recebeu uma solicitação de confirmação de consulta pelo WhatsApp,
quero receber uma mensagem instantânea de agradecimento e confirmação ao responder "1" (Sim) ou de acolhimento ao responder "2" (Remarcar),
para ter a certeza de que minha resposta foi processada pela clínica e que meu horário está garantido.

#### AC-086 — Envio de réplica humanizada de confirmação ao receber resposta positiva

- **Dado** uma mensagem de WhatsApp recebida no webhook de um paciente com agendamento ativo
- **Quando** o conteúdo da mensagem for classificado como confirmação (`1`, `Sim`, `Confirmado`, `👍`)
- **Então** o sistema deve atualizar o agendamento para `CONFIRMED` e disparar imediatamente uma mensagem de volta pelo WhatsApp contendo o nome do paciente e o horário da consulta confirmada.

#### AC-087 — Envio de réplica humanizada de remarcação ao receber resposta negativa

- **Dado** uma mensagem de WhatsApp recebida no webhook de um paciente com agendamento ativo
- **Quando** o conteúdo da mensagem for classificado como remarcação (`2`, `Não posso`, `Remarcar`, `Cancelar`)
- **Então** o sistema deve atualizar o agendamento para `RESCHEDULE_REQUESTED` e disparar mensagem de volta pelo WhatsApp avisando que o pedido foi anotado e que a equipe entrará em contato em breve.

#### AC-088 — Resiliência no envio da réplica sem impactar a gravação no banco de dados

- **Dado** uma instabilidade ou falha temporária na Evolution API no momento do disparo da réplica
- **Quando** a chamada de envio da mensagem de réplica falhar
- **Então** o status do agendamento no PostgreSQL deve ser mantido atualizado com sucesso e o webhook deve registrar o aviso sem retornar erro 500 para a Evolution API.

## Fora de escopo

- Respostas automáticas com inteligência artificial generativa (ChatGPT) para dúvidas clínicas abertas.
- Fluxo de auto-agendamento interativo de novos horários via bot conversacional.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-027 | A proteção `key.fromMe = true` presente no webhook impede loops de mensagens infinitas quando o robô envia a réplica. | confirmada | Verificado no manipulador de webhooks (`backend/src/routes/webhooks.ts`). |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-027 | Mensagens livres ou dúvidas devem receber réplica automática imediata ou aguardar resposta humana? | respondida | Dúvidas livres marcam a consulta como `MESSAGE_RECEIVED` para atendimento humano do consultório, sem réplica genérica para não gerar frustração. |
