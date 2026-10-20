import { WhatsappRepository } from '../repositories/whatsapp-repository.js';
import {
  getEvolutionClient,
  type IEvolutionClient,
  type SendMessageResponse,
} from '../whatsapp/evolution-client.js';
import type {
  TenantWhatsappSettings,
  UpdateTenantWhatsappSettingsInput,
  WhatsappMessageRecord,
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

  constructor(repo?: WhatsappRepository, evolutionClient?: IEvolutionClient) {
    this.customRepo = repo;
    this.customEvolutionClient = evolutionClient;
  }

  private get repo(): WhatsappRepository {
    return this.customRepo || new WhatsappRepository();
  }

  private get evolutionClient(): IEvolutionClient {
    return this.customEvolutionClient || getEvolutionClient();
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
}
