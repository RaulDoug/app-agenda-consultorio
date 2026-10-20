export interface ApiClientOptions {
  baseUrl?: string;
  getToken?: () => string | null | undefined;
  onSessionExpired?: () => void;
  onPasswordChangeRequired?: () => void;
}

export interface RequestOptions extends RequestInit {
  skipAuthHandling?: boolean;
}

export class ApiClient {
  private baseUrl: string;
  private getToken?: () => string | null | undefined;
  private onSessionExpired?: () => void;
  private onPasswordChangeRequired?: () => void;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || '';
    this.getToken = options.getToken;
    this.onSessionExpired = options.onSessionExpired;
    this.onPasswordChangeRequired = options.onPasswordChangeRequired;
  }

  async request(path: string, options: RequestOptions = {}): Promise<Response> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Injeta token Bearer se disponível
    if (this.getToken) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Garante JSON por padrão caso haja body
    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!options.skipAuthHandling) {
      if (response.status === 401) {
        if (this.onSessionExpired) {
          this.onSessionExpired();
        }
      } else if (response.status === 403) {
        try {
          const clone = response.clone();
          const data = await clone.json();
          if (data?.code === 'PASSWORD_CHANGE_REQUIRED') {
            if (this.onPasswordChangeRequired) {
              this.onPasswordChangeRequired();
            }
          }
        } catch {
          // Ignora se não for JSON
        }
      }
    }

    return response;
  }
}
