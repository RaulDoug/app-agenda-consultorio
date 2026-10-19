/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppointmentCard } from '../components/AppointmentCard';
import { AppointmentDetailsDrawer } from '../components/AppointmentDetailsDrawer';
import { LocalAppointmentWithDetails } from '../types';

describe('Feature: Visualização Compacta de Procedimentos no Card da Agenda', () => {
  const mockProcedures = [
    { id: 'proc-1', tenant_id: 't-1', name: 'Limpeza Dental', default_duration_minutes: 30, default_price_cents: 12000, is_active: true, created_at: '', updated_at: '' },
    { id: 'proc-2', tenant_id: 't-1', name: 'Aplicação de Flúor', default_duration_minutes: 20, default_price_cents: 8000, is_active: true, created_at: '', updated_at: '' },
    { id: 'proc-3', tenant_id: 't-1', name: 'Restauração em Resina', default_duration_minutes: 40, default_price_cents: 20000, is_active: true, created_at: '', updated_at: '' },
    { id: 'proc-4', tenant_id: 't-1', name: 'Clareamento Dental', default_duration_minutes: 60, default_price_cents: 45000, is_active: true, created_at: '', updated_at: '' },
  ];

  const appointmentWith4Procedures: LocalAppointmentWithDetails = {
    id: 'app-multi-proc-1',
    tenant_id: 't-1',
    patient_id: 'p-1',
    patient_name: 'Mariana Silva',
    start_time: '2026-10-19T14:00:00.000Z',
    end_time: '2026-10-19T16:30:00.000Z',
    status: 'CONFIRMED',
    is_extra_fit: false,
    procedures: mockProcedures,
  };

  describe('US-058 — Visualização Compacta e Empilhada de Procedimentos no Card da Agenda', () => {
    it('AC-096: Renderização vertical limitada a no máximo 2 procedimentos com reticências no card fechado @spec:AC-096', () => {
      render(
        <AppointmentCard
          appointment={appointmentWith4Procedures}
          onClick={vi.fn()}
        />
      );

      // 1. Os 2 primeiros procedimentos devem estar visíveis
      expect(screen.getByText('Limpeza Dental')).toBeDefined();
      expect(screen.getByText('Aplicação de Flúor')).toBeDefined();

      // 2. Os procedimentos 3 e 4 NÃO devem aparecer no card fechado
      expect(screen.queryByText('Restauração em Resina')).toBeNull();
      expect(screen.queryByText('Clareamento Dental')).toBeNull();

      // 3. Indicador de reticências/excedente deve estar visível
      const moreIndicator = screen.getByText(/(\.\.\.|\+2 mais)/i);
      expect(moreIndicator).toBeDefined();

      // 4. Cada procedimento renderizado em linha individual (não concatenados por vírgula em string corrida)
      const listContainer = screen.getByTestId('card-procedures-list');
      expect(listContainer).toBeDefined();
      expect(listContainer.children.length).toBeGreaterThanOrEqual(2);
    });

    it('AC-097: Exibição completa de todos os procedimentos na abertura da gaveta de detalhes @spec:AC-097', () => {
      render(
        <AppointmentDetailsDrawer
          isOpen={true}
          appointment={appointmentWith4Procedures}
          onClose={vi.fn()}
          onStatusChanged={vi.fn()}
          onOpenReschedule={vi.fn()}
        />
      );

      // Todos os 4 procedimentos devem estar integralmente visíveis na gaveta aberta
      expect(screen.getByText('Limpeza Dental')).toBeDefined();
      expect(screen.getByText('Aplicação de Flúor')).toBeDefined();
      expect(screen.getByText('Restauração em Resina')).toBeDefined();
      expect(screen.getByText('Clareamento Dental')).toBeDefined();
    });
  });
});
