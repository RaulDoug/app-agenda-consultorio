/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScheduleGrid } from '../components/ScheduleGrid';
import { LocalAppointmentWithDetails, DEFAULT_BUSINESS_HOURS } from '../types';

describe('ScheduleGrid — Encaixes Fora de Expediente', () => {
  const baseDate = new Date(2026, 9, 26, 10, 0, 0);
  const appStart = new Date(2026, 9, 26, 19, 30, 0);
  const appEnd = new Date(2026, 9, 26, 20, 0, 0);

  it('AC-198: Renderização visível de agendamentos de encaixe fora do expediente na grade diária @spec:AC-198', () => {
    // Clínica configurada das 08:00 às 17:00
    const businessHours = {
      ...DEFAULT_BUSINESS_HOURS,
      startHour: 8,
      endHour: 17,
      lunchStartHour: 12,
      lunchEndHour: 13,
      slotDurationMinutes: 30,
    };

    // Agendamento de encaixe às 19:30 (fora do expediente das 17h)
    const outOfHoursAppointment: LocalAppointmentWithDetails = {
      id: 'app-extra-1',
      tenant_id: 'tenant-1',
      patient_id: 'pat-1',
      patient_name: 'Carlos Encaixe Noturno',
      patient_whatsapp: '11988887777',
      start_time: appStart.toISOString(),
      end_time: appEnd.toISOString(),
      status: 'CONFIRMED',
      is_extra_fit: true,
      items: [
        {
          id: 'item-1',
          appointment_id: 'app-extra-1',
          procedure_id: 'proc-1',
          procedure_name: 'Consulta de Emergência',
          effective_price_cents: 25000,
          duration_minutes: 30,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    render(
      <ScheduleGrid
        currentDate={baseDate}
        viewMode="day"
        appointments={[outOfHoursAppointment]}
        businessHours={businessHours}
      />
    );

    // O slot de 19:30 deve ser renderizado e identificado como horário extra
    const extraSlot = screen.getByTestId('out-of-hours-slot-19:30');
    expect(extraSlot).toBeInTheDocument();
    expect(screen.getByText('Carlos Encaixe Noturno')).toBeInTheDocument();
    expect(screen.getByText('Extra')).toBeInTheDocument();
  });
});

