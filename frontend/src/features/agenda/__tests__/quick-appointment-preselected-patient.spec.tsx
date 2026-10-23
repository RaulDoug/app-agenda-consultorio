/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CliniAssistLocalDB } from '../../../db/local-db';
import { AppointmentLocalRepository } from '../../../db/repositories/appointment-local-repository';
import { PatientLocalRepository } from '../../../db/repositories/patient-local-repository';
import { ProcedureLocalRepository } from '../../../db/repositories/procedure-local-repository';
import { QuickAppointmentDrawer } from '../components/QuickAppointmentDrawer';
import { App } from '../../../App';

describe('Feature: agendamento-atalho-paciente-preselecionado', () => {
  let testDb: CliniAssistLocalDB;
  let appointmentRepo: AppointmentLocalRepository;
  let patientRepo: PatientLocalRepository;
  let procedureRepo: ProcedureLocalRepository;
  const tenantId = 'tenant-preselected-patient-test';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-db-preselected-${Date.now()}-${Math.random()}`);
    await testDb.open();
    appointmentRepo = new AppointmentLocalRepository(testDb);
    patientRepo = new PatientLocalRepository(testDb);
    procedureRepo = new ProcedureLocalRepository(testDb);
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('US-070 — Agendamento Rápido com Paciente Pré-Carregado a partir do Atalho de Cliente', () => {
    it('AC-114: Pré-Seleção Automática do Paciente ao Acionar o Atalho "+ Agendar" @spec:AC-114', async () => {
      const user = userEvent.setup();

      // 1. Cadastra paciente e procedimento
      const patient = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Lucas Atalho',
        whatsapp: '11988887777',
        notes: 'Paciente prefere anestesia sem vasoconstritor',
      });

      const proc = await procedureRepo.createProcedure({
        tenant_id: tenantId,
        name: 'Profilaxia e Limpeza',
        default_duration_minutes: 30,
        default_price_cents: 15000,
      });

      const onAppointmentCreated = vi.fn();
      const onClose = vi.fn();

      // 2. Renderiza a gaveta passando o paciente pré-selecionado (como acionado pelo atalho)
      render(
        <QuickAppointmentDrawer
          isOpen={true}
          onClose={onClose}
          tenantId={tenantId}
          initialDate={new Date('2026-10-20T10:00:00')}
          initialTimeStr="10:00"
          initialPatient={patient}
          existingAppointments={[]}
          appointmentRepo={appointmentRepo}
          patientRepo={patientRepo}
          procedureRepo={procedureRepo}
          onAppointmentCreated={onAppointmentCreated}
        />
      );

      // 3. Valida que o paciente está imediatamente selecionado
      expect(screen.getByText('Lucas Atalho')).toBeInTheDocument();
      expect(screen.getByText('11988887777')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Trocar/i })).toBeInTheDocument();

      // 4. Valida que as observações clínicas do paciente são exibidas
      const notesElement = screen.getByTestId('selected-patient-notes');
      expect(notesElement).toBeInTheDocument();
      expect(notesElement.textContent).toContain('Paciente prefere anestesia sem vasoconstritor');

      // 5. Seleciona o procedimento e salva o agendamento
      const procPill = await screen.findByText('Profilaxia e Limpeza');
      await user.click(procPill);

      const saveBtn = screen.getByRole('button', { name: /Salvar Agendamento/i });
      await user.click(saveBtn);

      // 6. Confirma que a consulta foi criada com o paciente pré-selecionado
      await waitFor(() => {
        expect(onAppointmentCreated).toHaveBeenCalledWith(
          expect.objectContaining({
            patient_id: patient.id,
          })
        );
      });
    });

    it('AC-115: Isolamento e Reset de Seleção para Aberturas Avulsas @spec:AC-115', async () => {
      const user = userEvent.setup();

      // 1. Cadastra paciente no banco
      const patient = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Roberta Atalho',
        whatsapp: '11977776666',
      });

      // 2. Renderiza a aplicação completa na aba Clientes
      render(
        <App
          initialTab="clientes"
          db={testDb}
          tenantId={tenantId}
          initialWhatsappConnected={true}
        />
      );

      // Aguarda carregar a lista de pacientes
      await waitFor(() => {
        expect(screen.getByText('Roberta Atalho')).toBeInTheDocument();
      });

      // 3. Clica no botão "+ Agendar" no card da Roberta
      const scheduleBtn = screen.getByRole('button', { name: /\+ Agendar/i });
      await user.click(scheduleBtn);

      // 4. A gaveta deve abrir com Roberta selecionada
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('Roberta Atalho')).toBeInTheDocument();
        expect(within(dialog).getByRole('button', { name: /Trocar/i })).toBeInTheDocument();
      });

      // 5. Fecha a gaveta
      const closeBtn = screen.getByLabelText('Fechar');
      await user.click(closeBtn);

      // 6. Agora clica no botão de agendamento avulso no topo da agenda "+ Novo Agendamento"
      const newAppBtn = screen.getByTestId('btn-new-appointment-top');
      await user.click(newAppBtn);

      // 7. A gaveta deve abrir limpa: sem Roberta e com input de busca de paciente
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Buscar por nome ou WhatsApp.../i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Trocar/i })).not.toBeInTheDocument();
      });
    });
  });
});
