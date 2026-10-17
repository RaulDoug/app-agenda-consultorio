# Spec: Whatsapp bullmq

> feature: whatsapp-bullmq
> status: pronta

## Contexto

Implementação do motor de comunicação com WhatsApp via Evolution API e mensageria assíncrona com BullMQ/Redis: parser inteligente de respostas de pacientes, gerador de variações textuais Spintax anti-ban, enfileiramento cadenciado com jitter humanizado (20s a 50s), webhook para captura de respostas, tratamento para pacientes que mudam de ideia e pausa automática de fila em caso de queda de sessão da instância.

## Histórias

### US-011 — Parser Inteligente de Mensagens e Ciclo de Confirmação

Como dentista ou secretária, quero que as respostas dos pacientes no WhatsApp sejam interpretadas e classificadas automaticamente, para que o status da agenda seja atualizado sem necessidade de intervenção manual repetitiva.

#### AC-019 — Classificação semântica de confirmação, reagendamento e dúvidas

- **Dado** uma mensagem recebida de um paciente (ex: "1", "Sim", "👍", "confirmado", "2", "remarcar", ou texto livre com dúvida)
- **Quando** o parser inteligente processar o texto da mensagem
- **Então** o sistema deve classificar deterministicamente o status em `CONFIRMED`, `RESCHEDULE_REQUESTED` ou `MESSAGE_RECEIVED`.

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

### US-013 — Enfileiramento com Jitter Humanizado e Retry com Backoff

Como consultório odontológico, quero que o disparo de mensagens para o dia seguinte seja cadenciado com atrasos variáveis entre 20 e 50 segundos e com recuperação automática de falhas, simulando comportamento humano e resistindo a oscilações da API.

#### AC-022 — Intervalo de jitter humanizado entre 20 e 50 segundos por agendamento

- **Dado** uma lista de 10 agendamentos do dia seguinte para disparo da rotina matinal
- **Quando** os agendamentos forem adicionados à fila BullMQ
- **Então** cada job deve receber um atraso incremental com jitter randômico de 20 a 50 segundos em relação ao anterior, sem disparos em rajada simultânea.

#### AC-023 — Retry exponencial em caso de instabilidade na Evolution API

- **Dado** uma tentativa de envio de mensagem onde a Evolution API retorne erro transitório (HTTP 502 ou 503)
- **Quando** o worker do BullMQ processar o erro
- **Então** a mensagem deve ser reagendada com política de backoff exponencial sem duplicar envios que já tenham sido concluídos.

### US-014 — Webhook da Evolution API e Gerenciamento de Sessão

Como dentista, quero que o sistema receba eventos em tempo real da Evolution API via webhook, atualizando a agenda, lidando com números desconhecidos e pausando envios se a conexão do WhatsApp cair.

#### AC-024 — Atualização do agendamento a partir do webhook da Evolution API

- **Dado** um payload de webhook recebido da Evolution API contendo resposta válida de paciente com agendamento `PENDING`
- **Quando** o endpoint `POST /api/webhooks/whatsapp` processar o payload
- **Então** o agendamento correspondente deve ser atualizado no PostgreSQL com o novo status interpretado e retornar HTTP 200 OK.

#### AC-025 — Tratamento silencioso e seguro para mensagens de números desconhecidos

- **Dado** um webhook recebido com mensagem originada de um número não cadastrado na clínica
- **Quando** o endpoint do webhook processar a requisição
- **Então** o sistema deve retornar HTTP 200 OK de forma limpa e silenciosa, sem gerar erro 500 nem travar o processamento da fila.

#### AC-026 — Detecção de desconexão da sessão e pausa automática da fila

- **Dado** um evento de webhook da Evolution API indicando desconexão da instância (`CONNECTION_LOST` ou `DISCONNECTED`)
- **Quando** o processador de webhooks tratar o evento
- **Então** o sistema deve atualizar `whatsapp_connected = false` no consultório e pausar imediatamente a fila BullMQ para não perder mensagens pendentes.

## Fora de escopo

- Reconhecimento de voz por IA / transcrição de áudios em texto (escopo futuro).
- Motor financeiro de contas a receber e rateio de descontos (escopo da Sprint BE-4).
- Interface de usuário React PWA do dentista (escopo do Frontend).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-005 | As instâncias da Evolution API enviam payloads de webhook contendo evento, dados da instância, remetente e corpo da mensagem. | confirmada | Formato padrão de webhooks da Evolution API v1.8/v2. |
| ASM-006 | Em ambiente de teste automatizado, as filas BullMQ podem operar com ioredis-mock sem exigir serviço Redis externo rodando. | confirmada | Garante testes ultrarrápidos e determinísticos sem dependência externa. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-003 | Nenhuma. | respondida | Regras anti-ban, spintax e cadenciamento de jitter acordados no Roadmap TDD BE-3. |
