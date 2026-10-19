/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CliniAssistLocalDB } from '../../../db/local-db';
import { AppointmentLocalRepository } from '../../../db/repositories/appointment-local-repository';
import { PatientLocalRepository } from '../../../db/repositories/patient-local-repository';
import { ProcedureLocalRepository } from '../../../db/repositories/procedure-local-repository';
import { QuickAppointmentDrawer } from '../components/QuickAppointmentDrawer';
import { ScheduleGrid } from '../components/ScheduleGrid';
import { AppointmentDetailsDrawer } from '../components/AppointmentDetailsDrawer';
import { LocalAppointmentWithDetails } from '../types';

describe('Feature: Correções e Edição de Procedimentos na Agenda', () => {
  let testDb: CliniAssistLocalDB;
  let appointmentRepo: AppointmentLocalRepository;
  let patientRepo: PatientLocalRepository;
  let procedureRepo: ProcedureLocalRepository;
  const tenantId = 'tenant-test-fixes';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-fixes-${Date.now()}-${Math.random()}`);
    await testDb.open();
    appointmentRepo = new AppointmentLocalRepository(testDb);
    patientRepo = new PatientLocalRepository(testDb);
    procedureRepo = new ProcedureLocalRepository(testDb);
  });

  describe('US-053 — Estabilidade e Limpeza do Ciclo de Vida da Gaveta de Agendamento Rápido', () => {
    it('AC-089: Reset completo de formulário e reativação do botão ao reabrir a gaveta @spec:AC-089', async () => {
      const user = userEvent.setup();
      const testDate = new Date('2026-10-19T10:00:00.000Z');
      const onCreated = vi.fn();
      let isOpen = true;

      const { rerender } = render(
        <QuickAppointmentDrawer
          isOpen={isOpen}
          onClose={() => { isOpen = false; }}
          tenantId={tenantId}
          initialDate={testDate}
          initialTimeStr="10:00"
          existingAppointments={[]}
          appointmentRepo={appointmentRepo}
          patientRepo={patientRepo}
          procedureRepo={procedureRepo}
          onAppointmentCreated={onCreated}
        />
      );

      // 1. Cadastra primeiro paciente e salva
      const patientInput = screen.getByLabelText('Buscar paciente');
      await user.type(patientInput, 'Primeiro Paciente');
      const createPatientBtn = await screen.findByText('+ Cadastrar "Primeiro Paciente"');
      await user.click(createPatientBtn);

      const phoneInput = screen.getByPlaceholderText('WhatsApp com DDD (Ex: 11987654321)');
      await user.type(phoneInput, '11999990001');
      await user.click(screen.getByRole('button', { name: 'Salvar Paciente' }));

      await waitFor(() => {
        expect(screen.getByText('Primeiro Paciente')).toBeDefined();
      });

      const submitBtn = screen.getByRole('button', { name: 'Salvar Agendamento' });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(onCreated).toHaveBeenCalledTimes(1);
      });

      // 2. Fecha a gaveta e reabre para um novo agendamento
      isOpen = false;
      rerender(
        <QuickAppointmentDrawer
          isOpen={false}
          onClose={() => { isOpen = false; }}
          tenantId={tenantId}
          initialDate={testDate}
          initialTimeStr="14:00"
          existingAppointments={[]}
          appointmentRepo={appointmentRepo}
          patientRepo={patientRepo}
          procedureRepo={procedureRepo}
          onAppointmentCreated={onCreated}
        />
      );

      isOpen = true;
      rerender(
        <QuickAppointmentDrawer
          isOpen={true}
          onClose={() => { isOpen = false; }}
          tenantId={tenantId}
          initialDate={testDate}
          initialTimeStr="14:00"
          existingAppointments={[]}
          appointmentRepo={appointmentRepo}
          patientRepo={patientRepo}
          procedureRepo={procedureRepo}
          onAppointmentCreated={onCreated}
        />
      );

      // 3. Valida que o botão NÃO está travado em "Salvando..."
      const newSubmitBtn = screen.getByRole('button', { name: 'Salvar Agendamento' });
      expect(newSubmitBtn).toBeDefined();
      expect(screen.queryByText('Salvando...')).toBeNull();

      // 4. Valida que os dados do paciente anterior NÃO estão retidos
      expect(screen.queryByText('Primeiro Paciente')).toBeNull();
      expect(screen.getByLabelText('Buscar paciente')).toBeDefined();
    });

    it('AC-090: Deduplicação idempotente e IDs determinísticos na lista de procedimentos @spec:AC-090', async () => {
      // Executa listProcedures duas vezes simultaneamente para simular re-render / StrictMode
      const [list1, list2] = await Promise.all([
        procedureRepo.listProcedures(tenantId),
        procedureRepo.listProcedures(tenantId),
      ]);

      expect(list1.length).toBeGreaterThan(0);
      expect(list2.length).toBe(list1.length);

      // Verifica que nenhum nome de procedimento se repete
      const names = list1.map((p) => p.name);
      const uniqueNames = new Set(names);
      expect(names.length).toBe(uniqueNames.size);

      // Checa contagem no Dexie
      const totalInDb = await testDb.procedures.where('tenant_id').equals(tenantId).count();
      expect(totalInDb).toBe(uniqueNames.size);
    });
  });

  describe('US-054 — Ocupação Contínua de Horários e Edição de Procedimentos em Consulta Existente', () => {
    it('AC-091: Bloqueio e cobertura visual contínua de slots intermediários em consultas longas @spec:AC-091', () => {
      const targetDate = new Date(2026, 9, 19, 12, 0, 0);
      const startDate = new Date(2026, 9, 19, 11, 0, 0);
      const endDate = new Date(2026, 9, 19, 12, 30, 0); // 90 min (11:00 às 12:30)

      const longAppointment: LocalAppointmentWithDetails = {
        id: 'app-longo-1',
        tenant_id: tenantId,
        patient_id: 'p-1',
        patient_name: 'Paciente Longo',
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        status: 'PENDING',
        is_extra_fit: false,
        procedures: [{ id: 'proc-1', tenant_id: tenantId, name: 'Cirurgia', default_duration_minutes: 90, default_price_cents: 35000, is_active: true, created_at: '', updated_at: '' }],
      };

      render(
        <ScheduleGrid
          currentDate={targetDate}
          viewMode="day"
          appointments={[longAppointment]}
          onSlotClick={vi.fn()}
        />
      );

      // Slot 11:00 tem o card principal
      const slot11 = screen.getByTestId('schedule-slot-11:00');
      expect(slot11).toBeDefined();
      expect(within(slot11).getByText('Paciente Longo')).toBeDefined();

      // Slot 11:30 NÃO deve oferecer "+ Horário Vago", pois está coberto pela consulta de 90min
      const slot1130 = screen.getByTestId('schedule-slot-11:30');
      expect(slot1130).toBeDefined();
      expect(slot1130.textContent).not.toContain('+ Horário Vago');
      expect(slot1130.textContent).toMatch(/Em atendimento: Paciente Longo/i);
    });

    it('AC-092: Edição interativa de procedimentos vinculados na consulta com recálculo de duração @spec:AC-092', async () => {
      const user = userEvent.setup();

      // 1. Cria procedimentos no banco
      const p1 = await procedureRepo.createProcedure({
        tenant_id: tenantId,
        name: 'Avaliação Rápida',
        default_duration_minutes: 30,
        default_price_cents: 10000,
      });

      const p2 = await procedureRepo.createProcedure({
        tenant_id: tenantId,
        name: 'Tratamento Avançado',
        default_duration_minutes: 60,
        default_price_cents: 25000,
      });

      // 2. Cria agendamento com p1 (30 min)
      const start = new Date('2026-10-19T09:00:00.000Z');
      const end = new Date(start.getTime() + 30 * 60000);

      const created = await appointmentRepo.createAppointment({
        tenant_id: tenantId,
        patient_id: 'p-edit',
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'PENDING',
        items: [{ procedure_id: p1.id, effective_price_cents: p1.default_price_cents, duration_minutes: 30 }],
      });

      const appointmentDetails: LocalAppointmentWithDetails = {
        ...created.appointment,
        patient_name: 'Paciente Teste Edição',
        procedures: [p1],
      };

      const onStatusChanged = vi.fn();

      render(
        <AppointmentDetailsDrawer
          isOpen={true}
          appointment={appointmentDetails}
          appointmentRepo={appointmentRepo}
          procedureRepo={procedureRepo}
          onClose={vi.fn()}
          onStatusChanged={onStatusChanged}
          onOpenReschedule={vi.fn()}
        />
      );

      // Procedimento atual aparece
      expect(screen.getByText('Avaliação Rápida')).toBeDefined();

      // Botão ou área de alterar procedimentos
      const editProcsBtn = screen.getByRole('button', { name: /Alterar Procedimentos|Editar Serviços/i });
      await user.click(editProcsBtn);

      // Seleciona p2 (Tratamento Avançado de 60 min) e desmarca p1
      const p2Option = await screen.findByText('Tratamento Avançado');
      await user.click(p2Option);

      const p1Option = screen.getByText('Avaliação Rápida');
      await user.click(p1Option);

      // Salva alterações
      const saveChangesBtn = screen.getByRole('button', { name: /Salvar Alterações|Confirmar Serviços/i });
      await user.click(saveChangesBtn);

      await waitFor(async () => {
        // Verifica no banco se a duração e término foram recalculados para 60 min
        const updatedInDb = await testDb.appointments.get(created.appointment.id);
        expect(updatedInDb).toBeDefined();

        const updatedEnd = new Date(updatedInDb!.end_time).getTime();
        const updatedStart = new Date(updatedInDb!.start_time).getTime();
        expect((updatedEnd - updatedStart) / 60000).toBe(60);
      });
    });
  });
});
