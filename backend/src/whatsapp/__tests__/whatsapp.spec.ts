import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { parsePatientMessage, resolveStatusTransition } from '../parser.js';
import { processSpintax, generateSpintaxVariations } from '../spintax.js';
import { sendWithRetry } from '../evolution-client.js';
import { MockEvolutionClient } from './mock-evolution.js';
import { InMemoryConfirmationQueue, setConfirmationQueue } from '../queue.js';
import { scheduleConfirmationBatch, type AppointmentConfirmationCandidate } from '../scheduler.js';
import { createApp } from '../../app.js';
import { createInMemoryDatabase, setDatabase, type IDatabase } from '../../db/connection.js';

describe('Motor WhatsApp, BullMQ e Webhook Evolution API — OdontoFlow', () => {
  let db: IDatabase;
  let testApp: Express;
  let queue: InMemoryConfirmationQueue;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const instanceName = 'consultorio_dr_a';

  beforeEach(async () => {
    db = createInMemoryDatabase();
    setDatabase(db);
    queue = new InMemoryConfirmationQueue();
    setConfirmationQueue(queue);
    testApp = createApp();

    await db.query(
      `INSERT INTO tenants (id, name, whatsapp_instance_name, whatsapp_connected) VALUES ($1, $2, $3, $4)`,
      [tenantId, 'Consultório Dr. A', instanceName, true]
    );
  });

  describe('US-011 — Parser Inteligente de Mensagens e Ciclo de Confirmação', () => {
    it('AC-019: Classificação semântica de confirmação, reagendamento e dúvidas @spec:AC-019', () => {
      // 1. Casos canônicos de Confirmação
      const confirmationInputs = ['1', '1.', 'Sim', 'sim', 'confirmado', 'CONFIRMO', '👍', 'ok', 'certo, estarei lá'];
      for (const text of confirmationInputs) {
        const res = parsePatientMessage(text);
        expect(res.classification).toBe('CONFIRMED');
        expect(res.isAudioOrMedia).toBe(false);
      }

      // 2. Casos canônicos de Remarcação
      const rescheduleInputs = ['2', '2 - remarcar', 'não posso', 'nao poderei ir', 'preciso remarcar', 'cancelar consulta', 'trocar de dia'];
      for (const text of rescheduleInputs) {
        const res = parsePatientMessage(text);
        expect(res.classification).toBe('RESCHEDULE_REQUESTED');
        expect(res.isAudioOrMedia).toBe(false);
      }

      // 3. Dúvidas abertas em texto livre -> MESSAGE_RECEIVED para atenção humana
      const openQuestionInputs = [
        'posso chegar 10 minutos atrasado?',
        'qual é o endereço do consultório?',
        'tem estacionamento no prédio?',
      ];
      for (const text of openQuestionInputs) {
        const res = parsePatientMessage(text);
        expect(res.classification).toBe('MESSAGE_RECEIVED');
        expect(res.isAudioOrMedia).toBe(false);
      }

      // 4. Mensagens de Áudio ou Mídia -> MESSAGE_RECEIVED com flag isAudioOrMedia
      const audioInput = {
        messageType: 'audio' as const,
        mediaUrl: 'https://evolution.api/media/audio123.ogg',
      };
      const audioRes = parsePatientMessage(audioInput);
      expect(audioRes.classification).toBe('MESSAGE_RECEIVED');
      expect(audioRes.isAudioOrMedia).toBe(true);
    });

    it('AC-020: Transição de status quando paciente muda de ideia @spec:AC-020', () => {
      // 1. Paciente confirma a consulta inicialmente a partir de PENDING
      const firstTransition = resolveStatusTransition('PENDING', 'CONFIRMED');
      expect(firstTransition.newStatus).toBe('CONFIRMED');
      expect(firstTransition.changedMind).toBe(false);

      // 2. Paciente muda de ideia mais tarde e envia mensagem solicitando reagendamento
      const secondTransition = resolveStatusTransition('CONFIRMED', 'RESCHEDULE_REQUESTED');
      expect(secondTransition.newStatus).toBe('RESCHEDULE_REQUESTED');
      expect(secondTransition.changedMind).toBe(true);
      expect(secondTransition.requiresAttention).toBe(true);
      expect(secondTransition.reason).toContain('Paciente havia confirmado anteriormente');

      // 3. Consultas já COMPLETED ou CANCELLED não devem sofrer transição reversa
      const completedTransition = resolveStatusTransition('COMPLETED', 'RESCHEDULE_REQUESTED');
      expect(completedTransition.newStatus).toBe('COMPLETED');
      expect(completedTransition.changedMind).toBe(false);
      expect(completedTransition.requiresAttention).toBe(true);
    });
  });

  describe('US-012 — Gerador Spintax Anti-Ban e Variação Textual', () => {
    it('AC-021: Variação textual dinâmica entre disparos consecutivos @spec:AC-021', () => {
      const template = '{Olá|Oi|Bom dia} {nome}, {confirmamos|lembramos da} sua consulta amanhã às {hora}?';
      const variables = { nome: 'Dra. Ana', hora: '15:00' };

      // Gera 10 variações consecutivas
      const variations = generateSpintaxVariations(template, 10, variables);

      // Todas devem ter interpolado as variáveis
      for (const msg of variations) {
        expect(msg).toContain('Dra. Ana');
        expect(msg).toContain('15:00');
        expect(msg).not.toContain('{');
        expect(msg).not.toContain('}');
      }

      // Deve existir diversidade nas mensagens (não podem ser todas idênticas)
      const uniqueVariations = new Set(variations);
      expect(uniqueVariations.size).toBeGreaterThan(1);
    });
  });

  describe('US-013 — Enfileiramento com Jitter Humanizado e Salvaguardas de Horário', () => {
    it('AC-022: Intervalo de jitter humanizado entre 20 e 50 segundos e salvaguarda temporal @spec:AC-022', async () => {
      const queue = new InMemoryConfirmationQueue();
      const referenceDate = new Date('2026-10-20T09:00:00.000Z');

      // 1. Cria lista com 10 agendamentos para o dia seguinte (2026-10-21)
      const nextDayCandidates: AppointmentConfirmationCandidate[] = Array.from({ length: 10 }).map((_, i) => ({
        appointmentId: `app-${i + 1}`,
        tenantId: 'tenant-1',
        instanceName: 'inst-1',
        phone: `551199999000${i}`,
        patientName: `Paciente ${i + 1}`,
        appointmentStartTime: '2026-10-21T10:00:00.000Z',
      }));

      // Adiciona 1 agendamento para o MESMO dia de hoje (2026-10-20)
      const sameDayCandidate: AppointmentConfirmationCandidate = {
        appointmentId: 'app-same-day',
        tenantId: 'tenant-1',
        instanceName: 'inst-1',
        phone: '5511988880000',
        patientName: 'Paciente Mesmo Dia',
        appointmentStartTime: '2026-10-20T16:00:00.000Z',
      };

      const candidates = [...nextDayCandidates, sameDayCandidate];

      // 2. Executa o agendamento em lote
      const result = await scheduleConfirmationBatch(candidates, queue, {
        referenceDate,
        minJitterSec: 20,
        maxJitterSec: 50,
      });

      // Salvaguarda temporal: O agendamento de hoje DEVE ser ignorado
      expect(result.skippedSameDayCount).toBe(1);
      expect(result.skippedSameDayAppointments).toContain('app-same-day');
      expect(result.scheduledCount).toBe(10);

      // 3. Validação do Jitter Humanizado: intervalo entre cada job consecutivo deve ser entre 20s e 50s
      expect(result.enqueuedJobs).toHaveLength(10);
      expect(result.enqueuedJobs[0].delayMs).toBe(0);

      for (let i = 1; i < result.enqueuedJobs.length; i++) {
        const intervalMs = result.enqueuedJobs[i].delayMs - result.enqueuedJobs[i - 1].delayMs;
        expect(intervalMs).toBeGreaterThanOrEqual(20 * 1000);
        expect(intervalMs).toBeLessThanOrEqual(50 * 1000);
      }
    });

    it('AC-023: Retry exponencial em caso de instabilidade na Evolution API @spec:AC-023', async () => {
      const mockClient = new MockEvolutionClient();

      // 1. Simula 2 falhas consecutivas de instabilidade transitória (HTTP 502 Bad Gateway)
      mockClient.simulateTransientFailures(2, 502);

      const messageOptions = {
        instanceName: 'consultorio_dr_a',
        number: '5511999991111',
        text: 'Olá, confirmamos sua consulta amanhã?',
      };

      // 2. Executa envio com retry e backoff exponencial (3 tentativas permitidas)
      const res = await sendWithRetry(mockClient, messageOptions, 3, 5);

      // Deve ter tentado 3 vezes no total (2 falhas transitórias + 1 sucesso)
      expect(mockClient.totalAttempts).toBe(3);
      expect(res.status).toBe('SENT');
      expect(mockClient.sentMessages).toHaveLength(1);
      expect(mockClient.sentMessages[0].text).toContain('Olá, confirmamos');

      // 3. Garante que se ultrapassar o número máximo de tentativas em erro 503, lança EvolutionTransientError
      mockClient.simulateTransientFailures(5, 503);
      await expect(
        sendWithRetry(mockClient, messageOptions, 2, 5)
      ).rejects.toThrow('Erro simulado transitório HTTP 503');
    });
  });

  describe('US-014 — Webhook da Evolution API e Gerenciamento de Sessão', () => {
    it('AC-024: Atualização do agendamento a partir do webhook da Evolution API @spec:AC-024', async () => {
      const patientId = '22222222-2222-2222-2222-222222222222';
      const appointmentId = '33333333-3333-3333-3333-333333333333';
      const patientPhone = '5511999991111';

      // 1. Cria paciente e agendamento PENDING no banco
      await db.query(
        `INSERT INTO patients (id, tenant_id, name, whatsapp) VALUES ($1, $2, $3, $4)`,
        [patientId, tenantId, 'Paciente Webhook', patientPhone]
      );

      await db.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, start_time, end_time, status)
         VALUES ($1, $2, $3, '2026-10-25 10:00:00+00', '2026-10-25 10:30:00+00', 'PENDING')`,
        [appointmentId, tenantId, patientId]
      );

      // 2. Simula payload de mensagem da Evolution API ("1" para confirmar)
      const webhookPayload = {
        event: 'messages.upsert',
        instance: instanceName,
        data: {
          key: {
            remoteJid: `${patientPhone}@s.whatsapp.net`,
            fromMe: false,
          },
          message: {
            conversation: '1',
          },
        },
      };

      const res = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('processed');
      expect(res.body.new_status).toBe('CONFIRMED');

      // 3. Verifica atualização direta no banco de dados
      const appCheck = await db.query(
        `SELECT status FROM appointments WHERE id = $1`,
        [appointmentId]
      );
      expect(appCheck.rows[0].status).toBe('CONFIRMED');
    });

    it('AC-025: Tratamento silencioso e seguro para mensagens de números desconhecidos @spec:AC-025', async () => {
      const unknownPhone = '5511977779999';

      const webhookPayload = {
        event: 'messages.upsert',
        instance: instanceName,
        data: {
          key: {
            remoteJid: `${unknownPhone}@s.whatsapp.net`,
            fromMe: false,
          },
          message: {
            conversation: 'Boa tarde, qual o valor da consulta?',
          },
        },
      };

      const res = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send(webhookPayload);

      // Deve responder 200 OK sem falha e ignorar de forma limpa
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ignored_unknown_number');
    });

    it('AC-026: Pausa e retomada inteligente de fila em desconexão com salvaguarda de expiração @spec:AC-026', async () => {
      // 1. Simula desconexão da instância WhatsApp (CONNECTION_LOST)
      const disconnectPayload = {
        event: 'connection.update',
        instance: instanceName,
        data: {
          state: 'close',
          statusReason: 'CONNECTION_LOST',
        },
      };

      const resDisconnect = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send(disconnectPayload);

      expect(resDisconnect.status).toBe(200);
      expect(resDisconnect.body.queue_paused).toBe(true);

      // Checa se fila foi pausada
      expect(await queue.isPaused()).toBe(true);

      // Checa se tenant foi marcado como desconectado
      const tenantCheck = await db.query(
        `SELECT whatsapp_connected FROM tenants WHERE id = $1`,
        [tenantId]
      );
      expect(tenantCheck.rows[0].whatsapp_connected).toBe(false);

      // 2. Simula reconexão (CONNECTION_ESTABLISHED)
      const reconnectPayload = {
        event: 'connection.update',
        instance: instanceName,
        data: {
          state: 'open',
          statusReason: 'CONNECTION_ESTABLISHED',
        },
      };

      const resReconnect = await request(testApp)
        .post('/api/webhooks/whatsapp')
        .send(reconnectPayload);

      expect(resReconnect.status).toBe(200);
      expect(resReconnect.body.whatsapp_connected).toBe(true);

      // Checa se tenant foi atualizado para conectado
      const tenantCheck2 = await db.query(
        `SELECT whatsapp_connected FROM tenants WHERE id = $1`,
        [tenantId]
      );
      expect(tenantCheck2.rows[0].whatsapp_connected).toBe(true);
    });
  });
});
