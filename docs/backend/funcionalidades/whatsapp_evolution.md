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
