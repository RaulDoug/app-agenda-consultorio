import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryDatabase, type IDatabase } from '../../db/connection.js';
import { WhatsappRepository, DEFAULT_WHATSAPP_TEMPLATES } from '../whatsapp-repository.js';

describe('WhatsappRepository — Persistência, Settings, Logs e Multi-Tenant', () => {
  let db: IDatabase;
  let repo: WhatsappRepository;

  const tenantA = '11111111-1111-1111-1111-111111111111';
  const tenantB = '22222222-2222-2222-2222-222222222222';

  beforeEach(async () => {
    db = createInMemoryDatabase();
    repo = new WhatsappRepository(db);

    await db.query(
      `INSERT INTO tenants (id, name, whatsapp_instance_name, whatsapp_connected)
       VALUES ($1, 'Clínica Sorriso A', 'sorriso_a', true),
              ($2, 'Clínica Saúde B', 'saude_b', false)`,
      [tenantA, tenantB]
    );
  });

  describe('Gestão de Configurações de WhatsApp (Settings)', () => {
    it('deve realizar auto-seed das configurações padrão quando o consultório não possuir settings cadastradas', async () => {
      const initial = await repo.getSettings(tenantA);
      expect(initial).toBeNull();

      const created = await repo.ensureDefaultSettings(tenantA);
      expect(created).toBeDefined();
      expect(created.tenant_id).toBe(tenantA);
      expect(created.confirmation_hour).toBe(9);
      expect(created.confirmation_days_ahead).toBe(1);
      expect(created.auto_reply_enabled).toBe(true);
      expect(created.confirmation_message_template).toBe(DEFAULT_WHATSAPP_TEMPLATES.confirmation_message_template);

      // Segunda chamada deve retornar o mesmo registro sem duplicar
      const secondCall = await repo.ensureDefaultSettings(tenantA);
      expect(secondCall.id).toBe(created.id);
    });

    it('deve atualizar configurações existentes preservando isolamento multi-tenant', async () => {
      await repo.ensureDefaultSettings(tenantA);
      await repo.ensureDefaultSettings(tenantB);

      const updated = await repo.upsertSettings(tenantA, {
        confirmation_hour: 8,
        confirmation_days_ahead: 2,
        confirmation_message_template: 'Olá {nome}, confirmamos seu horário às {horario}?',
      });

      expect(updated.confirmation_hour).toBe(8);
      expect(updated.confirmation_days_ahead).toBe(2);
      expect(updated.confirmation_message_template).toBe('Olá {nome}, confirmamos seu horário às {horario}?');

      // Tenant B deve continuar intacto com os valores padrão
      const settingsB = await repo.getSettings(tenantB);
      expect(settingsB?.confirmation_hour).toBe(9);
      expect(settingsB?.confirmation_days_ahead).toBe(1);
    });
  });

  describe('Busca de Candidatos para Confirmação e Idempotência', () => {
    it('deve localizar apenas consultas PENDING do dia alvo respeitando multi-tenant e soft-delete', async () => {
      // Cria paciente no Tenant A
      const patRes = await db.query(
        `INSERT INTO patients (tenant_id, name, whatsapp) VALUES ($1, 'Carlos Paciente', '5511999991111') RETURNING id`,
        [tenantA]
      );
      const patientId = patRes.rows[0].id;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      // Agendamento válido para amanhã
      await db.query(
        `INSERT INTO appointments (tenant_id, patient_id, start_time, end_time, status)
         VALUES ($1, $2, $3, $4, 'PENDING')`,
        [tenantA, patientId, tomorrow.toISOString(), new Date(tomorrow.getTime() + 30 * 60000).toISOString()]
      );

      // Agendamento cancelado (soft-deleted) para amanhã -> NÃO deve vir
      await db.query(
        `INSERT INTO appointments (tenant_id, patient_id, start_time, end_time, status, deleted_at)
         VALUES ($1, $2, $3, $4, 'PENDING', CURRENT_TIMESTAMP)`,
        [tenantA, patientId, tomorrow.toISOString(), new Date(tomorrow.getTime() + 30 * 60000).toISOString()]
      );

      const candidates = await repo.findPendingAppointmentsForConfirmation(tenantA, tomorrow);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].patientName).toBe('Carlos Paciente');
      expect(candidates[0].instanceName).toBe('sorriso_a');

      // Tenant B não deve enxergar
      const candidatesB = await repo.findPendingAppointmentsForConfirmation(tenantB, tomorrow);
      expect(candidatesB).toHaveLength(0);
    });

    it('deve aplicar idempotência e ignorar agendamentos que já receberam notificação nas últimas 12 horas', async () => {
      const patRes = await db.query(
        `INSERT INTO patients (tenant_id, name, whatsapp) VALUES ($1, 'Juliana Silva', '5511988882222') RETURNING id`,
        [tenantA]
      );
      const patientId = patRes.rows[0].id;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      const appRes = await db.query(
        `INSERT INTO appointments (tenant_id, patient_id, start_time, end_time, status)
         VALUES ($1, $2, $3, $4, 'PENDING') RETURNING id`,
        [tenantA, patientId, tomorrow.toISOString(), new Date(tomorrow.getTime() + 30 * 60000).toISOString()]
      );
      const appointmentId = appRes.rows[0].id;

      // Sem log prévio -> deve encontrar
      const firstCheck = await repo.findPendingAppointmentsForConfirmation(tenantA, tomorrow, {
        ignoreRecentlyNotifiedHours: 12,
      });
      expect(firstCheck).toHaveLength(1);

      // Registra mensagem enviada há 1 hora
      await repo.logMessage(tenantA, {
        appointment_id: appointmentId,
        patient_id: patientId,
        direction: 'OUTBOUND',
        phone: '5511988882222',
        message_text: 'Confirmação',
        status: 'SENT',
      });

      // Com log recente -> deve ser ignorado pela idempotência
      const hasRecent = await repo.hasRecentNotification(appointmentId, 12);
      expect(hasRecent).toBe(true);

      const secondCheck = await repo.findPendingAppointmentsForConfirmation(tenantA, tomorrow, {
        ignoreRecentlyNotifiedHours: 12,
      });
      expect(secondCheck).toHaveLength(0);
    });
  });

  describe('Histórico e Rastreabilidade de Mensagens (Audit Logs)', () => {
    it('deve registrar mensagens e permitir consulta com filtros e isolamento multi-tenant', async () => {
      const patRes = await db.query(
        `INSERT INTO patients (tenant_id, name, whatsapp) VALUES ($1, 'Ana Clara', '5511977773333') RETURNING id`,
        [tenantA]
      );
      const patientId = patRes.rows[0].id;

      const msgOut = await repo.logMessage(tenantA, {
        patient_id: patientId,
        direction: 'OUTBOUND',
        phone: '5511977773333',
        message_text: 'Olá Ana, confirmamos sua consulta?',
        status: 'SENT',
        evolution_message_id: 'evo-12345',
        created_at: new Date('2026-10-20T10:00:00.000Z').toISOString(),
      });

      expect(msgOut.id).toBeDefined();
      expect(msgOut.direction).toBe('OUTBOUND');
      expect(msgOut.status).toBe('SENT');

      const msgIn = await repo.logMessage(tenantA, {
        patient_id: patientId,
        direction: 'INBOUND',
        phone: '5511977773333',
        message_text: '1',
        status: 'RECEIVED',
        created_at: new Date('2026-10-20T10:05:00.000Z').toISOString(),
      });

      expect(msgIn.direction).toBe('INBOUND');

      const messagesA = await repo.listMessages(tenantA, { patientId });
      expect(messagesA).toHaveLength(2);
      expect(messagesA[0].id).toBe(msgIn.id); // 10:05 vem antes de 10:00 em DESC
      expect(messagesA[1].id).toBe(msgOut.id);

      // Tenant B não deve ter acesso às mensagens do Tenant A
      const messagesB = await repo.listMessages(tenantB);
      expect(messagesB).toHaveLength(0);
    });
  });
});
