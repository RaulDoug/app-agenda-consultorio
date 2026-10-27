import { WhatsappRepository } from '../repositories/whatsapp-repository.js';
import { getConfirmationQueue, type IConfirmationQueue } from '../whatsapp/queue.js';
import { processSpintax } from '../whatsapp/spintax.js';
import {
  getEvolutionClient,
  type IEvolutionClient,
  type SendMessageResponse,
} from '../whatsapp/evolution-client.js';
import type {
  TenantWhatsappSettings,
  UpdateTenantWhatsappSettingsInput,
  WhatsappMessageRecord,
  WhatsappQueueItem,
  WhatsappQueueListResponse,
  WhatsappQueueItemCategory,
} from '@cliniassist/shared';

export interface SendManualMessageInput {
  number: string;
  text: string;
  appointmentId?: string;
  patientId?: string;
  instanceName?: string;
}

export interface SessionStatusResponse {
  connected: boolean;
  instanceName: string;
  state: 'open' | 'close' | 'connecting';
  qrcode?: string | null;
}

export class WhatsappService {
  private customRepo?: WhatsappRepository;
  private customEvolutionClient?: IEvolutionClient;
  private customQueue?: IConfirmationQueue;

  constructor(repo?: WhatsappRepository, evolutionClient?: IEvolutionClient, queue?: IConfirmationQueue) {
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
   * Consulta o estado atual da sessão WhatsApp do consultório, sincronizando com a Evolution API.
   */
  async getSession(tenantId: string): Promise<SessionStatusResponse> {
    const tenant = await this.repo.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Consultório não encontrado.');
    }

    const instanceName = tenant.whatsapp_instance_name || `cliniassist_${String(tenant.id).slice(0, 8)}`;

    if (tenant.whatsapp_connected) {
      return {
        connected: true,
        instanceName,
        state: 'open',
      };
    }

    // Se no banco consta como desconectado, checa rapidamente na Evolution API
    try {
      const conn = await Promise.race([
        this.evolutionClient.getConnectionState(instanceName),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 800)),
      ]);

      if (conn && conn.state === 'open') {
        await this.repo.updateTenantConnection(tenant.id, true);
        return {
          connected: true,
          instanceName,
          state: 'open',
        };
      }
    } catch {
      // Ignora timeout e continua para emissão de QR code
    }

    let qrcode: string | null = null;
    try {
      if (this.evolutionClient.getQrCode) {
        const qrRes = await this.evolutionClient.getQrCode(instanceName);
        if (qrRes && qrRes.base64) {
          qrcode = qrRes.base64.startsWith('data:') ? qrRes.base64 : `data:image/png;base64,${qrRes.base64}`;
        }
      }
    } catch {
      // QR Code em geração ou temporariamente indisponível
    }

    return {
      connected: false,
      instanceName,
      state: 'close',
      qrcode,
    };
  }

  /**
   * Solicita início da conexão gerando QR Code.
   */
  async connect(tenantId: string): Promise<SessionStatusResponse> {
    const tenant = await this.repo.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Consultório não encontrado.');
    }

    const instanceName = tenant.whatsapp_instance_name || `cliniassist_${String(tenant.id).slice(0, 8)}`;
    let qrcode: string | null = null;

    try {
      if (this.evolutionClient.getQrCode) {
        const qrRes = await this.evolutionClient.getQrCode(instanceName);
        if (qrRes && qrRes.base64) {
          qrcode = qrRes.base64.startsWith('data:') ? qrRes.base64 : `data:image/png;base64,${qrRes.base64}`;
        }
      }
    } catch {
      // Mantém null se ainda não gerou
    }

    return {
      connected: false,
      instanceName,
      state: 'connecting',
      qrcode,
    };
  }

  /**
   * Desconecta a instância do WhatsApp na Evolution API e no banco.
   */
  async disconnect(tenantId: string): Promise<{ success: boolean; connected: boolean }> {
    const tenant = await this.repo.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Consultório não encontrado.');
    }

    const instanceName = tenant.whatsapp_instance_name || `cliniassist_${String(tenant.id).slice(0, 8)}`;

    if (this.evolutionClient.logoutInstance) {
      try {
        await this.evolutionClient.logoutInstance(instanceName);
      } catch {
        // Ignora erro se já estava desconectado
      }
    }

    await this.repo.updateTenantConnection(tenant.id, false);

    return {
      success: true,
      connected: false,
    };
  }

  /**
   * Envia uma mensagem avulsa e grava no histórico auditável.
   */
  async sendMessage(
    tenantId: string,
    input: SendManualMessageInput
  ): Promise<{ success: boolean; result: SendMessageResponse; messageId: string }> {
    if (!input.number || !input.text) {
      throw new Error('Os campos number e text são obrigatórios.');
    }

    const tenant = await this.repo.getTenant(tenantId);
    const instanceName = input.instanceName || tenant?.whatsapp_instance_name || 'cliniassist_default';

    const cleanNumber = String(input.number).replace(/\D/g, '');
    const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;

    const sendRes = await this.evolutionClient.sendTextMessage({
      instanceName,
      number: formattedNumber,
      text: input.text,
    });

    const logged = await this.repo.logMessage(tenantId, {
      appointment_id: input.appointmentId,
      patient_id: input.patientId,
      direction: 'OUTBOUND',
      phone: formattedNumber,
      message_text: input.text,
      status: 'SENT',
      evolution_message_id: sendRes.id,
    });

    return {
      success: true,
      result: sendRes,
      messageId: logged.id,
    };
  }

  /**
   * Consulta as configurações de WhatsApp do consultório com auto-seed.
   */
  async getSettings(tenantId: string): Promise<TenantWhatsappSettings> {
    return await this.repo.ensureDefaultSettings(tenantId);
  }

  /**
   * Atualiza as configurações de WhatsApp do consultório.
   */
  async updateSettings(
    tenantId: string,
    input: UpdateTenantWhatsappSettingsInput
  ): Promise<TenantWhatsappSettings> {
    return await this.repo.upsertSettings(tenantId, input);
  }

  /**
   * Lista o histórico de mensagens por agendamento ou paciente.
   */
  async listMessages(
    tenantId: string,
    filters: { appointmentId?: string; patientId?: string; limit?: number } = {}
  ): Promise<WhatsappMessageRecord[]> {
    return await this.repo.listMessages(tenantId, filters);
  }

  /**
   * Obtém a visão geral da Central de Fila de WhatsApp enriquecida e categorizada.
   */
  async getQueueOverview(
    tenantId: string,
    filters: { startDate?: Date; endDate?: Date } = {}
  ): Promise<WhatsappQueueListResponse> {
    const rawAppointments = await this.repo.findQueueAppointments(tenantId, filters);
    const settings = await this.repo.ensureDefaultSettings(tenantId);
    const pendingJobs = await this.queue.getPendingJobs();
    const isPaused = await this.queue.isPaused();

    const counts = {
      total: rawAppointments.length,
      pending_queue: 0,
      awaiting_reply: 0,
      confirmed: 0,
      reschedule_requested: 0,
      human_attention: 0,
    };

    const items: WhatsappQueueItem[] = rawAppointments.map((app: any) => {
      let category: WhatsappQueueItemCategory = 'PENDING_QUEUE';

      if (app.appointment_status === 'CONFIRMED') {
        category = 'CONFIRMED';
        counts.confirmed++;
      } else if (app.appointment_status === 'RESCHEDULE_REQUESTED') {
        category = 'RESCHEDULE_REQUESTED';
        counts.reschedule_requested++;
      } else if (app.appointment_status === 'MESSAGE_RECEIVED') {
        category = 'HUMAN_ATTENTION';
        counts.human_attention++;
      } else if (app.last_outbound_at) {
        category = 'AWAITING_REPLY';
        counts.awaiting_reply++;
      } else {
        category = 'PENDING_QUEUE';
        counts.pending_queue++;
      }

      // Monta preview da mensagem (customizada ou interpolada com spintax)
      let preview = app.custom_message;
      if (!preview) {
        const d = new Date(app.appointment_start_time);
        const dataStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
        const horaStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
        const firstName = String(app.patient_name || '').trim().split(' ')[0];
        preview = processSpintax(settings.confirmation_message_template, {
          nome: firstName,
          data: dataStr,
          horario: horaStr,
        });
      }

      const job = pendingJobs.find((j) => j.data?.appointmentId === app.appointment_id);

      return {
        appointment_id: app.appointment_id,
        patient_id: app.patient_id,
        patient_name: app.patient_name,
        phone: app.phone,
        appointment_start_time: app.appointment_start_time,
        appointment_end_time: app.appointment_end_time,
        appointment_status: app.appointment_status,
        queue_category: category,
        queue_order: app.queue_order,
        queue_excluded: Boolean(app.queue_excluded),
        custom_message: app.custom_message || null,
        preview_message: preview,
        last_outbound_at: app.last_outbound_at ? new Date(app.last_outbound_at).toISOString() : null,
        last_inbound_text: app.last_inbound_text || null,
        last_inbound_at: app.last_inbound_at ? new Date(app.last_inbound_at).toISOString() : null,
        enqueued_job_id: job?.id || null,
        enqueued_delay_ms: job?.delay || null,
      };
    });

    return {
      items,
      queue_paused: isPaused,
      pending_jobs_count: pendingJobs.length,
      counts,
    };
  }

  /**
   * Envio manual instantâneo de item da fila (inclusive para consultas do mesmo dia).
   */
  async sendQueueItemNow(
    tenantId: string,
    appointmentId: string
  ): Promise<{ success: boolean; messageId: string }> {
    const rawList = await this.repo.findQueueAppointments(tenantId, {});
    const app = rawList.find((a: any) => a.appointment_id === appointmentId);
    if (!app) {
      throw new Error('Agendamento não encontrado na fila.');
    }

    // 1. Remove qualquer job agendado na fila automática do BullMQ
    await this.queue.removeJobByAppointmentId(appointmentId);

    // 2. Prepara mensagem
    const settings = await this.repo.ensureDefaultSettings(tenantId);
    let messageText = app.custom_message;
    if (!messageText) {
      const d = new Date(app.appointment_start_time);
      const dataStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
      const horaStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
      const firstName = String(app.patient_name || '').trim().split(' ')[0];
      messageText = processSpintax(settings.confirmation_message_template, {
        nome: firstName,
        data: dataStr,
        horario: horaStr,
      });
    }

    // 3. Dispara mensagem pela Evolution API
    const sendResult = await this.sendMessage(tenantId, {
      number: app.phone,
      text: messageText,
      appointmentId: app.appointment_id,
      patientId: app.patient_id,
    });

    return {
      success: true,
      messageId: sendResult.messageId,
    };
  }

  /**
   * Exclui logicamente da fila automática e cancela job pendente.
   */
  async removeQueueItem(tenantId: string, appointmentId: string): Promise<void> {
    await this.queue.removeJobByAppointmentId(appointmentId);
    await this.repo.excludeFromQueue(tenantId, appointmentId);
  }

  /**
   * Atualiza a mensagem customizada de um agendamento na fila.
   */
  async updateQueueItemMessage(
    tenantId: string,
    appointmentId: string,
    message: string | null
  ): Promise<void> {
    await this.repo.updateCustomMessage(tenantId, appointmentId, message);
  }

  /**
   * Reordena os itens da fila no banco.
   */
  async reorderQueue(tenantId: string, orderedAppointmentIds: string[]): Promise<void> {
    await this.repo.updateQueueOrder(tenantId, orderedAppointmentIds);
  }

  /**
   * Pausa ou retoma a fila de mensagens.
   */
  async setQueuePaused(paused: boolean): Promise<{ queue_paused: boolean }> {
    if (paused) {
      await this.queue.pause();
    } else {
      await this.queue.resume();
    }
    return { queue_paused: await this.queue.isPaused() };
  }

  /**
   * Confirma manualmente ou resolve atenção humana do agendamento.
   */
  async resolveQueueItemStatus(
    tenantId: string,
    appointmentId: string,
    newStatus: string
  ): Promise<void> {
    await this.repo.updateAppointmentStatus(tenantId, appointmentId, newStatus);
  }

}
