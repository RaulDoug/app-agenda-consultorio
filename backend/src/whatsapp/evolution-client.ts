export class EvolutionError extends Error {
  readonly statusCode: number;
  readonly isTransient: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'EvolutionError';
    this.statusCode = statusCode;
    this.isTransient = statusCode === 502 || statusCode === 503 || statusCode === 504 || statusCode === 429;
  }
}

export class EvolutionTransientError extends EvolutionError {
  constructor(message: string = 'Serviço temporariamente indisponível na Evolution API', statusCode: number = 502) {
    super(message, statusCode);
    this.name = 'EvolutionTransientError';
  }
}

export interface SendTextMessageOptions {
  instanceName: string;
  number: string;
  text: string;
}

export interface SendMessageResponse {
  id: string;
  remoteJid: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED';
  timestamp: number;
}

export interface InstanceConnectionState {
  instanceName: string;
  state: 'open' | 'close' | 'connecting';
}

export interface QrCodeResponse {
  instanceName: string;
  pairingCode?: string;
  code?: string;
  base64?: string;
}

export interface IEvolutionClient {
  sendTextMessage(options: SendTextMessageOptions): Promise<SendMessageResponse>;
  getConnectionState(instanceName: string): Promise<InstanceConnectionState>;
  getQrCode?(instanceName: string): Promise<QrCodeResponse>;
  createInstance?(instanceName: string): Promise<any>;
  logoutInstance?(instanceName: string): Promise<void>;
  deleteInstance?(instanceName: string): Promise<void>;
}

export class EvolutionHttpClient implements IEvolutionClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || process.env.EVOLUTION_API_URL || 'http://localhost:8080';
    this.apiKey = apiKey || process.env.EVOLUTION_API_KEY || 'odontoflow_key';
  }

  async createInstance(instanceName: string): Promise<any> {
    const url = `${this.baseUrl}/instance/create`;
    const payload = {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
        },
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      throw new EvolutionTransientError(`Falha ao criar instância na Evolution API: ${err.message}`, 503);
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Erro desconhecido');
      if (res.status !== 403 && !errorText.includes('already exists')) {
        throw new EvolutionError(`Falha ao criar instância: HTTP ${res.status} - ${errorText}`, res.status);
      }
    }

    // Configura webhook da instância apontando para o backend
    const webhookUrl = `${this.baseUrl}/webhook/set/${encodeURIComponent(instanceName)}`;
    const backendWebhookUrl = process.env.WEBHOOK_GLOBAL_URL || 'http://host.docker.internal:3000/api/webhooks/whatsapp';
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.apiKey,
      },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: backendWebhookUrl,
          byEvents: false,
          base64: false,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
        },
      }),
    }).catch(() => {});

    return await res.json().catch(() => ({}));
  }

  async logoutInstance(instanceName: string): Promise<void> {
    const url = `${this.baseUrl}/instance/logout/${instanceName}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'DELETE',
        headers: { apikey: this.apiKey },
      });
    } catch (err: any) {
      throw new EvolutionTransientError(`Falha ao desconectar instância: ${err.message}`, 503);
    }

    if (!res.ok && res.status !== 404 && res.status !== 400) {
      throw new EvolutionError(`Falha ao desconectar instância: HTTP ${res.status}`, res.status);
    }
  }

  async sendTextMessage(options: SendTextMessageOptions): Promise<SendMessageResponse> {
    const url = `${this.baseUrl}/message/sendText/${options.instanceName}`;
    const payload = {
      number: options.number,
      text: options.text,
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          apikey: this.apiKey,
        },
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      throw new EvolutionTransientError(`Falha de conexão com a Evolution API: ${err.message}`, 503);
    }

    if (res.status === 502 || res.status === 503 || res.status === 504 || res.status === 429) {
      throw new EvolutionTransientError(`Evolution API retornou erro transitório: HTTP ${res.status}`, res.status);
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Erro desconhecido');
      throw new EvolutionError(`Evolution API falhou: HTTP ${res.status} - ${errorText}`, res.status);
    }

    const data: any = await res.json();
    return {
      id: data?.key?.id || crypto.randomUUID(),
      remoteJid: data?.key?.remoteJid || `${options.number}@s.whatsapp.net`,
      status: 'SENT',
      timestamp: Date.now(),
    };
  }

  async getConnectionState(instanceName: string): Promise<InstanceConnectionState> {
    const url = `${this.baseUrl}/instance/connectionState/${instanceName}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'GET',
        headers: { apikey: this.apiKey },
      });
    } catch (err: any) {
      throw new EvolutionTransientError(`Falha ao checar status de conexão: ${err.message}`, 503);
    }

    if (res.status === 502 || res.status === 503) {
      throw new EvolutionTransientError(`Evolution API indisponível ao checar status: HTTP ${res.status}`, res.status);
    }

    if (res.status === 404) {
      return { instanceName, state: 'close' };
    }

    if (!res.ok) {
      throw new EvolutionError(`Falha ao obter status da instância: HTTP ${res.status}`, res.status);
    }

    const data: any = await res.json();
    return {
      instanceName,
      state: data?.instance?.state || 'close',
    };
  }

  async getQrCode(instanceName: string): Promise<QrCodeResponse> {
    const url = `${this.baseUrl}/instance/connect/${instanceName}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'GET',
        headers: { apikey: this.apiKey },
      });
    } catch (err: any) {
      throw new EvolutionTransientError(`Falha ao obter QR code: ${err.message}`, 503);
    }

    if (res.status === 404) {
      // Instância não existe: cria automaticamente e tenta conectar novamente
      await this.createInstance(instanceName).catch(() => {});
      try {
        res = await fetch(url, {
          method: 'GET',
          headers: { apikey: this.apiKey },
        });
      } catch (err: any) {
        throw new EvolutionTransientError(`Falha ao obter QR code após criação: ${err.message}`, 503);
      }
    }

    if (!res.ok) {
      throw new EvolutionError(`Falha ao gerar QR code: HTTP ${res.status}`, res.status);
    }

    const data: any = await res.json();
    return {
      instanceName,
      pairingCode: data?.pairingCode || data?.qrcode?.pairingCode,
      code: data?.code || data?.qrcode?.code,
      base64: data?.base64 || data?.qrcode?.base64,
    };
  }

  async deleteInstance(instanceName: string): Promise<void> {
    const url = `${this.baseUrl}/instance/delete/${encodeURIComponent(instanceName)}`;
    try {
      await fetch(url, {
        method: 'DELETE',
        headers: { apikey: this.apiKey },
      });
    } catch {
      // Ignora falha de exclusão
    }
  }
}

let activeEvolutionClient: IEvolutionClient | null = null;

export function getEvolutionClient(): IEvolutionClient {
  if (!activeEvolutionClient) {
    activeEvolutionClient = new EvolutionHttpClient();
  }
  return activeEvolutionClient;
}

export function setEvolutionClient(client: IEvolutionClient | null): void {
  activeEvolutionClient = client;
}

// Configuração canônica de retry e backoff para jobs BullMQ
export const BULLMQ_RETRY_BACKOFF_CONFIG = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000, // 1s, depois 2s, depois 4s...
  },
};

/**
 * Utilitário de envio com retry automático e backoff exponencial em erros transitórios (502/503)
 */
export async function sendWithRetry(
  client: IEvolutionClient,
  options: SendTextMessageOptions,
  maxRetries: number = 3,
  initialDelayMs: number = 10
): Promise<SendMessageResponse> {
  let attempt = 0;
  while (true) {
    try {
      attempt++;
      return await client.sendTextMessage(options);
    } catch (err: any) {
      if (err.isTransient && attempt < maxRetries) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}
