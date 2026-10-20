import { CliniAssistLocalDB, localDb } from '../local-db.js';
import type { LocalAuthSession } from '../types.js';
import type { AuthTenantProfile } from '@cliniassist/shared';

const SESSION_KEY = 'current';
const SAVED_EMAIL_META_KEY = 'last_authenticated_email';

export class AuthSessionLocalRepository {
  private db: CliniAssistLocalDB;

  constructor(db: CliniAssistLocalDB = localDb) {
    this.db = db;
  }

  get database(): CliniAssistLocalDB {
    return this.db;
  }

  /**
   * Recupera a sessão local atual. Retorna null se não houver sessão ativa.
   */
  async getSession(): Promise<LocalAuthSession | null> {
    const session = await this.db.auth_session.get(SESSION_KEY);
    return session || null;
  }

  /**
   * Salva ou substitui a sessão atual no Dexie de forma síncrona/atômica.
   * Não passa pela sync_outbox (credencial puramente local do dispositivo).
   */
  async saveSession(token: string, tenant: AuthTenantProfile): Promise<void> {
    const sessionRecord: LocalAuthSession = {
      key: SESSION_KEY,
      token,
      tenant,
      authenticated_at: new Date().toISOString(),
    };

    await this.db.auth_session.put(sessionRecord);

    if (tenant.email) {
      await this.setSavedEmail(tenant.email);
    }
  }

  /**
   * Atualiza os dados de perfil do tenant na sessão ativa existente.
   */
  async updateTenant(tenant: AuthTenantProfile): Promise<void> {
    const current = await this.getSession();
    if (current) {
      current.tenant = tenant;
      await this.db.auth_session.put(current);
    }
  }

  /**
   * Atualiza o token JWT na sessão ativa (ex: após troca de senha).
   */
  async updateToken(token: string): Promise<void> {
    const current = await this.getSession();
    if (current) {
      current.token = token;
      await this.db.auth_session.put(current);
    }
  }

  /**
   * Remove a sessão ativa do dispositivo (logout).
   */
  async clearSession(): Promise<void> {
    await this.db.auth_session.delete(SESSION_KEY);
  }

  /**
   * Recupera o último e-mail autenticado gravado no dispositivo.
   */
  async getSavedEmail(): Promise<string | null> {
    const meta = await this.db.sync_metadata.get(SAVED_EMAIL_META_KEY);
    return meta?.value || null;
  }

  /**
   * Grava o último e-mail autenticado com sucesso para preenchimento ágil.
   */
  async setSavedEmail(email: string): Promise<void> {
    await this.db.sync_metadata.put({
      key: SAVED_EMAIL_META_KEY,
      value: email.trim().toLowerCase(),
    });
  }

  /**
   * Contabiliza mutações pendentes na sync_outbox que ainda não subiram para o servidor.
   */
  async countPendingMutations(): Promise<number> {
    return this.db.sync_outbox.where('status').equals('PENDING').count();
  }

  /**
   * Limpa integralmente todas as tabelas do dispositivo (isolamento multi-tenant).
   */
  async clearAllData(): Promise<void> {
    await this.db.clearAll();
  }
}
