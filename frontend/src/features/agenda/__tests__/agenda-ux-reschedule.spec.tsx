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
import { AppointmentDetailsDrawer } from '../components/AppointmentDetailsDrawer';
import { RescheduleModal } from '../components/RescheduleModal';
import { LocalAppointmentWithDetails } from '../types';

describe('Feature: Controle de Encaixe, UX de Modais e Resiliência na Remarcação', () => {
  let testDb: CliniAssistLocalDB;
  let appointmentRepo: AppointmentLocalRepository;
  let patientRepo: PatientLocalRepository;
  let procedureRepo: ProcedureLocalRepository;
  const tenantId = 'tenant-ux-test';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-db-ux-${Date.now()}-${Math.random()}`);
    await testDb.open();
    appointmentRepo = new AppointmentLocalRepository(testDb);
    patientRepo = new PatientLocalRepository(testDb);
    procedureRepo = new ProcedureLocalRepository(testDb);
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('US-055 — Controle Explícito de Encaixe e Prevenção de Conflito de Horário', () => {
    it('AC-093: Checkbox explícito de autorização de encaixe em caso de sobreposição @spec:AC-093', async () => {
      const user = userEvent.setup();

      // 1. Cadastra paciente e procedimento
      const patient = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Carlos Conflito',
        whatsapp: '11999990001',
      });

      const proc = await procedureRepo.createProcedure({
        tenant_id: tenantId,
        name: 'Consulta Padrão',
        default_duration_minutes: 30,
        default_price_cents: 15000,
      });

      const baseDate = new Date('2026-10-19T10:00:00.000Z');

      const existStart = new Date(baseDate);
      existStart.setHours(10, 30, 0, 0);
      const existEnd = new Date(existStart.getTime() + 30 * 60 * 1000);

      // 2. Cria agendamento existente às 10:30
      const existingApp: LocalAppointmentWithDetails = {
        id: 'app-existente-1',
        tenant_id: tenantId,
        patient_id: 'p-outro',
        patient_name: 'Outro Paciente',
        start_time: existStart.toISOString(),
        end_time: existEnd.toISOString(),
        status: 'CONFIRMED',
        is_extra_fit: false,
      };

      const onCreated = vi.fn();

      render(
        <QuickAppointmentDrawer
          isOpen={true}
          onClose={vi.fn()}
          tenantId={tenantId}
          initialDate={baseDate}
          initialTimeStr="10:30"
          existingAppointments={[existingApp]}
          appointmentRepo={appointmentRepo}
          patientRepo={patientRepo}
          procedureRepo={procedureRepo}
          onAppointmentCreated={onCreated}
        />
      );

      // Seleciona paciente
      const searchInput = screen.getByLabelText('Buscar paciente');
      await user.type(searchInput, 'Carlos Conflito');
      const patientOption = await screen.findByText('Carlos Conflito');
      await user.click(patientOption);

      // Alerta de conflito de horário deve aparecer
      expect(screen.getByTestId('encaixe-warning')).toBeDefined();

      // Checkbox de confirmação de encaixe deve existir
      const encaixeCheckbox = screen.getByLabelText(/Permitir Encaixe|Confirmar como Encaixe/i) as HTMLInputElement;
      expect(encaixeCheckbox).toBeDefined();
      expect(encaixeCheckbox.checked).toBe(false);

      // Tenta salvar sem marcar o checkbox -> Deve impedir e exibir mensagem de erro
      const submitBtn = screen.getByRole('button', { name: 'Salvar Agendamento' });
      await user.click(submitBtn);

      expect(onCreated).not.toHaveBeenCalled();
      expect(screen.getByText(/Para salvar neste horário conflitante, marque a opção de Encaixe|autorização de encaixe/i)).toBeDefined();

      // Agora marca o checkbox de encaixe
      await user.click(encaixeCheckbox);
      expect(encaixeCheckbox.checked).toBe(true);

      // Tenta salvar novamente com encaixe autorizado
      await user.click(submitBtn);

      await waitFor(() => {
        expect(onCreated).toHaveBeenCalled();
      });

      // Valida no banco local que o agendamento foi salvo com is_extra_fit = true
      const allApps = await testDb.appointments.where('tenant_id').equals(tenantId).toArray();
      const savedApp = allApps.find((a) => a.patient_id === patient.id);
      expect(savedApp).toBeDefined();
      expect(savedApp?.is_extra_fit).toBe(true);
    });
  });

  describe('US-056 — Bloqueio de Scroll de Fundo e Fechamento por Clique no Backdrop', () => {
    it('AC-094: Scroll lock no body e fechamento ao clicar fora do card @spec:AC-094', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      const { unmount, rerender } = render(
        <QuickAppointmentDrawer
          isOpen={true}
          onClose={onClose}
          tenantId={tenantId}
          initialDate={new Date()}
          initialTimeStr="09:00"
          existingAppointments={[]}
          appointmentRepo={appointmentRepo}
          patientRepo={patientRepo}
          procedureRepo={procedureRepo}
          onAppointmentCreated={vi.fn()}
        />
      );

      // 1. Valida que o body recebeu overflow: hidden
      expect(document.body.style.overflow).toBe('hidden');

      // 2. Clique dentro do card (conteúdo) NÃO deve fechar
      const cardTitle = screen.getByText('Novo Agendamento Rápido');
      await user.click(cardTitle);
      expect(onClose).not.toHaveBeenCalled();

      // 3. Clique no backdrop (área externa com role="dialog") deve chamar onClose
      const dialogBackdrop = screen.getByRole('dialog');
      fireEvent.click(dialogBackdrop);
      expect(onClose).toHaveBeenCalledTimes(1);

      // 4. Ao fechar (isOpen=false) ou desmontar, o scroll do body deve ser restaurado
      rerender(
        <QuickAppointmentDrawer
          isOpen={false}
          onClose={onClose}
          tenantId={tenantId}
          initialDate={new Date()}
          initialTimeStr="09:00"
          existingAppointments={[]}
          appointmentRepo={appointmentRepo}
          patientRepo={patientRepo}
          procedureRepo={procedureRepo}
          onAppointmentCreated={vi.fn()}
        />
      );
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('US-057 — Ciclo de Vida e Resiliência do Modal de Remarcação', () => {
    it('AC-095: Destravamento garantido e persistência de remarcação sem bloqueio de botão @spec:AC-095', async () => {
      const user = userEvent.setup();

      // 1. Cria agendamento no banco
      const start = new Date('2026-10-19T10:00:00.000Z');
      const end = new Date('2026-10-19T10:30:00.000Z');

      const created = await appointmentRepo.createAppointment({
        tenant_id: tenantId,
        patient_id: 'p-reschedule',
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'PENDING',
        items: [{ procedure_id: 'proc-1', effective_price_cents: 10000, duration_minutes: 30 }],
      });

      const appointmentDetails: LocalAppointmentWithDetails = {
        ...created.appointment,
        patient_name: 'Paciente Remarcado',
      };

      const onClose = vi.fn();
      const onRescheduled = vi.fn();

      const { rerender } = render(
        <RescheduleModal
          isOpen={true}
          appointment={appointmentDetails}
          appointmentRepo={appointmentRepo}
          onClose={onClose}
          onRescheduled={onRescheduled}
        />
      );

      // Botão deve iniciar habilitado com "Confirmar Remarcação"
      const submitBtn = screen.getByRole('button', { name: 'Confirmar Remarcação' });
      expect(submitBtn).toBeDefined();
      expect(screen.queryByText('Remarcando...')).toBeNull();

      // Seleciona novo horário 11:30
      const timeSlotBtn = await screen.findByRole('button', { name: '11:30' });
      await user.click(timeSlotBtn);

      // Submete a remarcação
      await user.click(submitBtn);

      await waitFor(() => {
        expect(onRescheduled).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });

      // Valida persistência no Dexie
      const updatedInDb = await testDb.appointments.get(created.appointment.id);
      expect(updatedInDb).toBeDefined();
      expect(new Date(updatedInDb!.start_time).getHours()).toBe(11);
      expect(new Date(updatedInDb!.start_time).getMinutes()).toBe(30);

      // Reabre o modal para simular novo uso e garante que o botão NÃO está travado
      rerender(
        <RescheduleModal
          isOpen={true}
          appointment={appointmentDetails}
          appointmentRepo={appointmentRepo}
          onClose={onClose}
          onRescheduled={onRescheduled}
        />
      );

      const reloadedBtn = screen.getByRole('button', { name: 'Confirmar Remarcação' });
      expect(reloadedBtn).toBeDefined();
      expect(screen.queryByText('Remarcando...')).toBeNull();
    });

    it('AC-199: Alerta de encaixe e autorização obrigatória na remarcação direta pelo card @spec:AC-199', async () => {
      const user = userEvent.setup();

      const baseDay = new Date(2026, 9, 26, 14, 0, 0);
      const baseEnd = new Date(2026, 9, 26, 14, 30, 0);

      const created = await appointmentRepo.createAppointment({
        tenant_id: tenantId,
        patient_id: 'pat-reschedule-1',
        start_time: baseDay.toISOString(),
        end_time: baseEnd.toISOString(),
        status: 'CONFIRMED',
        items: [],
      });

      const appointmentDetails: LocalAppointmentWithDetails = {
        ...created.appointment,
        patient_name: 'Paciente Remarcação Encaixe',
      };

      // Consulta conflitante existente às 10:00
      const conflictStart = new Date(2026, 9, 26, 10, 0, 0);
      const conflictEnd = new Date(2026, 9, 26, 10, 30, 0);

      const conflictingApp: LocalAppointmentWithDetails = {
        id: 'conflicting-app-1',
        tenant_id: tenantId,
        patient_id: 'pat-outro',
        patient_name: 'Outro Paciente Marcado',
        start_time: conflictStart.toISOString(),
        end_time: conflictEnd.toISOString(),
        status: 'CONFIRMED',
      };

      const onClose = vi.fn();
      const onRescheduled = vi.fn();

      render(
        <RescheduleModal
          isOpen={true}
          appointment={appointmentDetails}
          appointmentRepo={appointmentRepo}
          existingAppointments={[conflictingApp]}
          businessHours={{
            startHour: 8,
            endHour: 17,
            lunchStartHour: 12,
            lunchEndHour: 13,
            slotDurationMinutes: 30,
          }}
          onClose={onClose}
          onRescheduled={onRescheduled}
        />
      );

      // Clica no horário conflitante de 10:00
      const slot10 = await screen.findByRole('button', { name: '10:00' });
      await user.click(slot10);

      // Deve exibir o aviso de encaixe
      const warning = await screen.findByTestId('reschedule-extra-fit-warning');
      expect(warning).toBeInTheDocument();
      expect(warning).toHaveTextContent('Choque de horário');

      // Tenta submeter sem marcar o checkbox
      const submitBtn = screen.getByRole('button', { name: 'Confirmar Remarcação' });
      await user.click(submitBtn);

      // Deve exibir mensagem de erro
      const errorMsg = await screen.findByTestId('reschedule-error-msg');
      expect(errorMsg).toHaveTextContent('É necessário autorizar o encaixe');
      expect(onRescheduled).not.toHaveBeenCalled();

      // Marca o checkbox de autorização
      const checkbox = screen.getByTestId('reschedule-allow-extra-fit-checkbox');
      await user.click(checkbox);

      // Confirma agora com sucesso
      await user.click(submitBtn);

      await waitFor(() => {
        expect(onRescheduled).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('AC-199: Remarcação no sábado após as 12:00 detecta horário fora de expediente e exige autorização de encaixe @spec:AC-199', async () => {
      const user = userEvent.setup();

      const patient = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Paciente Sábado',
        whatsapp: '11999990099',
      });

      // Cria agendamento inicial para um sábado às 09:00 (dentro do expediente de sábado 08-12h)
      // 2026-10-24 foi um Sábado
      const saturdayDate = new Date(2026, 9, 24, 9, 0, 0);

      const created = await appointmentRepo.createAppointment({
        tenant_id: tenantId,
        patient_id: patient.id,
        start_time: saturdayDate.toISOString(),
        end_time: new Date(saturdayDate.getTime() + 30 * 60 * 1000).toISOString(),
        status: 'RESCHEDULE_REQUESTED',
        items: [],
      });

      const appointmentDetails: LocalAppointmentWithDetails = {
        ...created.appointment,
        patient_name: 'Paciente Sábado',
      };

      const onClose = vi.fn();
      const onRescheduled = vi.fn();

      render(
        <RescheduleModal
          isOpen={true}
          appointment={appointmentDetails}
          appointmentRepo={appointmentRepo}
          onClose={onClose}
          onRescheduled={onRescheduled}
        />
      );

      // Clica no horário das 14:00 (após o meio-dia no sábado)
      const slot14 = await screen.findByRole('button', { name: '14:00' });
      await user.click(slot14);

      // Deve exibir o aviso de encaixe por ser fora do expediente do sábado
      const warning = await screen.findByTestId('reschedule-extra-fit-warning');
      expect(warning).toBeInTheDocument();
      expect(warning).toHaveTextContent(/fora do expediente de sábado/i);

      // Tenta submeter sem marcar o checkbox
      const submitBtn = screen.getByRole('button', { name: 'Confirmar Remarcação' });
      await user.click(submitBtn);

      const errorMsg = await screen.findByTestId('reschedule-error-msg');
      expect(errorMsg).toHaveTextContent('É necessário autorizar o encaixe');
      expect(onRescheduled).not.toHaveBeenCalled();

      // Marca autorização de encaixe e confirma
      const checkbox = screen.getByTestId('reschedule-allow-extra-fit-checkbox');
      await user.click(checkbox);
      await user.click(submitBtn);

      await waitFor(() => {
        expect(onRescheduled).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });
});
