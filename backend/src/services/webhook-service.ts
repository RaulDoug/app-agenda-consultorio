import { WhatsappRepository } from '../repositories/whatsapp-repository.js';
import {
  getEvolutionClient,
  type IEvolutionClient,
} from '../whatsapp/evolution-client.js';
import {
  getConfirmationQueue,
  type IConfirmationQueue,
} from '../whatsapp/queue.js';
import { handleConnectionRestored } from '../whatsapp/scheduler.js';
import { parsePatientMessage, resolveStatusTransition } from '../whatsapp/parser.js';
import { processSpintax } from '../whatsapp/spintax.js';
import { formatAppointmentDateTime } from '../whatsapp/reply-templates.js';

export class WebhookService {
  private customRepo?: WhatsappRepository;
  private customEvolutionClient?: IEvolutionClient;
  private customQueue?: IConfirmationQueue;

  constructor(
    repo?: WhatsappRepository,
    evolutionClient?: IEvolutionClient,
    queue?: IConfirmationQueue
  ) {
    this.customRepo = repo;
    this.customEvolutionClient = evolutionClient;
    this.customQueue = queue;
  }

  private get repo(): WhatsappRepository {
    return this.customRepo || new WhatsappRepository();
  }

  private get evolutionClient(): IEvolutionClient {
    return this.customEvolutionClient || getEvolutionClient();
  }

  private get queue(): IConfirmationQueue {
    return this.customQueue || getConfirmationQueue();
  }

  /**
   * Processa eventos de Webhook recebidos da Evolution API (conexão e mensagens).
   */
  async handleWebhook(payload: any, urlEvent?: string): Promise<{
    status: string;
    statusCode: number;
    data: any;
  }> {
    const rawUrlEvent = urlEvent ? urlEvent.replace(/-/g, '_').toUpperCase() : null;
    const event = payload?.event || payload?.type || rawUrlEvent;
    const instanceName = payload?.instance || payload?.instanceName || payload?.sender;

    // 1. Eventos de Conexão e Sessão da Instância
    if (event === 'connection.update' || event === 'CONNECTION_UPDATE' || payload?.state) {
      const state = (payload?.data?.state || payload?.state || '').toLowerCase();
      const statusReason = String(payload?.data?.statusReason || payload?.statusReason || '');

      const isDisconnection =
        state === 'close' ||
        statusReason.includes('CONNECTION_LOST') ||
        statusReason.includes('DISCONNECTED') ||
        payload?.data?.connection === 'close';

      const isReconnection =
        state === 'open' ||
        payload?.data?.connection === 'open' ||
        statusReason.includes('CONNECTION_ESTABLISHED');

      if (isDisconnection) {
        if (instanceName) {
          await this.repo.updateTenantConnection(instanceName, false, true);
        }
        await this.queue.pause();
        return {
          status: 'connection_lost',
          statusCode: 200,
          data: {
            whatsapp_connected: false,
            queue_paused: true,
          },
        };
      }

      if (isReconnection) {
        if (instanceName) {
          await this.repo.updateTenantConnection(instanceName, true, true);
        }
        const reconResult = await handleConnectionRestored(this.queue);
        return {
          status: 'connection_restored',
          statusCode: 200,
          data: {
            whatsapp_connected: true,
            queue_resumed: reconResult.resumed,
            reconnection_result: reconResult,
          },
        };
      }

      return {
        status: 'ignored_connection_event',
        statusCode: 200,
        data: {},
      };
    }

    // 2. Eventos de Mensagem Recebida (messages.upsert)
    if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT' || payload?.data?.message) {
      const data = payload?.data || payload;
      const key = data?.key || {};

      // Extrai número do remetente
      const remoteJid = key?.remoteJid || data?.remoteJid || '';
      const rawNumber = remoteJid.replace(/@.*$/, '').replace(/\D/g, '');

      if (!rawNumber) {
        if (key?.fromMe) {
          return {
            status: 'ignored_from_me',
            statusCode: 200,
            data: {},
          };
        }
        return {
          status: 'ignored_no_phone',
          statusCode: 200,
          data: {},
        };
      }

      // Extrai corpo da mensagem ou tipo de mídia
      const messageContent = data?.message || {};
      const isAudio = Boolean(messageContent.audioMessage || data?.messageType === 'audioMessage');
      const text =
        messageContent.conversation ||
        messageContent.extendedTextMessage?.text ||
        messageContent.imageMessage?.caption ||
        data?.text ||
        '';

      const messageId = key?.id || data?.id || payload?.data?.key?.id;

      // Idempotência: ignora re-entregas duplicadas do mesmo evento/mensagem pela Evolution API
      if (messageId) {
        const isDuplicate = await (this.repo as any).db.query(
          `SELECT id FROM whatsapp_messages WHERE evolution_message_id = $1 AND direction = 'INBOUND' LIMIT 1`,
          [messageId]
        );
        if (isDuplicate?.rows && isDuplicate.rows.length > 0) {
          return {
            status: 'ignored_duplicate',
            statusCode: 200,
            data: { messageId },
          };
        }
      }

      const parseResult = parsePatientMessage({
        text,
        messageType: isAudio ? 'audio' : 'text',
        mediaUrl: messageContent.audioMessage?.url || null,
        rawPayload: payload,
      });

      // Ignora mensagens enviadas pelo próprio consultório (fromMe),
      // EXCETO quando for auto-teste: usuário testando no próprio chat consigo mesmo e respondendo 1 ou 2
      if (key?.fromMe) {
        const isBotAutomatedMessage =
          text.includes('Confirmamos seu agendamento') ||
          text.includes('Olá ') ||
          text.includes('agendamento está confirmado') ||
          text.includes('remarcação foi registrado');

        const isSelfTestResponse =
          !isBotAutomatedMessage &&
          (text.trim() === '1' ||
            text.trim() === '2' ||
            parseResult.intent === 'CONFIRM' ||
            parseResult.intent === 'RESCHEDULE');

        if (!isSelfTestResponse) {
          return {
            status: 'ignored_from_me',
            statusCode: 200,
            data: {},
          };
        }
      }

      // Localiza o consultório (tenant) pela instância da Evolution
      let tenant = instanceName ? await this.repo.getTenant(instanceName, true) : null;
      if (!tenant) {
        // Fallback: se não encontrou por instância, busca primeiro tenant ativo
        const firstTenant = await (this.repo as any).db.query(
          `SELECT id, name, whatsapp_instance_name FROM tenants WHERE is_active = true LIMIT 1`
        );
        tenant = firstTenant.rows[0] || null;
      }

      if (!tenant) {
        return {
          status: 'ignored_no_tenant',
          statusCode: 200,
          data: { phone: rawNumber },
        };
      }

      const tenantId = tenant.id;

      // Busca paciente cadastrado pelo telefone
      const patient = await this.repo.findPatientByPhone(tenantId, rawNumber);
      if (!patient) {
        // AC-025: Número desconhecido -> Retorna 200 OK silenciosamente sem erro
        return {
          status: 'ignored_unknown_number',
          statusCode: 200,
          data: {
            phone: rawNumber,
            message: 'Mensagem recebida de número não cadastrado. Ignorado com sucesso.',
          },
        };
      }

      // Busca agendamento mais relevante para o paciente
      const appointment = await this.repo.findRelevantAppointmentForPatient(tenantId, patient.id);

      // Grava log da mensagem recebida (INBOUND)
      await this.repo.logMessage(tenantId, {
        appointment_id: appointment?.id || null,
        patient_id: patient.id,
        direction: 'INBOUND',
        phone: rawNumber,
        message_text: text || (isAudio ? '[Mensagem de Áudio]' : '[Mídia/Arquivo]'),
        status: 'RECEIVED',
        evolution_message_id: messageId || undefined,
      });

      let newStatus: string | null = null;
      let changedMind = false;
      let requiresAttention = false;

      if (appointment) {
        const transition = resolveStatusTransition(appointment.status, parseResult.classification);
        newStatus = transition.newStatus;
        changedMind = transition.changedMind;
        requiresAttention = transition.requiresAttention;

        await this.repo.updateAppointmentStatus(tenantId, appointment.id, transition.newStatus);
      }

      // Dispara réplica humanizada de feedback ao paciente
      const settings = await this.repo.ensureDefaultSettings(tenantId);
      let replySent = false;

      if (settings.auto_reply_enabled) {
        let replyTemplate: string | null = null;
        let formattedDateStr = '';
        let formattedTimeStr = '';

        if (appointment?.start_time) {
          const d = new Date(appointment.start_time);
          formattedDateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
          formattedTimeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
        }

        const firstName = patient.name.trim().split(' ')[0] || patient.name;

        if (parseResult.classification === 'CONFIRMED') {
          replyTemplate = settings.confirmation_reply_template;
        } else if (parseResult.classification === 'RESCHEDULE_REQUESTED') {
          replyTemplate = settings.reschedule_reply_template;
        } else if (parseResult.classification === 'MESSAGE_RECEIVED') {
          // Réplica humanizada de acolhimento para dúvidas ou áudios
          replyTemplate = settings.welcome_fallback_reply_template;
        }

        if (replyTemplate) {
          const replyText = processSpintax(replyTemplate, {
            nome: firstName,
            data: formattedDateStr,
            horario: formattedTimeStr,
          });

          try {
            const targetInstance = instanceName || tenant.whatsapp_instance_name || 'cliniassist_default';
            const sendRes = await this.evolutionClient.sendTextMessage({
              instanceName: targetInstance,
              number: rawNumber,
              text: replyText,
            });

            replySent = true;

            // Grava log da réplica enviada (OUTBOUND)
            await this.repo.logMessage(tenantId, {
              appointment_id: appointment?.id || null,
              patient_id: patient.id,
              direction: 'OUTBOUND',
              phone: rawNumber,
              message_text: replyText,
              status: 'SENT',
              evolution_message_id: sendRes.id,
            });
          } catch (err: any) {
            // AC-088: Falhas no envio da réplica não prejudicam a persistência da consulta
            console.warn('[WebhookService] Falha ao enviar réplica automática ao paciente:', err.message);
          }
        }
      }

      return {
        status: 'processed',
        statusCode: 200,
        data: {
          appointment_id: appointment?.id || null,
          patient_id: patient.id,
          new_status: newStatus,
          changed_mind: changedMind,
          requires_attention: requiresAttention,
          classification: parseResult.classification,
          reply_sent: replySent,
        },
      };
    }

    return {
      status: 'ignored_unhandled_event',
      statusCode: 200,
      data: { event },
    };
  }
}
