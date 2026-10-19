import {
  type IEvolutionClient,
  type SendTextMessageOptions,
  type SendMessageResponse,
  type InstanceConnectionState,
  EvolutionTransientError,
  EvolutionError,
} from '../evolution-client.js';

export class MockEvolutionClient implements IEvolutionClient {
  public sentMessages: SendTextMessageOptions[] = [];
  public connectionStates: Map<string, 'open' | 'close' | 'connecting'> = new Map();

  // Configuração para simular falhas transitórias controladas (502/503)
  public failuresRemaining: number = 0;
  public simulatedFailureStatus: number = 502;
  public totalAttempts: number = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.sentMessages = [];
    this.connectionStates.clear();
    this.failuresRemaining = 0;
    this.simulatedFailureStatus = 502;
    this.totalAttempts = 0;
  }

  setConnectionState(instanceName: string, state: 'open' | 'close' | 'connecting'): void {
    this.connectionStates.set(instanceName, state);
  }

  simulateTransientFailures(count: number, statusCode: number = 502): void {
    this.failuresRemaining = count;
    this.simulatedFailureStatus = statusCode;
  }

  async sendTextMessage(options: SendTextMessageOptions): Promise<SendMessageResponse> {
    this.totalAttempts++;

    if (this.failuresRemaining > 0) {
      this.failuresRemaining--;
      if (this.simulatedFailureStatus === 502 || this.simulatedFailureStatus === 503) {
        throw new EvolutionTransientError(
          `Erro simulado transitório HTTP ${this.simulatedFailureStatus}`,
          this.simulatedFailureStatus
        );
      }
      throw new EvolutionError(
        `Erro simulado HTTP ${this.simulatedFailureStatus}`,
        this.simulatedFailureStatus
      );
    }

    this.sentMessages.push(options);

    return {
      id: `mock-msg-${this.sentMessages.length}-${Date.now()}`,
      remoteJid: `${options.number}@s.whatsapp.net`,
      status: 'SENT',
      timestamp: Date.now(),
    };
  }

  async getConnectionState(instanceName: string): Promise<InstanceConnectionState> {
    const state = this.connectionStates.get(instanceName) || 'close';
    return {
      instanceName,
      state,
    };
  }

  public deletedInstances: string[] = [];
  public customQrCodes: Map<string, any> = new Map();

  async createInstance(instanceName: string): Promise<any> {
    this.connectionStates.set(instanceName, 'close');
    return { instance: { instanceName, state: 'close' } };
  }

  async logoutInstance(instanceName: string): Promise<void> {
    this.connectionStates.set(instanceName, 'close');
  }

  async deleteInstance(instanceName: string): Promise<void> {
    this.deletedInstances.push(instanceName);
    this.connectionStates.delete(instanceName);
  }

  setQrCodeResponse(instanceName: string, response: any): void {
    this.customQrCodes.set(instanceName, response);
  }

  async getQrCode(instanceName: string) {
    if (this.customQrCodes.has(instanceName)) {
      return this.customQrCodes.get(instanceName);
    }
    return {
      instanceName,
      base64: 'data:image/png;base64,mockQrCodeLiveValidBase64String12345',
      code: 'mock-pairing-code-live',
    };
  }
}
