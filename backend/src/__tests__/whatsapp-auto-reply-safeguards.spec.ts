import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../db/connection.js';
import { setEvolutionClient } from '../whatsapp/evolution-client.js';
import { MockEvolutionClient } from '../whatsapp/__tests__/mock-evolution.js';
import { WhatsappRepository } from '../repositories/whatsapp-repository.js';
import { processSpintax } from '../whatsapp/spintax.js';

describe('Feature: Salvaguardas de Resposta Automática no WhatsApp (US-130)', () => {
  let db: IDatabase;
  let testApp: Express;
  let mockClient: MockEvolutionClient;
  let repo: WhatsappRepository;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const instanceName = 'cliniassist_test_inst';
  const registeredPhone = '5511999990001';
  const unknownPhone = '5511888880002';
  let patientId: string;
  let appointmentId: string;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    mockClient = new MockEvolutionClient();
    setEvolutionClient(mockClient);
    repo = new WhatsappRepository(db);
    testApp = createApp();

    await db.query(
      `INSERT INTO tenants (id, name, whatsapp_instance_name, whatsapp_connected, is_active)
       VALUES ($1, 'Consultório OdontoTest', $2, true, true)`,
      [tenantId, instanceName]
    );

    const patRes = await db.query(
      `INSERT INTO patients (tenant_id, name, whatsapp, is_active)
       VALUES ($1, 'Ana Costa', $2, true)
       RETURNING id`,
      [tenantId, registeredPhone]
    );
    patientId = patRes.rows[0].id;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const appRes = await db.query(
      `INSERT INTO appointments (tenant_id, patient_id, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING id`,
      [tenantId, patientId, tomorrow.toISOString(), new Date(tomorrow.getTime() + 30 * 60000).toISOString()]
    );
    appointmentId = appRes.rows[0].id;
  });

  describe('US-130 — Configuração de Escopo e Salvaguardas de Resposta Automática no WhatsApp', () => {
    it('AC-234: Salvaguarda para modo Apenas Cadastrados (REGISTERED_ONLY) e modo Desativado (DISABLED) @spec:AC-234', async () => {
      // Cenário 1: Escopo padrão REGISTERED_ONLY — Número desconhecido é ignorado silenciosamente
      await repo.upsertSettings(tenantId, {
        auto_reply_scope: 'REGISTERED_ONLY',
        auto_reply_enabled: true,
      });

      const resUnknown = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send({
          event: 'messages.upsert',
          instance: instanceName,
          data: {
            key: {
              remoteJid: `${unknownPhone}@s.whatsapp.net`,
              fromMe: false,
            },
            message: {
              conversation: 'Olá, qual o valor da consulta?',
            },
          },
        });

      expect(resUnknown.status).toBe(200);
      expect(resUnknown.body.status).toBe('ignored_unknown_number');
      expect(mockClient.sentMessages.length).toBe(0);

      // Cenário 2: Escopo DISABLED (ou auto_reply_enabled = false) — Nenhuma réplica é enviada nem para cadastrados
      await repo.upsertSettings(tenantId, {
        auto_reply_scope: 'DISABLED',
        auto_reply_enabled: false,
      });

      const resDisabledRegistered = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send({
          event: 'messages.upsert',
          instance: instanceName,
          data: {
            key: {
              remoteJid: `${registeredPhone}@s.whatsapp.net`,
              fromMe: false,
            },
            message: {
              conversation: '1',
            },
          },
        });

      expect(resDisabledRegistered.status).toBe(200);
      expect(resDisabledRegistered.body.status).toBe('processed');
      expect(resDisabledRegistered.body.new_status).toBe('CONFIRMED');
      expect(resDisabledRegistered.body.reply_sent).toBe(false);
      // Nenhuma réplica automática enviada
      expect(mockClient.sentMessages.length).toBe(0);

      // Cenário 3: Escopo DISABLED — Número desconhecido também é ignorado silenciosamente
      const resDisabledUnknown = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send({
          event: 'messages.upsert',
          instance: instanceName,
          data: {
            key: {
              remoteJid: `${unknownPhone}@s.whatsapp.net`,
              fromMe: false,
            },
            message: {
              conversation: 'Oi',
            },
          },
        });

      expect(resDisabledUnknown.status).toBe(200);
      expect(resDisabledUnknown.body.status).toBe('ignored_unknown_number');
      expect(mockClient.sentMessages.length).toBe(0);
    });

    it('AC-235: Acolhimento automático para não cadastrados no modo ALL com limpeza de {nome} e limite diário @spec:AC-235', async () => {
      // Configura modo ALL ("Todos os Contatos") com respostas ativas
      await repo.upsertSettings(tenantId, {
        auto_reply_scope: 'ALL',
        auto_reply_enabled: true,
        welcome_fallback_reply_template: '{Olá|Oi}, {nome}! Recebemos sua mensagem. Entraremos em contato em breve! 😊',
      });

      // 1. Mensagem de número desconhecido recebe réplica de acolhimento com limpeza de {nome}
      const resFirst = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send({
          event: 'messages.upsert',
          instance: instanceName,
          data: {
            key: {
              remoteJid: `${unknownPhone}@s.whatsapp.net`,
              fromMe: false,
              id: 'EVO-UNKNOWN-001',
            },
            message: {
              conversation: 'Olá! Gostaria de saber se vocês atendem convênio.',
            },
          },
        });

      expect(resFirst.status).toBe(200);
      expect(resFirst.body.status).toBe('processed');
      expect(resFirst.body.reply_sent).toBe(true);
      expect(resFirst.body.reply_suppressed_daily_limit).toBe(false);

      // Verifica envio da mensagem pelo Evolution Client
      expect(mockClient.sentMessages.length).toBe(1);
      const sentMsg = mockClient.sentMessages[0];
      expect(sentMsg.number).toBe(unknownPhone);
      // Verifica que a tag {nome} foi omitida e pontuação foi limpa (sem "Olá, !" ou "{nome}")
      expect(sentMsg.text).toMatch(/^(Olá|Oi)! Recebemos sua mensagem/);
      expect(sentMsg.text).not.toContain('{nome}');
      expect(sentMsg.text).not.toContain(', !');

      // Verifica auditoria em whatsapp_messages: patient_id = null e is_auto_reply = true
      const logs = await repo.listMessages(tenantId);
      const outboundLog = logs.find((l) => l.phone === unknownPhone && l.direction === 'OUTBOUND');
      expect(outboundLog).toBeDefined();
      expect(outboundLog?.patient_id).toBeNull();

      // Verifica que o número desconhecido NÃO foi adicionado à tabela de agendamentos (Central de Fila intacta)
      const appointments = await repo.findQueueAppointments(tenantId, {});
      expect(appointments.some((a) => a.phone === unknownPhone)).toBe(false);

      // 2. Limite diário: segunda mensagem do mesmo número desconhecido no mesmo dia civil deve ter resposta suprimida
      const resSecond = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send({
          event: 'messages.upsert',
          instance: instanceName,
          data: {
            key: {
              remoteJid: `${unknownPhone}@s.whatsapp.net`,
              fromMe: false,
              id: 'EVO-UNKNOWN-002',
            },
            message: {
              conversation: 'Vocês têm horário para hoje?',
            },
          },
        });

      expect(resSecond.status).toBe(200);
      expect(resSecond.body.status).toBe('processed');
      expect(resSecond.body.reply_sent).toBe(false);
      expect(resSecond.body.reply_suppressed_daily_limit).toBe(true);
      // Não enviou nova mensagem
      expect(mockClient.sentMessages.length).toBe(1);

      // 3. ASM-078: Contato desconhecido enviando "1" ou "2" sob o modo ALL nunca confirma agendamentos
      const otherUnknown = '5511777770003';
      const resChoice = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send({
          event: 'messages.upsert',
          instance: instanceName,
          data: {
            key: {
              remoteJid: `${otherUnknown}@s.whatsapp.net`,
              fromMe: false,
            },
            message: {
              conversation: '1',
            },
          },
        });

      expect(resChoice.status).toBe(200);
      expect(resChoice.body.reply_sent).toBe(true);
      expect(resChoice.body.appointment_id).toBeNull();
      // O agendamento do paciente cadastrado não foi afetado
      const patApp = await repo.findRelevantAppointmentForPatient(tenantId, patientId);
      expect(patApp.status).toBe('PENDING');
    });

    it('AC-236: Bloqueio estrito de resposta automática para grupos, listas de transmissão e status @spec:AC-236', async () => {
      // Mesmo com modo ALL ativado, grupos e transmissões devem ser rigorosamente bloqueados
      await repo.upsertSettings(tenantId, {
        auto_reply_scope: 'ALL',
        auto_reply_enabled: true,
      });

      // 1. Mensagem de grupo (@g.us)
      const resGroup = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send({
          event: 'messages.upsert',
          instance: instanceName,
          data: {
            key: {
              remoteJid: '120363023456789@g.us',
              fromMe: false,
              participant: '5511999990001@s.whatsapp.net',
            },
            message: {
              conversation: 'Olá grupo de dentistas!',
            },
          },
        });

      expect(resGroup.status).toBe(200);
      expect(resGroup.body.status).toBe('ignored_group_or_broadcast');
      expect(mockClient.sentMessages.length).toBe(0);

      // 2. Mensagem de status ou broadcast (@broadcast)
      const resBroadcast = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send({
          event: 'messages.upsert',
          instance: instanceName,
          data: {
            key: {
              remoteJid: 'status@broadcast',
              fromMe: false,
            },
            message: {
              conversation: 'Status atualizado',
            },
          },
        });

      expect(resBroadcast.status).toBe(200);
      expect(resBroadcast.body.status).toBe('ignored_group_or_broadcast');
      expect(mockClient.sentMessages.length).toBe(0);

      // 3. Mensagem de canal/newsletter (@newsletter)
      const resNewsletter = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send({
          event: 'messages.upsert',
          instance: instanceName,
          data: {
            key: {
              remoteJid: '120363987654321@newsletter',
              fromMe: false,
            },
            message: {
              conversation: 'Novidade no canal!',
            },
          },
        });

      expect(resNewsletter.status).toBe(200);
      expect(resNewsletter.body.status).toBe('ignored_group_or_broadcast');
      expect(mockClient.sentMessages.length).toBe(0);
    });

    it('Validação unitária da interpolação Spintax com limpeza de {nome} e pontuação', () => {
      const template = '{Olá|Oi}, {nome}! Recebemos sua mensagem. Entraremos em contato.';

      // Sem nome informado
      const textWithoutName = processSpintax(template, { nome: '' });
      expect(textWithoutName).toMatch(/^(Olá|Oi)! Recebemos sua mensagem/);
      expect(textWithoutName).not.toContain('{nome}');
      expect(textWithoutName).not.toContain(', !');

      // Com nome informado
      const textWithName = processSpintax(template, { nome: 'Beatriz' });
      expect(textWithName).toMatch(/^(Olá|Oi), Beatriz! Recebemos sua mensagem/);
    });
  });
});
