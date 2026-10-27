# Spec: Limite diario replica whatsapp

> feature: limite-diario-replica-whatsapp
> status: pronta

## Contexto

Quando um paciente envia mais de uma mensagem no WhatsApp ao longo do mesmo dia (ex.: mensagens picadas em sequência ou conversa contínua com a recepção), o webhook atualmente dispara a réplica automática ("Recebemos sua mensagem... nossa equipe entrará em contato em breve") para cada mensagem recebida, tornando a experiência maçante e repetitiva. Esta feature implementa um limite diário (cooldown de 1 envio por dia civil por paciente) para evitar mensagens automáticas repetidas no mesmo dia.

## Histórias

### US-126 — Controle de Frequência Diária de Réplicas Automáticas no WhatsApp

Como paciente e recepcionista do consultório,
quero que a mensagem automática informando que a equipe entrará em contato seja enviada no máximo uma vez por dia para cada paciente,
para evitar respostas robóticas repetitivas a cada nova mensagem enviada pelo cliente na mesma conversa.

#### AC-222 — Bloqueio de réplicas automáticas repetidas no mesmo dia para o mesmo paciente
- **Dado** que um paciente enviou uma mensagem hoje e já recebeu a réplica automática informando que a equipe entrará em contato
- **Quando** o mesmo paciente enviar novas mensagens adicionais no mesmo dia
- **Então** o sistema deve registrar normalmente as mensagens recebidas no histórico (`INBOUND`), mas não deve disparar novamente a réplica automática no WhatsApp (`reply_sent: false`), preservando o status de reagendamento caso já tenha sido solicitado.

#### AC-223 — Liberação do envio de réplica automática no dia seguinte e distinção de lembrete da fila
- **Dado** um paciente que recebeu um lembrete de confirmação da fila hoje (ou que recebeu réplica automática apenas em um dia anterior)
- **Quando** o paciente enviar sua primeira mensagem no dia atual
- **Então** o sistema deve permitir o envio normal da réplica automática correspondente (`reply_sent: true`), diferenciando lembretes ativos da fila de réplicas automáticas do webhook.

## Fora de escopo

- Alteração nos disparos manuais realizados diretamente pela recepcionista na Central de WhatsApp.
- Bloqueio de notificações ativas de lembrete de consulta para outros agendamentos futuros.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-072 | O limite diário considera o dia civil no fuso horário do consultório (`America/Sao_Paulo`, de 00:00:00 até 23:59:59), liberando novo envio a partir do dia seguinte. | confirmada | Alinhado com a solicitação explícita do usuário ("enviou esta mensagem uma vez hoje não pode enviar mais até amanhã"). |
| ASM-073 | O disparo do lembrete inicial da fila ("Confirmamos seu agendamento? Responda 1 ou 2") não conta como réplica de atendimento, permitindo que a primeira resposta do cliente naquele dia receba o retorno adequado. | confirmada | Necessário para não suprimir a resposta ao lembrete enviado no mesmo dia. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-061 | Caso o cliente mande uma dúvida cedo (recebendo o aviso de que a equipe entrará em contato) e mais tarde no mesmo dia responda "1" para confirmar presença na consulta pendente, devemos permitir apenas a confirmação da consulta ou bloquear qualquer mensagem automática no dia? | respondida | Opção A aprovada pelo usuário: Limite diário estrito para mensagens de contato/atendimento (dúvidas e reagendamento), permitindo confirmação caso a consulta esteja PENDING. |
