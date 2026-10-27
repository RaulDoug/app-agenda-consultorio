import type {
  WhatsappQueueListResponse,
  TenantWhatsappSettings,
  UpdateTenantWhatsappSettingsInput,
} from '@cliniassist/shared';

export interface GetQueueFilters {
  startDate?: string;
  endDate?: string;
}

export class WhatsappQueueApiClient {
  constructor(private token?: string) {}

  private get headers(): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      h['Authorization'] = `Bearer ${this.token}`;
    }
    return h;
  }

  async getQueue(filters: GetQueueFilters = {}): Promise<WhatsappQueueListResponse> {
    const query = new URLSearchParams();
    if (filters.startDate) query.set('startDate', filters.startDate);
    if (filters.endDate) query.set('endDate', filters.endDate);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`/api/whatsapp/queue${qs}`, {
      headers: this.headers,
    });
    if (!res.ok) {
      throw new Error('Falha ao carregar fila de WhatsApp.');
    }
    return res.json();
  }

  async sendNow(appointmentId: string): Promise<{ success: boolean; messageId: string }> {
    const res = await fetch(`/api/whatsapp/queue/${appointmentId}/send-now`, {
      method: 'POST',
      headers: this.headers,
    });
    if (!res.ok) {
      throw new Error('Falha ao disparar mensagem.');
    }
    return res.json();
  }

  async excludeFromQueue(appointmentId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/whatsapp/queue/${appointmentId}`, {
      method: 'DELETE',
      headers: this.headers,
    });
    if (!res.ok) {
      throw new Error('Falha ao remover item da fila.');
    }
    return res.json();
  }

  async updateMessage(appointmentId: string, message: string | null): Promise<{ success: boolean }> {
    const res = await fetch(`/api/whatsapp/queue/${appointmentId}/message`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      throw new Error('Falha ao atualizar mensagem do agendamento.');
    }
    return res.json();
  }

  async reorderQueue(orderedAppointmentIds: string[]): Promise<{ success: boolean }> {
    const res = await fetch('/api/whatsapp/queue/reorder', {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify({ orderedAppointmentIds }),
    });
    if (!res.ok) {
      throw new Error('Falha ao reordenar fila.');
    }
    return res.json();
  }

  async setQueuePause(paused: boolean): Promise<{ queue_paused: boolean }> {
    const res = await fetch('/api/whatsapp/queue/pause', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ paused }),
    });
    if (!res.ok) {
      throw new Error('Falha ao alterar estado da fila.');
    }
    return res.json();
  }

  async triggerBatch(force: boolean = false): Promise<any> {
    const res = await fetch('/api/whatsapp/batch-confirmations/trigger', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ force }),
    });
    if (!res.ok) {
      throw new Error('Falha ao acionar disparo em lote.');
    }
    return res.json();
  }

  async getSettings(): Promise<TenantWhatsappSettings> {
    const res = await fetch('/api/whatsapp/settings', {
      headers: this.headers,
    });
    if (!res.ok) {
      throw new Error('Falha ao carregar configurações de WhatsApp.');
    }
    return res.json();
  }

  async updateSettings(input: UpdateTenantWhatsappSettingsInput): Promise<TenantWhatsappSettings> {
    const res = await fetch('/api/whatsapp/settings', {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new Error('Falha ao atualizar templates de WhatsApp.');
    }
    return res.json();
  }

  async resolveStatus(appointmentId: string, status: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/whatsapp/queue/${appointmentId}/status`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      throw new Error('Falha ao atualizar status do agendamento.');
    }
    return res.json();
  }
}
