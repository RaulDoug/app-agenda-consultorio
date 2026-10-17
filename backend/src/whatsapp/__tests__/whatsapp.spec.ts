import { describe, it, expect, beforeEach } from 'vitest';
import { parsePatientMessage, resolveStatusTransition } from '../parser.js';
import { processSpintax, generateSpintaxVariations } from '../spintax.js';
import { sendWithRetry } from '../evolution-client.js';
import { MockEvolutionClient } from './mock-evolution.js';

describe('Motor WhatsApp, BullMQ e Webhook Evolution API — OdontoFlow', () => {
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
    it('AC-022: Intervalo de jitter humanizado entre 20 e 50 segundos e salvaguarda temporal @spec:AC-022', () => {
      throw new Error('critério de aceite AC-022 ainda não provado — implemente este teste (T-015)');
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
    it('AC-024: Atualização do agendamento a partir do webhook da Evolution API @spec:AC-024', () => {
      throw new Error('critério de aceite AC-024 ainda não provado — implemente este teste (T-016)');
    });

    it('AC-025: Tratamento silencioso e seguro para mensagens de números desconhecidos @spec:AC-025', () => {
      throw new Error('critério de aceite AC-025 ainda não provado — implemente este teste (T-016)');
    });

    it('AC-026: Pausa e retomada inteligente de fila em desconexão com salvaguarda de expiração @spec:AC-026', () => {
      throw new Error('critério de aceite AC-026 ainda não provado — implemente este teste (T-016)');
    });
  });
});
