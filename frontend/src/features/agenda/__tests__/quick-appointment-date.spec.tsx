/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CliniAssistLocalDB } from '../../../db/local-db';
import { AppointmentLocalRepository } from '../../../db/repositories/appointment-local-repository';
import { PatientLocalRepository } from '../../../db/repositories/patient-local-repository';
import { ProcedureLocalRepository } from '../../../db/repositories/procedure-local-repository';
import { QuickAppointmentDrawer } from '../components/QuickAppointmentDrawer';
import { LocalAppointmentWithDetails } from '../types';

describe('Feature: correcao-data-agendamento-rapido', () => {
  let testDb: CliniAssistLocalDB;
  let appointmentRepo: AppointmentLocalRepository;
  let patientRepo: PatientLocalRepository;
  let procedureRepo: ProcedureLocalRepository;
  const tenantId = 'tenant-date-test';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-db-date-${Date.now()}-${Math.random()}`);
    await testDb.open();
    appointmentRepo = new AppointmentLocalRepository(testDb);
    patientRepo = new PatientLocalRepository(testDb);
    procedureRepo = new ProcedureLocalRepository(testDb);
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('US-066 — Seleção Dinâmica de Data no Card/Gaveta de Agendamento Rápido', () => {
    it('AC-108: Campo de Seleção de Data no Agendamento Rápido @spec:AC-108', async () => {
      const user = userEvent.setup();

      // Cria paciente e procedimento para testar o submit completo
      const patient = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Maria Antônia',
        whatsapp: '11988887777',
      });

      const proc = await procedureRepo.createProcedure({
        tenant_id: tenantId,
        name: 'Limpeza Dental',
        default_duration_minutes: 30,
        default_price_cents: 12000,
      });

      const initialDate = new Date('2026-10-19T09:00:00');
      const onAppointmentCreated = vi.fn();
      const onClose = vi.fn();

      render(
        <QuickAppointmentDrawer
          isOpen={true}
          onClose={onClose}
          tenantId={tenantId}
          initialDate={initialDate}
          initialTimeStr="09:00"
          existingAppointments={[]}
          appointmentRepo={appointmentRepo}
          patientRepo={patientRepo}
          procedureRepo={procedureRepo}
          onAppointmentCreated={onAppointmentCreated}
        />
      );

      // 1. O campo de data deve existir e estar inicializado com a data fornecida (2026-10-19)
      const dateInput = screen.getByTestId('input-appointment-date') as HTMLInputElement;
      expect(dateInput).toBeInTheDocument();
      expect(dateInput.value).toBe('2026-10-19');

      // 2. Altera a data para 2026-10-25
      fireEvent.change(dateInput, { target: { value: '2026-10-25' } });
      expect(dateInput.value).toBe('2026-10-25');

      // 3. Seleciona o paciente existente
      const searchPatientInput = screen.getByPlaceholderText(/Buscar por nome ou WhatsApp/i);
      await user.type(searchPatientInput, 'Maria');
      const patientOption = await screen.findByText('Maria Antônia');
      await user.click(patientOption);

      // 4. Seleciona o procedimento
      const procPill = await screen.findByText('Limpeza Dental');
      await user.click(procPill);

      // 5. Clica em Salvar Agendamento
      const saveBtn = screen.getByRole('button', { name: /Salvar Agendamento/i });
      await user.click(saveBtn);

      // 6. Confirma que onAppointmentCreated foi chamado e a data do agendamento é 2026-10-25
      await waitFor(() => {
        expect(onAppointmentCreated).toHaveBeenCalled();
      });

      const createdCallArg = onAppointmentCreated.mock.calls[0][0];
      const createdStart = new Date(createdCallArg.start_time);
      expect(createdStart.getFullYear()).toBe(2026);
      expect(createdStart.getMonth()).toBe(9); // Outubro (0-indexed)
      expect(createdStart.getDate()).toBe(25);
      expect(createdStart.getHours()).toBe(9);
      expect(createdStart.getMinutes()).toBe(0);
    });

    it('AC-109: Validação de Conflito Reativo ao Alterar a Data @spec:AC-109', async () => {
      // Cria consulta existente em 2026-10-21 às 14:00
      const existingDate = new Date(2026, 9, 21, 14, 0, 0, 0);
      const existingEndDate = new Date(2026, 9, 21, 14, 30, 0, 0);

      const existingAppointment: LocalAppointmentWithDetails = {
        id: 'app-conflict-date',
        tenant_id: tenantId,
        patient_id: 'pat-1',
        start_time: existingDate.toISOString(),
        end_time: existingEndDate.toISOString(),
        status: 'SCHEDULED',
        patient_name: 'João Existente',
        patient_whatsapp: '11999991111',
        procedures: [],
        items: [],
      };

      // Abre a gaveta inicialmente para 2026-10-19 às 14:00 (sem conflito)
      const initialDate = new Date(2026, 9, 19, 14, 0, 0, 0);

      render(
        <QuickAppointmentDrawer
          isOpen={true}
          onClose={vi.fn()}
          tenantId={tenantId}
          initialDate={initialDate}
          initialTimeStr="14:00"
          existingAppointments={[existingAppointment]}
          appointmentRepo={appointmentRepo}
          patientRepo={patientRepo}
          procedureRepo={procedureRepo}
          onAppointmentCreated={vi.fn()}
        />
      );

      // 1. Inicialmente não deve exibir aviso de encaixe porque o dia é diferente
      expect(screen.queryByTestId('encaixe-warning')).not.toBeInTheDocument();

      // 2. Altera a data para 2026-10-21 (onde há consulta no mesmo horário)
      const dateInput = screen.getByTestId('input-appointment-date');
      fireEvent.change(dateInput, { target: { value: '2026-10-21' } });

      // 3. O aviso de sobreposição/encaixe deve aparecer imediatamente
      await waitFor(() => {
        expect(screen.getByTestId('encaixe-warning')).toBeInTheDocument();
      });

      // 4. Se mudar novamente para outro dia (ex: 2026-10-22), o aviso deve sumir
      fireEvent.change(dateInput, { target: { value: '2026-10-22' } });
      await waitFor(() => {
        expect(screen.queryByTestId('encaixe-warning')).not.toBeInTheDocument();
      });
    });
  });
});
