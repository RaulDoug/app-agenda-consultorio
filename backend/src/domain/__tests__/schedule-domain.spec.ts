import { describe, it, expect } from 'vitest';
import { calculateAppointmentDuration, validateProcedureDuration } from '../duration.js';
import { normalizeBrazilianPhone } from '../phone.js';
import { validateBusinessHours } from '../business-hours.js';
import type { BusinessHours } from '@odontoflow/shared';

describe('Domínio de Agendamento — OdontoFlow', () => {
  describe('US-001 — Cálculo Dinâmico de Duração por Procedimentos', () => {
    it('AC-001: Soma de durações determina o horário final @spec:AC-001', () => {
      const startTime = '2026-10-20T09:00:00.000Z';
      const durations = [30, 45]; // Limpeza (30m) + Restauração (45m) = 75m

      const result = calculateAppointmentDuration(startTime, durations);

      expect(result.totalDurationMinutes).toBe(75);
      expect(result.startTime.toISOString()).toBe('2026-10-20T09:00:00.000Z');
      expect(result.endTime.toISOString()).toBe('2026-10-20T10:15:00.000Z');
    });

    it('AC-002: Rejeição de procedimentos com duração inválida @spec:AC-002', () => {
      const startTime = '2026-10-20T09:00:00.000Z';

      expect(() => calculateAppointmentDuration(startTime, [0])).toThrow(/Duração inválida do procedimento/);
      expect(() => calculateAppointmentDuration(startTime, [-15])).toThrow(/Duração inválida do procedimento/);

      const valZero = validateProcedureDuration(0);
      expect(valZero.isValid).toBe(false);
      expect(valZero.error).toBeDefined();

      const valNeg = validateProcedureDuration(-30);
      expect(valNeg.isValid).toBe(false);
    });
  });

  describe('US-002 — Normalização Canônica de Telefones WhatsApp', () => {
    it('AC-003: Sanitização e formatação canônica de celular brasileiro @spec:AC-003', () => {
      const inputs = [
        '(11) 99999-8888',
        '+55 11 99999-8888',
        '11999998888',
        '5511999998888',
        '  (11)  99999 - 8888  ',
      ];

      for (const input of inputs) {
        const result = normalizeBrazilianPhone(input);
        expect(result.isValid).toBe(true);
        expect(result.normalized).toBe('5511999998888');
      }
    });

    it('AC-004: Rejeição de telefones inválidos @spec:AC-004', () => {
      const invalidInputs = [
        '',
        '12345',
        '00999998888',     // DDD 00 inválido
        '11888888888',     // não começa com 9
        '119999998888888', // dígitos excessivos
      ];

      for (const input of invalidInputs) {
        const result = normalizeBrazilianPhone(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.normalized).toBeUndefined();
      }
    });
  });

  describe('US-003 — Validação de Expediente e Encaixe com Soft-Warning', () => {
    const regularBusinessHours: BusinessHours[] = [
      {
        id: 'bh-1',
        tenant_id: 'tenant-1',
        day_of_week: 2, // Terça-feira (2026-10-20 é terça)
        is_open: true,
        start_time: '08:00',
        end_time: '18:00',
        break_start_time: '12:00',
        break_end_time: '13:00',
      },
    ];

    it('AC-005: Alerta de agendamento fora do expediente regular @spec:AC-005', () => {
      // 1. Horário durante o almoço (12:30 às 13:30) sem confirm_overtime
      const lunchTimeStart = new Date(2026, 9, 20, 12, 30);
      const lunchTimeEnd = new Date(2026, 9, 20, 13, 15);

      const lunchResult = validateBusinessHours(lunchTimeStart, lunchTimeEnd, regularBusinessHours);
      expect(lunchResult.allowed).toBe(false);
      expect(lunchResult.outside_business_hours).toBe(true);
      expect(lunchResult.is_overtime).toBe(false);
      expect(lunchResult.warning).toBeDefined();

      // 2. Horário após o término do expediente (18:30 às 19:15) sem confirm_overtime
      const overtimeStart = new Date(2026, 9, 20, 18, 30);
      const overtimeEnd = new Date(2026, 9, 20, 19, 15);

      const overtimeResult = validateBusinessHours(overtimeStart, overtimeEnd, regularBusinessHours);
      expect(overtimeResult.allowed).toBe(false);
      expect(overtimeResult.outside_business_hours).toBe(true);
      expect(overtimeResult.is_overtime).toBe(false);
      expect(overtimeResult.warning).toBeDefined();

      // 3. Horário regular válido (10:00 às 11:00) deve passar sem alerta
      const regularStart = new Date(2026, 9, 20, 10, 0);
      const regularEnd = new Date(2026, 9, 20, 11, 0);

      const regularResult = validateBusinessHours(regularStart, regularEnd, regularBusinessHours);
      expect(regularResult.allowed).toBe(true);
      expect(regularResult.outside_business_hours).toBe(false);
      expect(regularResult.is_overtime).toBe(false);
    });

    it('AC-006: Confirmação de encaixe extraordinário marca flag no agendamento @spec:AC-006', () => {
      const overtimeStart = new Date(2026, 9, 20, 18, 30);
      const overtimeEnd = new Date(2026, 9, 20, 19, 15);

      const result = validateBusinessHours(overtimeStart, overtimeEnd, regularBusinessHours, {
        confirm_overtime: true,
      });

      expect(result.allowed).toBe(true);
      expect(result.outside_business_hours).toBe(true);
      expect(result.is_overtime).toBe(true);
      expect(result.warning).toContain('encaixe extraordinário');
    });
  });

  describe('US-004 — Sugestão Inteligente de 3 Horários Vagos no Retorno', () => {
    it('AC-007: Sugestão de 3 slots vagos mais próximos em caso de conflito @spec:AC-007', () => {
      throw new Error('AC-007 pendente de implementação (T-005)');
    });
  });

  describe('US-005 — Máquina de Estados e Imutabilidade de Agendamento', () => {
    it('AC-008: Validação de transições de status permitidas @spec:AC-008', () => {
      throw new Error('AC-008 pendente de implementação (T-006)');
    });

    it('AC-009: Imutabilidade de consultas concluídas ou canceladas @spec:AC-009', () => {
      throw new Error('AC-009 pendente de implementação (T-006)');
    });
  });

  describe('US-006 — Consistência de Fuso Horário UTC-3', () => {
    it('AC-010: Preservação da data civil no fuso America/Sao_Paulo @spec:AC-010', () => {
      throw new Error('AC-010 pendente de implementação (T-007)');
    });
  });
});
