# Spec: Whatsapp bullmq

> feature: whatsapp-bullmq
> status: pronta

## Contexto

Implementação do motor de comunicação com WhatsApp via Evolution API e mensageria assíncrona com BullMQ/Redis: parser inteligente de respostas de pacientes (texto, emojis e áudio/mídia extensível), gerador de variações textuais Spintax anti-ban, enfileiramento cadenciado com jitter humanizado (20s a 50s) restrito à janela comercial (08:00 às 20:00) com salvaguarda de envio nunca no mesmo dia da consulta (24h a 48h antes), webhook para captura de respostas, tratamento para pacientes que mudam de ideia e pausa/retomada inteligente de fila em caso de queda de sessão da instância com descarte seguro de jobs expirados.

## Histórias

### US-011 — Parser Inteligente de Mensagens e Ciclo de Confirmação

Como dentista ou secretária, quero que as respostas dos pacientes no WhatsApp sejam interpretadas e classificadas automaticamente, para que o status da agenda seja atualizado sem necessidade de intervenção manual repetitiva.

#### AC-019 — Classificação semântica de confirmação, reagendamento e dúvidas

- **Dado** uma mensagem recebida de um paciente (ex: "1", "Sim", "👍", "confirmado", "2", "remarcar", texto livre com dúvida ou mensagem de áudio/mídia)
- **Quando** o parser inteligente processar o conteúdo da mensagem
- **Então** o sistema deve classificar deterministicamente o status em `CONFIRMED`, `RESCHEDULE_REQUESTED` ou `MESSAGE_RECEIVED` (com handler extensível para áudio/mídia permitindo resposta automática futura).

#### AC-020 — Transição de status quando paciente muda de ideia

- **Dado** um agendamento já marcado como `CONFIRMED` após resposta inicial do paciente
- **Quando** o paciente enviar mensagem posterior solicitando reagendamento (ex: "2", "não posso ir", "remarcar")
- **Então** o status do agendamento deve ser atualizado para `RESCHEDULE_REQUESTED` permitindo que a clínica tome providências.

### US-012 — Gerador Spintax Anti-Ban e Variação Textual

Como operador da clínica, quero que as mensagens automáticas de confirmação de consulta sejam geradas com variações sintáticas (Spintax), para evitar que envios repetidos e idênticos causem o banimento ou bloqueio do número pelo WhatsApp.

#### AC-021 — Variação textual dinâmica entre disparos consecutivos

- **Dado** um modelo de mensagem contendo blocos Spintax (ex: `{Olá|Oi|Bom dia} {nome}, {confirmamos|lembramos da} sua consulta amanhã às {hora}?`)
- **Quando** 10 mensagens forem geradas consecutivamente pelo gerador Spintax
- **Então** o sistema deve produzir saídas com variações dinâmicas de texto, garantindo que disparos sucessivos não sejam réplicas idênticas.

### US-013 — Enfileiramento com Jitter Humanizado e Salvaguardas de Horário

Como consultório odontológico, quero que o disparo de mensagens para o dia seguinte seja cadenciado com atrasos variáveis entre 20 e 50 segundos, restrito à janela permitida (08:00 às 20:00), com salvaguarda estrita para nunca enviar confirmação no próprio dia da consulta e com recuperação de falhas.

#### AC-022 — Intervalo de jitter humanizado entre 20 e 50 segundos e salvaguarda temporal

- **Dado** uma lista de agendamentos para disparo da rotina de confirmação
- **Quando** os agendamentos forem adicionados à fila BullMQ
- **Então** cada job deve receber atraso incremental com jitter randômico de 20 a 50 segundos, respeitando a janela comercial (08:00 às 20:00) e com salvaguarda inegociável de NUNCA disparar confirmação no mesmo dia da consulta (apenas 24h ou 48h antes).

#### AC-023 — Retry exponencial em caso de instabilidade na Evolution API

- **Dado** uma tentativa de envio de mensagem onde a Evolution API retorne erro transitório (HTTP 502 ou 503)
- **Quando** o worker do BullMQ processar o erro
- **Então** a mensagem deve ser reagendada com política de backoff exponencial sem duplicar envios que já tenham sido concluídos.

### US-014 — Webhook da Evolution API e Gerenciamento de Sessão

Como dentista, quero que o sistema receba eventos em tempo real da Evolution API via webhook, atualizando a agenda, lidando com números desconhecidos e pausando envios se a conexão do WhatsApp cair, com retomada inteligente e segura.

#### AC-024 — Atualização do agendamento a partir do webhook da Evolution API

- **Dado** um payload de webhook recebido da Evolution API contendo resposta válida de paciente com agendamento `PENDING`
- **Quando** o endpoint `POST /api/webhooks/whatsapp` processar o payload
- **Então** o agendamento correspondente deve ser atualizado no PostgreSQL com o novo status interpretado e retornar HTTP 200 OK.

#### AC-025 — Tratamento silencioso e seguro para mensagens de números desconhecidos

- **Dado** um webhook recebido com mensagem originada de um número não cadastrado na clínica
- **Quando** o endpoint do webhook processar a requisição
- **Então** o sistema deve retornar HTTP 200 OK de forma limpa e silenciosa, sem gerar erro 500 nem travar o processamento da fila.

#### AC-026 — Pausa e retomada inteligente de fila em desconexão com salvaguarda de expiração

- **Dado** uma desconexão da instância WhatsApp (`CONNECTION_LOST`) seguida de posterior reconexão (`CONNECTION_ESTABLISHED`)
- **Quando** a reconexão ocorrer
- **Então** a fila BullMQ deve retomar automaticamente apenas se os jobs pendentes ainda estiverem dentro da janela diária permitida (08:00 às 20:00) e antes do dia da consulta; se o horário ou dia foi ultrapassado, os jobs defasados devem ser abortados e um alerta emitido para o dentista.

## Fora de escopo

- Reconhecimento de voz por IA / transcrição de áudios em texto (escopo futuro).
- Motor financeiro de contas a receber e rateio de descontos (escopo da Sprint BE-4).
- Interface de usuário React PWA do dentista (escopo do Frontend).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-005 | As instâncias da Evolution API enviam payloads de webhook contendo evento, dados da instância, remetente e corpo da mensagem. | confirmada | Formato padrão de webhooks da Evolution API v1.8/v2. |
| ASM-006 | Em ambiente de teste automatizado, as filas BullMQ podem operar com ioredis-mock sem exigir serviço Redis externo rodando. | confirmada | Garante testes ultrarrápidos e determinísticos sem dependência externa. |
| ASM-007 | Disparos de confirmação de agendamento ocorrem em lote matinal agendado previamente (24h a 48h antes da data da consulta). | confirmada | Alinhado com o PO: nunca disparar no mesmo dia da consulta. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-003 | Qual a janela de horário permitida para disparos automáticos e qual a salvaguarda de antecedência? | respondida | Janela das 08:00 às 20:00. Salvaguarda obrigatória: confirmação nunca no dia da consulta, apenas 24h ou 48h antes. |
| Q-004 | Como o sistema deve reagir a mensagens de áudio ou mídia enviadas pelo paciente? | respondida | Opção A: Classificar como `MESSAGE_RECEIVED` (notifica no painel), estruturado com handler modular para facilitar resposta automática futura. |
| Q-005 | Qual o comportamento da fila BullMQ após restabelecimento de conexão (`CONNECTION_ESTABLISHED`)? | respondida | Retomar automaticamente apenas se dentro da janela de horário (08:00-20:00) e do dia anterior à consulta. Se ultrapassar o horário ou o dia, abortar disparos defasados e alertar o dentista. |
| Q-006 | Como sinalizar consultas em que o paciente não respondeu à confirmação até o prazo limite antes da consulta? | respondida | O status permanece PENDING e o sistema exibe um aviso visual/alerta de "Não respondeu" no painel da clínica para ação da equipe. |
