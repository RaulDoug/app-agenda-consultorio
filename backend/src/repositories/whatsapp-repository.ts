import { getDatabase, type IDatabase } from '../db/connection.js';
import type {
  TenantWhatsappSettings,
  UpdateTenantWhatsappSettingsInput,
  WhatsappMessageRecord,
  CreateWhatsappMessageInput,
} from '@cliniassist/shared';
import type { AppointmentConfirmationCandidate } from '../whatsapp/scheduler.js';

export const DEFAULT_WHATSAPP_TEMPLATES = {
  confirmation_message_template:
    '{Olá|Oi|Bom dia} {nome}, confirmamos seu agendamento para {data} às {horario}? Responda 1 para Sim ou 2 para Remarcar.',
  confirmation_reply_template:
    '{Perfeito|Excelente|Muito obrigado}, {nome}! Sua consulta foi confirmada para {data} às {horario}. Te esperamos na clínica! 🦷✨',
  reschedule_reply_template:
    '{Tudo bem|Entendido|Sem problemas}, {nome}! Já registramos sua solicitação de remarcação. Nossa equipe entrará em contato em breve para agendar um novo horário ideal para você. 😊',
  welcome_fallback_reply_template:
    '{Olá|Oi}, {nome}! Recebemos sua mensagem. Como sua solicitação requer atenção da nossa equipe, entraremos em contato em breve para esclarecer suas dúvidas e te atender da melhor forma! 😊',
  confirmation_hour: 9,
  confirmation_days_ahead: 1,
  auto_reply_enabled: true,
};

export class WhatsappRepository {
  private customDb?: IDatabase;

  constructor(db?: IDatabase) {
    this.customDb = db;
  }

  get db(): IDatabase {
    return this.customDb || getDatabase();
  }

  /**
   * Obtém as configurações de WhatsApp do consultório ou null se ainda não existirem.
   */
  async getSettings(tenantId: string): Promise<TenantWhatsappSettings | null> {
    const res = await this.db.query<TenantWhatsappSettings>(
      `SELECT id, tenant_id, confirmation_message_template, confirmation_reply_template,
              reschedule_reply_template, welcome_fallback_reply_template, confirmation_hour,
              confirmation_days_ahead, auto_reply_enabled, created_at, updated_at
       FROM whatsapp_settings
       WHERE tenant_id = $1`,
      [tenantId]
    );

    return res.rows[0] || null;
  }

  /**
   * Garante a existência das configurações padrão com auto-seed.
   */
  async ensureDefaultSettings(tenantId: string): Promise<TenantWhatsappSettings> {
    const existing = await this.getSettings(tenantId);
    if (existing) {
      return existing;
    }

    const res = await this.db.query<TenantWhatsappSettings>(
      `INSERT INTO whatsapp_settings (
        tenant_id, confirmation_message_template, confirmation_reply_template,
        reschedule_reply_template, welcome_fallback_reply_template, confirmation_hour,
        confirmation_days_ahead, auto_reply_enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (tenant_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      RETURNING id, tenant_id, confirmation_message_template, confirmation_reply_template,
                reschedule_reply_template, welcome_fallback_reply_template, confirmation_hour,
                confirmation_days_ahead, auto_reply_enabled, created_at, updated_at`,
      [
        tenantId,
        DEFAULT_WHATSAPP_TEMPLATES.confirmation_message_template,
        DEFAULT_WHATSAPP_TEMPLATES.confirmation_reply_template,
        DEFAULT_WHATSAPP_TEMPLATES.reschedule_reply_template,
        DEFAULT_WHATSAPP_TEMPLATES.welcome_fallback_reply_template,
        DEFAULT_WHATSAPP_TEMPLATES.confirmation_hour,
        DEFAULT_WHATSAPP_TEMPLATES.confirmation_days_ahead,
        DEFAULT_WHATSAPP_TEMPLATES.auto_reply_enabled,
      ]
    );

    return res.rows[0];
  }

  /**
   * Atualiza ou cria as configurações de WhatsApp para o consultório.
   */
  async upsertSettings(
    tenantId: string,
    input: UpdateTenantWhatsappSettingsInput
  ): Promise<TenantWhatsappSettings> {
    await this.ensureDefaultSettings(tenantId);

    const fields: string[] = [];
    const values: any[] = [tenantId];
    let paramIndex = 2;

    if (input.confirmation_message_template !== undefined) {
      fields.push(`confirmation_message_template = $${paramIndex++}`);
      values.push(input.confirmation_message_template);
    }
    if (input.confirmation_reply_template !== undefined) {
      fields.push(`confirmation_reply_template = $${paramIndex++}`);
      values.push(input.confirmation_reply_template);
    }
    if (input.reschedule_reply_template !== undefined) {
      fields.push(`reschedule_reply_template = $${paramIndex++}`);
      values.push(input.reschedule_reply_template);
    }
    if (input.welcome_fallback_reply_template !== undefined) {
      fields.push(`welcome_fallback_reply_template = $${paramIndex++}`);
      values.push(input.welcome_fallback_reply_template);
    }
    if (input.confirmation_hour !== undefined) {
      fields.push(`confirmation_hour = $${paramIndex++}`);
      values.push(input.confirmation_hour);
    }
    if (input.confirmation_days_ahead !== undefined) {
      fields.push(`confirmation_days_ahead = $${paramIndex++}`);
      values.push(input.confirmation_days_ahead);
    }
    if (input.auto_reply_enabled !== undefined) {
      fields.push(`auto_reply_enabled = $${paramIndex++}`);
      values.push(input.auto_reply_enabled);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `
      UPDATE whatsapp_settings
      SET ${fields.join(', ')}
      WHERE tenant_id = $1
      RETURNING id, tenant_id, confirmation_message_template, confirmation_reply_template,
                reschedule_reply_template, welcome_fallback_reply_template, confirmation_hour,
                confirmation_days_ahead, auto_reply_enabled, created_at, updated_at
    `;

    const res = await this.db.query<TenantWhatsappSettings>(sql, values);
    return res.rows[0];
  }

  /**
   * Verifica se o agendamento já recebeu notificação de envio nas últimas X horas (idempotência).
   */
  async hasRecentNotification(appointmentId: string, hours: number = 12): Promise<boolean> {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const res = await this.db.query(
      `SELECT 1 FROM whatsapp_messages
       WHERE appointment_id = $1 AND direction = 'OUTBOUND' AND created_at >= $2
       LIMIT 1`,
      [appointmentId, cutoffDate.toISOString()]
    );

    return res.rows.length > 0;
  }

  /**
   * Busca consultas pendentes no dia alvo para disparo de confirmação.
   */
  async findPendingAppointmentsForConfirmation(
    tenantId: string,
    targetDate: Date,
    options?: { ignoreRecentlyNotifiedHours?: number }
  ): Promise<AppointmentConfirmationCandidate[]> {
    // Define início e fim do dia alvo
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const params: any[] = [tenantId, startOfDay.toISOString(), endOfDay.toISOString()];
    let sql = `
      SELECT a.id AS appointment_id,
             a.tenant_id,
             t.whatsapp_instance_name AS instance_name,
             p.whatsapp AS phone,
             p.name AS patient_name,
             a.start_time AS appointment_start_time
      FROM appointments a
      JOIN tenants t ON t.id = a.tenant_id
      JOIN patients p ON p.id = a.patient_id AND p.deleted_at IS NULL AND p.is_active = true
      WHERE a.tenant_id = $1
        AND a.deleted_at IS NULL
        AND a.status = 'PENDING'
        AND COALESCE(a.whatsapp_queue_excluded, false) = false
        AND a.start_time >= $2
        AND a.start_time <= $3
    `;

    if (options?.ignoreRecentlyNotifiedHours) {
      const cutoff = new Date(Date.now() - options.ignoreRecentlyNotifiedHours * 60 * 60 * 1000);
      params.push(cutoff.toISOString());
      sql += `
        AND a.id NOT IN (
          SELECT wm.appointment_id FROM whatsapp_messages wm
          WHERE wm.appointment_id IS NOT NULL
            AND wm.direction = 'OUTBOUND'
            AND wm.created_at >= $${params.length}
        )
      `;
    }

    sql += ` ORDER BY COALESCE(a.whatsapp_queue_order, 0) ASC, a.start_time ASC`;

    const res = await this.db.query(sql, params);
    return res.rows.map((r: any) => ({
      appointmentId: r.appointment_id,
      tenantId: r.tenant_id,
      instanceName: r.instance_name || 'cliniassist_default',
      phone: r.phone,
      patientName: r.patient_name,
      appointmentStartTime:
        typeof r.appointment_start_time === 'string'
          ? r.appointment_start_time
          : new Date(r.appointment_start_time).toISOString(),
    }));
  }

  /**
   * Grava log de mensagem enviada ou recebida na tabela whatsapp_messages.
   */
  async logMessage(
    tenantId: string,
    data: CreateWhatsappMessageInput & { created_at?: string }
  ): Promise<WhatsappMessageRecord> {
    const res = await this.db.query<WhatsappMessageRecord>(
      `INSERT INTO whatsapp_messages (
        tenant_id, appointment_id, patient_id, direction, phone,
        message_text, status, evolution_message_id, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, CURRENT_TIMESTAMP))
      RETURNING id, tenant_id, appointment_id, patient_id, direction, phone,
                message_text, status, evolution_message_id, created_at`,
      [
        tenantId,
        data.appointment_id || null,
        data.patient_id || null,
        data.direction,
        data.phone,
        data.message_text,
        data.status,
        data.evolution_message_id || null,
        data.created_at || null,
      ]
    );

    return res.rows[0];
  }

  /**
   * Lista o histórico de mensagens por agendamento ou paciente com isolamento multi-tenant.
   */
  async listMessages(
    tenantId: string,
    filters: { appointmentId?: string; patientId?: string; limit?: number } = {}
  ): Promise<WhatsappMessageRecord[]> {
    const params: any[] = [tenantId];
    let sql = `
      SELECT id, tenant_id, appointment_id, patient_id, direction, phone,
             message_text, status, evolution_message_id, created_at
      FROM whatsapp_messages
      WHERE tenant_id = $1
    `;

    if (filters.appointmentId) {
      params.push(filters.appointmentId);
      sql += ` AND appointment_id = $${params.length}`;
    }

    if (filters.patientId) {
      params.push(filters.patientId);
      sql += ` AND patient_id = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC, id DESC`;

    const limit = filters.limit ? Math.min(Math.max(filters.limit, 1), 100) : 50;
    params.push(limit);
    sql += ` LIMIT $${params.length}`;

    const res = await this.db.query<WhatsappMessageRecord>(sql, params);
    return res.rows;
  }

  /**
   * Busca paciente por telefone com tolerância aos últimos dígitos.
   */
  async findPatientByPhone(tenantId: string, rawPhone: string): Promise<any | null> {
    const cleanNumber = rawPhone.replace(/\D/g, '');
    const lastDigits = cleanNumber.slice(-8);

    const res = await this.db.query(
      `SELECT id, tenant_id, name, whatsapp
       FROM patients
       WHERE tenant_id = $1
         AND (whatsapp = $2 OR whatsapp LIKE $3)
         AND deleted_at IS NULL
         AND is_active = true
       LIMIT 1`,
      [tenantId, cleanNumber, `%${lastDigits}`]
    );

    return res.rows[0] || null;
  }

  /**
   * Busca consulta ativa mais relevante para o paciente.
   */
  async findRelevantAppointmentForPatient(tenantId: string, patientId: string): Promise<any | null> {
    const res = await this.db.query(
      `SELECT id, tenant_id, patient_id, status, start_time
       FROM appointments
       WHERE tenant_id = $1
         AND patient_id = $2
         AND deleted_at IS NULL
         AND status IN ('PENDING', 'CONFIRMED', 'MESSAGE_RECEIVED')
       ORDER BY 
         CASE 
           WHEN status = 'PENDING' THEN 0 
           WHEN status = 'MESSAGE_RECEIVED' THEN 1 
           ELSE 2 
         END ASC,
         created_at DESC,
         start_time ASC
       LIMIT 1`,
      [tenantId, patientId]
    );

    return res.rows[0] || null;
  }

  /**
   * Atualiza status do agendamento respeitando multi-tenant.
   */
  async updateAppointmentStatus(
    tenantId: string,
    appointmentId: string,
    newStatus: string
  ): Promise<void> {
    await this.db.query(
      `UPDATE appointments
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL`,
      [newStatus, appointmentId, tenantId]
    );
  }

  /**
   * Atualiza status de conexão do WhatsApp no tenant.
   */
  async updateTenantConnection(identifier: string, connected: boolean, byInstance: boolean = false): Promise<void> {
    const clause = byInstance ? 'whatsapp_instance_name = $1' : 'id = $1';
    await this.db.query(
      `UPDATE tenants
       SET whatsapp_connected = $2
       WHERE ${clause}`,
      [identifier, connected]
    );
  }

  /**
   * Busca dados do tenant por ID ou por instanceName.
   */
  async getTenant(identifier: string, byInstance: boolean = false): Promise<any | null> {
    const clause = byInstance ? 'whatsapp_instance_name = $1' : 'id = $1';
    const res = await this.db.query(
      `SELECT id, name, whatsapp_instance_name, whatsapp_connected, is_active
       FROM tenants
       WHERE ${clause}`,
      [identifier]
    );
    return res.rows[0] || null;
  }

  /**
   * Garante de forma idempotente a existência das colunas da fila em appointments.
   */
  async ensureQueueColumns(): Promise<void> {
    try {
      await this.db.query(`
        ALTER TABLE appointments
        ADD COLUMN IF NOT EXISTS whatsapp_queue_excluded BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS whatsapp_custom_message TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS whatsapp_queue_order INT DEFAULT 0;
      `);
    } catch {
      // Ignora erro se as colunas já existirem ou se emuladores em memória tiverem restrições
    }
  }

  /**
   * Lista itens elegíveis para a central de fila de WhatsApp com dados enriquecidos e isolamento multi-tenant.
   */
  async findQueueAppointments(
    tenantId: string,
    filters: { startDate?: Date; endDate?: Date }
  ): Promise<any[]> {
    await this.ensureQueueColumns();

    const params: any[] = [tenantId];
    let sql = `
      SELECT a.id AS appointment_id,
             a.patient_id,
             p.name AS patient_name,
             p.whatsapp AS phone,
             a.start_time AS appointment_start_time,
             a.end_time AS appointment_end_time,
             a.status AS appointment_status,
             COALESCE(a.whatsapp_queue_order, 0) AS queue_order,
             COALESCE(a.whatsapp_queue_excluded, false) AS queue_excluded,
             a.whatsapp_custom_message AS custom_message
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id AND p.deleted_at IS NULL AND p.is_active = true
      WHERE a.tenant_id = $1
        AND a.deleted_at IS NULL
        AND a.status IN ('PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED', 'MESSAGE_RECEIVED')
        AND COALESCE(a.whatsapp_queue_excluded, false) = false
    `;

    if (filters.startDate) {
      params.push(filters.startDate.toISOString());
      sql += " AND a.start_time >= $" + params.length;
    }
    if (filters.endDate) {
      params.push(filters.endDate.toISOString());
      sql += " AND a.start_time <= $" + params.length;
    }

    sql += ` ORDER BY COALESCE(a.whatsapp_queue_order, 0) ASC, a.start_time ASC`;

    const res = await this.db.query(sql, params);
    const rows = res.rows;

    if (rows.length === 0) return [];

    // Busca as últimas mensagens para os agendamentos retornados
    const appointmentIds = rows.map((r: any) => r.appointment_id);
    const msgsRes = await this.db.query(
      `SELECT appointment_id, direction, message_text, created_at
       FROM whatsapp_messages
       WHERE tenant_id = $1 AND appointment_id = ANY($2)
       ORDER BY created_at DESC`,
      [tenantId, appointmentIds]
    );

    const msgsByApp: Record<string, { lastOut?: any; lastIn?: any }> = {};
    for (const msg of msgsRes.rows) {
      if (!msgsByApp[msg.appointment_id]) {
        msgsByApp[msg.appointment_id] = {};
      }
      if (msg.direction === 'OUTBOUND' && !msgsByApp[msg.appointment_id].lastOut) {
        msgsByApp[msg.appointment_id].lastOut = msg;
      } else if (msg.direction === 'INBOUND' && !msgsByApp[msg.appointment_id].lastIn) {
        msgsByApp[msg.appointment_id].lastIn = msg;
      }
    }

    return rows.map((r: any) => {
      const msgs = msgsByApp[r.appointment_id] || {};
      return {
        ...r,
        last_outbound_at: msgs.lastOut?.created_at || null,
        last_inbound_text: msgs.lastIn?.message_text || null,
        last_inbound_at: msgs.lastIn?.created_at || null,
      };
    });
  }

  /**
   * Exclusão lógica da fila de envio automático (mantendo o agendamento ativo).
   */
  async excludeFromQueue(tenantId: string, appointmentId: string): Promise<void> {
    await this.db.query(
      `UPDATE appointments
         SET whatsapp_queue_excluded = true, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [appointmentId, tenantId]
    );
  }

  /**
   * Edita mensagem customizada para o agendamento na fila.
   */
  async updateCustomMessage(tenantId: string, appointmentId: string, customMessage: string | null): Promise<void> {
    await this.db.query(
      `UPDATE appointments
         SET whatsapp_custom_message = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL`,
      [customMessage, appointmentId, tenantId]
    );
  }

  /**
   * Atualiza a ordem dos agendamentos na fila de envio.
   */
  async updateQueueOrder(tenantId: string, orderedAppointmentIds: string[]): Promise<void> {
    for (let i = 0; i < orderedAppointmentIds.length; i++) {
      await this.db.query(
        `UPDATE appointments
           SET whatsapp_queue_order = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL`,
        [i + 1, orderedAppointmentIds[i], tenantId]
      );
    }
  }

}
