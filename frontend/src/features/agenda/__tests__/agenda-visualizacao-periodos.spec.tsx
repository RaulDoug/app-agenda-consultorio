/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  formatAgendaPeriod,
  getAgendaPeriodRange,
  countAppointmentsInPeriod,
  formatAppointmentsCount,
} from '../utils/date-formatters';
import { ViewModeSelector } from '../components/ViewModeSelector';

describe('Feature: agenda-visualizacao-periodos', () => {
  describe('US-118 — Visualização Dinâmica de Período e Resumo de Atendimentos na Agenda', () => {
    // AC-204
    it('AC-204: Formatação Dinâmica de Período no Cabeçalho da Agenda (Dia, Semana, Mês) @spec:AC-204', () => {
      // 1. Modo Dia: "Ter., 27 de out. de 2026"
      const dateTuesday = new Date(2026, 9, 27, 10, 0, 0); // 27 de Outubro de 2026 (Terça-feira)
      const dayFormatted = formatAgendaPeriod(dateTuesday, 'day');
      expect(dayFormatted).toMatch(/Ter\..*27.*out.*2026/i);
      // Garante que preposições não estão com maiúscula indevida
      expect(dayFormatted).toContain('de');
      expect(dayFormatted).not.toContain('De');

      // 2. Modo Semana:
      // Caso A: Mesma semana dentro do mesmo mês (ex: 21 de Outubro -> seg 19 a dom 25)
      const dateMidMonth = new Date(2026, 9, 21, 14, 0, 0);
      const weekSameMonth = formatAgendaPeriod(dateMidMonth, 'week');
      expect(weekSameMonth).toBe('19 \u2013 25 de out. de 2026');

      // Caso B: Semana que cruza a virada do mês (ex: 27 de Outubro -> seg 26/10 a dom 01/11)
      const weekCrossMonth = formatAgendaPeriod(dateTuesday, 'week');
      expect(weekCrossMonth).toBe('26 de out. \u2013 01 de nov. de 2026');

      // Caso C: Semana na virada do ano (ex: 30 de Dezembro de 2026 -> seg 28/12/2026 a dom 03/01/2027)
      const dateYearEnd = new Date(2026, 11, 30, 10, 0, 0);
      const weekCrossYear = formatAgendaPeriod(dateYearEnd, 'week');
      expect(weekCrossYear).toBe('28 de dez. de 2026 \u2013 03 de jan. de 2027');

      // 3. Modo Mês: "Outubro de 2026"
      const monthFormatted = formatAgendaPeriod(dateTuesday, 'month');
      expect(monthFormatted).toBe('Outubro de 2026');

      // 4. Renderização do ViewModeSelector exibindo o período correto
      const { rerender } = render(
        <ViewModeSelector
          currentDate={dateTuesday}
          viewMode="day"
          onViewModeChange={vi.fn()}
          onPrevDate={vi.fn()}
          onNextDate={vi.fn()}
          onToday={vi.fn()}
        />
      );

      expect(screen.getByTestId('agenda-period-label').textContent).toContain('27');

      rerender(
        <ViewModeSelector
          currentDate={dateTuesday}
          viewMode="week"
          onViewModeChange={vi.fn()}
          onPrevDate={vi.fn()}
          onNextDate={vi.fn()}
          onToday={vi.fn()}
        />
      );
      expect(screen.getByTestId('agenda-period-label').textContent).toBe('26 de out. \u2013 01 de nov. de 2026');

      rerender(
        <ViewModeSelector
          currentDate={dateTuesday}
          viewMode="month"
          onViewModeChange={vi.fn()}
          onPrevDate={vi.fn()}
          onNextDate={vi.fn()}
          onToday={vi.fn()}
        />
      );
      expect(screen.getByTestId('agenda-period-label').textContent).toBe('Outubro de 2026');
    });

    // AC-205
    it('AC-205: Contador Reativo de Atendimentos por Período Visualizado e Limpeza do Botão de Agendamento @spec:AC-205', () => {
      const baseDate = new Date(2026, 9, 27, 10, 0, 0); // Terça, 27/10/2026

      const mockAppointments = [
        // Atendimento no dia 27/10 (ativo)
        {
          id: 'app-1',
          start_time: new Date(2026, 9, 27, 9, 0, 0).toISOString(),
          status: 'CONFIRMED',
        },
        // Atendimento no dia 27/10 (cancelado - NÃO deve contar)
        {
          id: 'app-2',
          start_time: new Date(2026, 9, 27, 11, 0, 0).toISOString(),
          status: 'CANCELLED',
        },
        // Atendimento no dia 29/10 (mesma semana, ativo)
        {
          id: 'app-3',
          start_time: new Date(2026, 9, 29, 14, 0, 0).toISOString(),
          status: 'PENDING',
        },
        // Atendimento no dia 31/10 (mesma semana e mesmo mês, ativo)
        {
          id: 'app-4',
          start_time: new Date(2026, 9, 31, 16, 0, 0).toISOString(),
          status: 'CONFIRMED',
        },
        // Atendimento em outro mês (05/11/2026, fora da semana de 26/10 a 01/11)
        {
          id: 'app-5',
          start_time: new Date(2026, 10, 5, 10, 0, 0).toISOString(),
          status: 'CONFIRMED',
        },
      ];

      // 1. Contagem no modo Dia (apenas 27/10 ativo = 1)
      const dayRange = getAgendaPeriodRange(baseDate, 'day');
      const dayCount = countAppointmentsInPeriod(mockAppointments, dayRange);
      expect(dayCount).toBe(1);
      expect(formatAppointmentsCount(dayCount)).toBe('1 atendimento');

      // 2. Contagem no modo Semana (semana 26/10 a 01/11: app-1, app-3, app-4 = 3)
      const weekRange = getAgendaPeriodRange(baseDate, 'week');
      const weekCount = countAppointmentsInPeriod(mockAppointments, weekRange);
      expect(weekCount).toBe(3);
      expect(formatAppointmentsCount(weekCount)).toBe('3 atendimentos');

      // 3. Contagem no modo Mês (Outubro/2026: app-1, app-3, app-4 = 3)
      const monthRange = getAgendaPeriodRange(baseDate, 'month');
      const monthCount = countAppointmentsInPeriod(mockAppointments, monthRange);
      expect(monthCount).toBe(3);

      // 4. Teste de zero atendimentos
      const emptyCount = countAppointmentsInPeriod([], dayRange);
      expect(formatAppointmentsCount(emptyCount)).toBe('Nenhum atendimento');

      // 5. Renderização do contador no ViewModeSelector
      const { rerender } = render(
        <ViewModeSelector
          currentDate={baseDate}
          viewMode="day"
          onViewModeChange={vi.fn()}
          onPrevDate={vi.fn()}
          onNextDate={vi.fn()}
          onToday={vi.fn()}
          appointmentsCount={dayCount}
        />
      );

      const countBadge = screen.getByTestId('agenda-appointments-count');
      expect(countBadge.textContent).toBe('1 atendimento');

      // Atualiza para semana com 3 atendimentos
      rerender(
        <ViewModeSelector
          currentDate={baseDate}
          viewMode="week"
          onViewModeChange={vi.fn()}
          onPrevDate={vi.fn()}
          onNextDate={vi.fn()}
          onToday={vi.fn()}
          appointmentsCount={weekCount}
        />
      );
      expect(screen.getByTestId('agenda-appointments-count').textContent).toBe('3 atendimentos');

      // Atualiza para contagem vazia
      rerender(
        <ViewModeSelector
          currentDate={baseDate}
          viewMode="day"
          onViewModeChange={vi.fn()}
          onPrevDate={vi.fn()}
          onNextDate={vi.fn()}
          onToday={vi.fn()}
          appointmentsCount={0}
        />
      );
      expect(screen.getByTestId('agenda-appointments-count').textContent).toBe('Nenhum atendimento');
    });

    // AC-206
    it('AC-206: Disposição Vertical em Coluna e Botão de Retorno Contextual ("Hoje", "Esta semana", "Este mês") @spec:AC-206', () => {
      const baseDate = new Date(2026, 9, 27, 10, 0, 0);

      // 1. No modo Dia: botão exibe "Hoje"
      const { rerender } = render(
        <ViewModeSelector
          currentDate={baseDate}
          viewMode="day"
          onViewModeChange={vi.fn()}
          onPrevDate={vi.fn()}
          onNextDate={vi.fn()}
          onToday={vi.fn()}
          appointmentsCount={5}
        />
      );

      const todayBtn = screen.getByTestId('btn-today-range');
      expect(todayBtn.textContent).toBe('Hoje');

      // 2. No modo Semana: botão exibe "Esta semana"
      rerender(
        <ViewModeSelector
          currentDate={baseDate}
          viewMode="week"
          onViewModeChange={vi.fn()}
          onPrevDate={vi.fn()}
          onNextDate={vi.fn()}
          onToday={vi.fn()}
          appointmentsCount={12}
        />
      );
      expect(screen.getByTestId('btn-today-range').textContent).toBe('Esta semana');

      // 3. No modo Mês: botão exibe "Este mês"
      rerender(
        <ViewModeSelector
          currentDate={baseDate}
          viewMode="month"
          onViewModeChange={vi.fn()}
          onPrevDate={vi.fn()}
          onNextDate={vi.fn()}
          onToday={vi.fn()}
          appointmentsCount={30}
        />
      );
      expect(screen.getByTestId('btn-today-range').textContent).toBe('Este mês');

      // 4. Validação da estrutura em coluna: todos os elementos essenciais presentes
      expect(screen.getByRole('button', { name: 'Data anterior' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Próxima data' })).toBeDefined();
      expect(screen.getByTestId('agenda-period-label')).toBeDefined();
      expect(screen.getByTestId('agenda-appointments-count')).toBeDefined();
      expect(screen.getByRole('button', { name: 'Dia' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Semana' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Mês' })).toBeDefined();
    });
  });
});
