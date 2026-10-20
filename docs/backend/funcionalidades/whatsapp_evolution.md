# Funcionalidade: Mensageria WhatsApp via Evolution API e Automação

## 1. Visão Geral e Responsabilidades
O subsistema de Mensageria WhatsApp gerencia a comunicação automatizada entre o consultório e os pacientes através do gateway Evolution API (Baileys), com fila BullMQ/Redis e salvaguardas rigorosas anti-ban. O módulo é responsável pelo pareamento de instâncias via QR Code, disparo matinal de confirmações em lote, recepção e parsing de respostas dos pacientes, réplicas imediatas (confirmação, remarcação e acolhimento) e auditoria completa de mensagens trocadas.

## 2. Arquitetura em 4 Camadas
- **Rotas (`backend/src/routes/whatsapp.routes.ts` e `backend/src/routes/webhooks.routes.ts`):**
  - Rotas de sessão, conexão, settings, mensagens e trigger protegidas por `authMiddleware`.
  - Rota pública do webhook `/api/webhooks/whatsapp` para recepção de eventos da Evolution API.
- **Controllers (`backend/src/controllers/whatsapp-controller.ts` e `backend/src/controllers/webhook-controller.ts`):**
  - Extraem parâmetros (`req.body`, `req.query`, `req.tenantId`), delegam para os serviços de negócio e retornam status HTTP adequados (200, 400, 500). Zero queries SQL.
- **Services (`backend/src/services/whatsapp-service.ts`, `whatsapp-scheduler-service.ts`, `webhook-service.ts`):**
  - `WhatsappService`: Ciclo de vida da sessão, envio manual com retry e gravação em log, consulta e atualização de configurações.
  - `WhatsappSchedulerService`: Varredura automática diária (às 09:00 America/Sao_Paulo) e trigger sob demanda com verificação de janela comercial e idempotência de 12h.
  - `WebhookService`: Classificação semântica de mensagens recebidas (`CONFIRMED`, `RESCHEDULE_REQUESTED`, `MESSAGE_RECEIVED`), atualização transacional da consulta e disparo de réplica humanizada com Spintax.
- **Repository (`backend/src/repositories/whatsapp-repository.ts`):**
  - Persistência das tabelas `whatsapp_settings` e `whatsapp_messages`.
  - Queries parametrizadas isoladas por `tenant_id` com soft-delete e checagem de idempotência.

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
