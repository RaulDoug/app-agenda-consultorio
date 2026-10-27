# Funcionalidade: Mensageria WhatsApp via Evolution API e Automação

## 1. Visão Geral e Responsabilidades
O subsistema de Mensageria WhatsApp gerencia a comunicação automatizada entre o consultório e os pacientes através do gateway Evolution API (Baileys), com fila BullMQ/Redis e salvaguardas rigorosas anti-ban. O módulo é responsável pelo pareamento de instâncias via QR Code, disparo matinal de confirmações em lote, recepção e parsing de respostas dos pacientes, réplicas imediatas (confirmação, remarcação e acolhimento) e auditoria completa de mensagens trocadas.

## 2. Arquitetura em 4 Camadas
- **Rotas (`backend/src/routes/whatsapp.routes.ts`, `backend/src/routes/whatsapp-queue.routes.ts` e `backend/src/routes/webhooks.routes.ts`):**
  - Rotas de sessão, conexão, settings, mensagens e trigger protegidas por `authMiddleware`.
  - Rotas da Central de Fila de WhatsApp (`/api/whatsapp/queue`): listagem categorizada, disparo imediato `send-now`, exclusão lógica da fila (DELETE), edição de mensagem customizada (PUT `/message`), reordenação (PUT `/reorder`) e pausa/retomada global da fila (POST `/pause`).
  - Rota pública do webhook `/api/webhooks/whatsapp` para recepção de eventos da Evolution API.
- **Controllers (`backend/src/controllers/whatsapp-controller.ts`, `backend/src/controllers/whatsapp-queue-controller.ts` e `backend/src/controllers/webhook-controller.ts`):**
  - Extraem parâmetros (`req.body`, `req.query`, `req.tenantId`), delegam para os serviços de negócio e retornam status HTTP adequados (200, 400, 500). Zero queries SQL.
- **Services (`backend/src/services/whatsapp-service.ts`, `whatsapp-scheduler-service.ts`, `webhook-service.ts`):**
  - `WhatsappService`: Ciclo de vida da sessão, envio manual com retry e gravação em log, consulta e atualização de configurações. Gerencia visão geral da fila (`getQueueOverview`), envio manual instantâneo (`sendQueueItemNow`), exclusão lógica (`removeQueueItem`), mensagens customizadas (`updateQueueItemMessage`), reordenação e controle de pausa. Fallback determinístico de instância no formato `cliniassist_${tenantId.slice(0, 8)}`.
  - `WhatsappSchedulerService`: Varredura automática diária (às 09:00 America/Sao_Paulo) e trigger sob demanda com verificação de janela comercial e idempotência de 12h.
  - `WebhookService`: Classificação semântica de mensagens recebidas (`CONFIRMED`, `RESCHEDULE_REQUESTED`, `MESSAGE_RECEIVED`), atualização transacional da consulta e disparo de réplica humanizada com Spintax.
- **Repository (`backend/src/repositories/whatsapp-repository.ts`):**
  - Persistência das tabelas `whatsapp_settings`, `whatsapp_messages` e extensões na tabela `appointments`.
  - Queries parametrizadas isoladas por `tenant_id` com soft-delete e checagem de idempotência.
  - Métodos da Central de Fila: `findQueueAppointments`, `ensureQueueColumns`, `excludeFromQueue`, `updateCustomMessage`, `updateQueueOrder`.

## 3. Regras de Negócio e Decisões (/grill-me)
1. **Varredura Diária Automática e Antecedência D+1:**
   - O agendador diário opera dentro da janela comercial permitida (08:00 às 20:00) com horário padrão às 09:00.
   - Identifica consultas com status `PENDING` agendadas para o dia seguinte (D+1). Consultas marcadas para o mesmo dia civil da execução NUNCA são disparadas automaticamente (salvaguarda temporal anti-ban).
2. **Disparo Manual Sob Demanda e Idempotência Inteligente:**
   - O endpoint `POST /api/whatsapp/batch-confirmations/trigger` permite que a recepcionista force o envio em lote a qualquer momento.
   - Por padrão, consultas que já receberam notificação `OUTBOUND` nas últimas 12 horas são ignoradas para não perturbar o paciente. O parâmetro `force: true` permite bypass explícito dessa salvaguarda.
3. **Parametrização Dinâmica com Spintax por Consultório:**
   - A tabela `whatsapp_settings` permite que cada consultório customize seus templates:
     - Confirmação (`confirmation_message_template`);
     - Réplica de Confirmação (`confirmation_reply_template`);
     - Réplica de Remarcação (`reschedule_reply_template`);
     - Réplica de Acolhimento (`welcome_fallback_reply_template`).
   - O motor Spintax resolve estocasticamente blocos `{opção1|opção2}` e interpola dinamicamente `{nome}`, `{data}` e `{horario}`.
4. **Réplica de Acolhimento Humanizada para Dúvidas e Mídias:**
   - Quando o paciente envia dúvida em texto livre, mensagem de áudio ou arquivo de imagem/mídia, o status do agendamento transita para `MESSAGE_RECEIVED` (com flag `requires_attention = true`).
   - O sistema envia imediatamente a mensagem de acolhimento personalizada informando que a equipe humana responderá em breve.
5. **Auditoria e Escopo da Tabela `whatsapp_messages`:**
   - Armazena todas as mensagens (inbound e outbound) trocadas com pacientes cadastrados no consultório.
   - Vínculo a `appointment_id` quando houver consulta associada ou `NULL` para conversas gerais.
   - Mensagens de números desconhecidos não cadastrados são ignoradas de forma limpa com `HTTP 200 OK` (sem erro e sem poluir o histórico).
6. **Proteções Anti-Ban e Resiliência da Fila:**
   - Jitter humanizado randômico de 20s a 50s entre disparos em lote no BullMQ.
   - Pausa imediata da fila ao receber webhook de desconexão (`CONNECTION_LOST`).
   - Ao reconectar (`CONNECTION_ESTABLISHED`), a fila valida se ainda está em horário comercial e se os jobs não expiraram antes de retomar os disparos.
   - Retry com backoff exponencial para erros transitórios (HTTP 502/503/504/429).

## 7. Central de Fila de WhatsApp e Garantia Idempotente de Schema
1. **Colunas Dedicadas na Tabela `appointments`:**
   - `whatsapp_queue_excluded BOOLEAN DEFAULT FALSE`: exclusão lógica da fila sem excluir a consulta (`deleted_at IS NULL`).
   - `whatsapp_custom_message TEXT DEFAULT NULL`: mensagem customizada individualizada por agendamento.
   - `whatsapp_queue_order INT DEFAULT 0`: prioridade e reordenação dos envios na fila.
2. **Garantia Idempotente (`ensureQueueColumns`):**
   - O repositório invoca `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS ...` antes de processar consultas de fila, garantindo resiliência em qualquer ambiente (dev, migrations locais ou contêineres).
3. **Exclusão Lógica na Query da Fila (`findQueueAppointments`):**
   - A query SQL inclui a cláusula `AND COALESCE(a.whatsapp_queue_excluded, false) = false` no `WHERE`, garantindo que agendamentos retirados da fila pelo usuário não apareçam nas listagens nem recebam disparos automáticos (AC-211).
4. **Envio Manual Instantâneo (`POST /api/whatsapp/queue/:appointmentId/send-now`):**
   - Permite envio imediato via Evolution API, inclusive para agendamentos do mesmo dia civil (AC-214).
   - Remove com segurança qualquer job correspondente pendente na fila BullMQ (`queue.removeJobByAppointmentId`).
5. **Fallback de Instância Multi-Tenant:**
   - No método `sendMessage`, caso o consultório não possua `whatsapp_instance_name` explicitamente configurado, o fallback determinístico é derivado do ID do tenant: `cliniassist_${tenantId.slice(0, 8)}`, mantendo estrito isolamento operacional.
6. **Classificação Semântica de Pedido de Agendamento e Reagendamento (`AC-219`):**
   - O parser semântico (`parser.ts`) reconhece padrões canônicos de agendamento e reagendamento (`"pedido de agendamento"`, `"pedido de reagendamento"`, `"reagendamento"`, `"remarcação"`, `"novo agendamento"`, `"agendar outro dia"`, `"trocar data"`, etc.), direcionando deterministicamente o status para `RESCHEDULE_REQUESTED`.
   - Garante precedência segura para confirmações legítimas (ex.: `"Sim, confirmo o agendamento"`), prevenindo falsos positivos.
7. **Limite Diário de Réplicas Automáticas por Paciente (`AC-222`, `AC-223`):**
   - Na tabela `whatsapp_messages`, réplicas automáticas enviadas via webhook são registradas com a flag `is_auto_reply = true`, diferenciando-as dos lembretes ativos enviados pela fila (`is_auto_reply = false`).
   - O método `hasAutoReplySentToday` verifica se o paciente já recebeu réplica automática no dia civil corrente (`00:00:00` às `23:59:59` no fuso local).
   - Novas mensagens recebidas de um mesmo paciente no mesmo dia continuam sendo gravadas como `INBOUND` para acompanhamento no painel, mas o envio de réplica na Evolution API é suprimido (`reply_sent: false`), evitando mensagens robóticas maçantes e repetitivas.
   - Mensagens livres subsequentes de um paciente que já está em `RESCHEDULE_REQUESTED` ou `CONFIRMED` não rebaixam o status da consulta para `MESSAGE_RECEIVED`.

8. **Resolução de Resposta e Aviso de Remarcação na Fila (`AC-224`, `AC-225`, `AC-226`):**
   - A tabela `appointments` possui a coluna `whatsapp_inbound_resolved BOOLEAN DEFAULT FALSE`.
   - O repositório calcula o estado `is_replied`: verdadeiro se `whatsapp_inbound_resolved = true` ou se houver mensagem `OUTBOUND` posterior ao último `INBOUND` (`last_outbound_at >= last_inbound_at`).
   - Rota `POST /api/whatsapp/queue/:appointmentId/reply`:
     - Ação `mark_resolved`: marca a resposta como atendida sem enviar mensagem adicional.
     - Ação `send_notice`: dispara mensagem informando a nova data e horário remarcados, grava o registro `OUTBOUND` e marca a pendência como respondida.

9. **Configuração de Escopo e Salvaguardas de Resposta Automática (`AC-234`, `AC-235`, `AC-236`):**
   - A tabela `whatsapp_settings` contém a coluna `auto_reply_scope VARCHAR(30) DEFAULT 'REGISTERED_ONLY'` com auto-seed e suporte aos valores `'REGISTERED_ONLY'`, `'ALL'` e `'DISABLED'`.
   - **Bloqueio de Grupos e Status (`AC-236`):** No `WebhookService`, eventos com remetentes `@g.us`, `@broadcast` ou `@newsletter` são descartados imediatamente (`ignored_group_or_broadcast`).
   - **Modo Apenas Cadastrados (`AC-234`):** Caso o contato não possua cadastro em `patients`, a requisição é ignorada silenciosamente (`ignored_unknown_number`) sem envio de mensagens. No modo `DISABLED`, nenhuma réplica é disparada.
   - **Modo Todos os Contatos com Omissão Limpa de `{nome}` (`AC-235`):** Contatos não cadastrados recebem exclusivamente a réplica humanizada de acolhimento (`welcome_fallback_reply_template`). O motor `processSpintax` limpa vírgulas e espaços órfãos quando `{nome}` está vazio. A réplica é gravada em `whatsapp_messages` (`patient_id = null`, `is_auto_reply = true`) com limite de 1 disparo por dia civil por telefone (`hasAutoReplySentToday`).
