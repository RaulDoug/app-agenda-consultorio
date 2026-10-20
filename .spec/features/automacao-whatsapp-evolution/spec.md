# Spec: Automacao whatsapp evolution

> feature: automacao-whatsapp-evolution
> status: implementada

## Contexto

O subsistema de mensageria WhatsApp via Evolution API gerencia a comunicação automatizada entre consultório e pacientes. Esta feature consolida a automação diária de disparo de confirmações (Scheduler/Cron com idempotência inteligente), a parametrização dinâmica de templates por consultório, o histórico auditável de mensagens, réplica automática de acolhimento para dúvidas/áudios e a completa adequação do módulo à arquitetura em 4 camadas (Routes, Controllers, Services e Repositories).

## Histórias

### US-088 — Agendador Diário Automático e Disparo em Lote de Confirmações

Como secretária ou dentista, quero que o sistema identifique automaticamente as consultas de amanhã e dispare as confirmações no horário comercial, para reduzir faltas sem necessidade de intervenção manual diária.

#### AC-144 — Varredura de consultas pendentes para o dia seguinte e agendamento em lote com jitter anti-ban

- **Dado** que existem consultas com status `PENDING` marcadas para o dia seguinte (D+1) cujos pacientes possuem número de WhatsApp válido
- **Quando** o serviço de agendamento diário (`WhatsappSchedulerService.runDailyConfirmationScan`) é executado dentro da janela comercial (09:00 America/Sao_Paulo)
- **Então** o sistema enfileira os jobs de confirmação aplicando atrasos humanizados randômicos (*jitter* de 20s a 50s), ignora consultas marcadas para o mesmo dia e não reenvia se já foi notificado nas últimas 12 horas (idempotência)

#### AC-145 — Disparo manual sob demanda de lote de confirmações via API com idempotência

- **Dado** o consultório autenticado com WhatsApp conectado
- **Quando** o usuário aciona `POST /api/whatsapp/batch-confirmations/trigger` (com opção `force: boolean`)
- **Então** o sistema executa a varredura para o dia seguinte, filtra agendamentos já notificados nas últimas 12h a menos que `force: true` seja informado, e retorna `200 OK` contendo o resumo dos agendamentos processados e ignorados

---

### US-089 — Parametrização Dinâmica do WhatsApp por Consultório

Como gestor do consultório, quero personalizar as mensagens de confirmação, réplicas e horários de disparo de acordo com a identidade da minha clínica.

#### AC-146 — Consulta de configurações de WhatsApp por consultório com auto-seed

- **Dado** um consultório autenticado no sistema
- **Quando** o usuário faz uma requisição `GET /api/whatsapp/settings`
- **Então** o sistema retorna `200 OK` com os templates de confirmação, réplicas com Spintax, antecedência em dias (default 1) e horário padrão (default 9h), criando o registro padrão caso seja a primeira consulta

#### AC-147 — Atualização de templates Spintax e preferências de envio

- **Dado** novas configurações com templates válidos contendo variáveis suportadas (`{nome}`, `{horario}`, `{data}`)
- **Quando** o usuário envia `PUT /api/whatsapp/settings` com os dados atualizados
- **Então** o sistema persiste as alterações no PostgreSQL isoladas por `tenant_id` e retorna `200 OK` com os dados persistidos

---

### US-090 — Registro e Rastreabilidade de Histórico de Comunicações

Como dentista ou recepcionista, quero visualizar o histórico das mensagens trocadas com o paciente sobre seu agendamento para ter clareza do que foi combinado.

#### AC-148 — Persistência de logs de mensagens enviadas e recebidas com status da Evolution API

- **Dado** que uma mensagem de confirmação, réplica ou resposta de paciente cadastrado é processada
- **Quando** a operação de envio ou recepção no webhook é concluída
- **Então** o sistema grava um registro na tabela `whatsapp_messages` contendo `direction` (`OUTBOUND` ou `INBOUND`), `status`, `message_text`, `phone`, `evolution_message_id` e vínculos de `patient_id` e `appointment_id` (se houver consulta vinculada)

#### AC-149 — Consulta filtrada de histórico de mensagens por agendamento ou paciente

- **Dado** mensagens previamente registradas para um paciente ou agendamento
- **Quando** o usuário requisita `GET /api/whatsapp/messages?appointmentId=...` ou `GET /api/whatsapp/messages?patientId=...`
- **Então** o sistema retorna `200 OK` com a lista cronológica das mensagens trocadas respeitando o isolamento do tenant

---

### US-091 — Arquitetura em 4 Camadas e Réplica de Acolhimento Humanizada

Como usuário e desenvolvedor, quero que todas as interações de mensagens recebam respostas claras e sigam a arquitetura em 4 Camadas (Routes ➔ Controllers ➔ Services ➔ Repositories).

#### AC-150 — Desacoplamento estrito em 4 camadas e réplica de acolhimento para dúvidas ou áudios

- **Dado** o subsistema de WhatsApp e Webhooks estruturado em 4 camadas
- **Quando** o paciente envia dúvida em texto livre ou mensagem de áudio/mídia
- **Então** a consulta transita para `MESSAGE_RECEIVED`, o sistema envia réplica automática humanizada de acolhimento informando que a equipe humana responderá em breve, registra o log e responde `200 OK` sem SQL direto em rotas

## Fora de escopo

- Campanhas de disparo em massa de mensagens promocionais para lista fria (apenas confirmações de consultas agendadas).
- Chatbot conversacional com IA generativa para agendamento autônomo (mantém o escopo de classificação de confirmação/remarcação e triagem de dúvidas).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-043 | O horário padrão para disparo automático matinal de confirmações é 09:00 (America/Sao_Paulo). | confirmada | Confirmado em /grill-me. Permite customização nas configurações do tenant, mantendo 09:00 como default. |
| ASM-044 | A antecedência padrão para confirmação é de 1 dia antes da consulta (D+1). | confirmada | Confirmado em /grill-me (consultas de segunda disparam no domingo às 09:00). |
| ASM-045 | Idempotência inteligente de reenvio deve considerar intervalo de 12 horas. | confirmada | Confirmado em /grill-me: consultas notificadas nas últimas 12h são ignoradas no disparo sob demanda, salvo com `force: true`. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-042 | Como deve se comportar o disparo diário em dias sem consultas marcadas para o dia seguinte? | respondida | O scheduler executa a varredura, registra que não há candidatos válidos e encerra com 0 jobs enfileirados, sem gerar erros. |
| Q-043 | O sistema deve responder automaticamente a mensagens livres ou áudios de pacientes? | respondida | Sim, envia réplica automática de acolhimento informando que a equipe humana responderá em breve e marca status como `MESSAGE_RECEIVED`. |
| Q-044 | Qual o escopo de armazenamento na tabela `whatsapp_messages`? | respondida | Grava mensagens de todos os pacientes cadastrados no consultório (vinculando `appointment_id` se houver, ou null caso contrário). Números desconhecidos são ignorados sem erro. |
