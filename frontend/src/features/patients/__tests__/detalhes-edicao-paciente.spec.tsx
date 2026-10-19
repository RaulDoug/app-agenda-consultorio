/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CliniAssistLocalDB } from '../../../db/local-db';
import { PatientLocalRepository } from '../../../db/repositories/patient-local-repository';
import { PatientCard } from '../components/PatientCard';
import { CreatePatientModal } from '../components/CreatePatientModal';
import { InlinePatientForm } from '../../agenda/components/InlinePatientForm';
import { PatientWithHistoryStatus } from '../types';

describe('Feature: detalhes-edicao-paciente-observacoes', () => {
  let testDb: CliniAssistLocalDB;
  let patientRepo: PatientLocalRepository;
  const tenantId = 'tenant-pacientes-test';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-db-patients-${Date.now()}-${Math.random()}`);
    await testDb.open();
    patientRepo = new PatientLocalRepository(testDb);
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('US-067 — Visualização Expandida de Detalhes e Observações Clínicas no Card de Paciente', () => {
    it('AC-110: Ícone Indicativo de Observações no Card do Paciente @spec:AC-110', async () => {
      // 1. Paciente COM observações clínicas
      const patientWithNotes = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Ana Paula com Notas',
        whatsapp: '11988881111',
        notes: 'Alergia severa a dipirona e látex',
      });

      const itemWithNotes: PatientWithHistoryStatus = {
        patient: patientWithNotes,
        totalAppointments: 1,
        nextAppointment: null,
        lastCancelledWithoutReschedule: false,
        hasNoHistory: false,
      };

      // 2. Paciente SEM observações
      const patientWithoutNotes = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Bruno sem Notas',
        whatsapp: '11988882222',
        notes: null,
      });

      const itemWithoutNotes: PatientWithHistoryStatus = {
        patient: patientWithoutNotes,
        totalAppointments: 0,
        nextAppointment: null,
        lastCancelledWithoutReschedule: false,
        hasNoHistory: true,
      };

      const { unmount } = render(<PatientCard item={itemWithNotes} />);
      expect(screen.getByTestId(`badge-notes-${patientWithNotes.id}`)).toBeInTheDocument();
      expect(screen.getByText('Obs')).toBeInTheDocument();
      unmount();

      render(<PatientCard item={itemWithoutNotes} />);
      expect(screen.queryByTestId(`badge-notes-${patientWithoutNotes.id}`)).not.toBeInTheDocument();
    });

    it('AC-111: Expansão Interativa do Card do Paciente com Detalhes e Observações @spec:AC-111', async () => {
      const patient = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Carlos Expandível',
        whatsapp: '11988883333',
        notes: 'Paciente diabético controlado, prefere consultas de manhã.',
      });

      const item: PatientWithHistoryStatus = {
        patient,
        totalAppointments: 3,
        nextAppointment: null,
        lastCancelledWithoutReschedule: false,
        hasNoHistory: false,
      };

      render(<PatientCard item={item} />);

      // Inicialmente o card está recolhido
      expect(screen.queryByTestId(`patient-expanded-details-${patient.id}`)).not.toBeInTheDocument();
      expect(screen.queryByTestId(`patient-notes-content-${patient.id}`)).not.toBeInTheDocument();

      // Clica no card para expandir
      const card = screen.getByTestId(`patient-card-${patient.id}`);
      fireEvent.click(card);

      // Agora o card expandido deve exibir observações completas e detalhes
      expect(screen.getByTestId(`patient-expanded-details-${patient.id}`)).toBeInTheDocument();
      const notesContent = screen.getByTestId(`patient-notes-content-${patient.id}`);
      expect(notesContent.textContent).toContain('Paciente diabético controlado');
      expect(screen.getByText(/3 atendimento\(s\)/i)).toBeInTheDocument();
      expect(screen.getByTestId(`btn-edit-patient-${patient.id}`)).toBeInTheDocument();

      // Clica novamente no card: deve recolher
      fireEvent.click(card);
      expect(screen.queryByTestId(`patient-expanded-details-${patient.id}`)).not.toBeInTheDocument();
    });
  });

  describe('US-068 — Edição do Cadastro de Pacientes', () => {
    it('AC-112: Ação de Edição no Card Expandido com Persistência no Banco Local @spec:AC-112', async () => {
      const user = userEvent.setup();

      // 1. Cadastra paciente original
      const patient = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Daniela Original',
        whatsapp: '11988884444',
        notes: 'Observação inicial antiga',
      });

      const item: PatientWithHistoryStatus = {
        patient,
        totalAppointments: 1,
        nextAppointment: null,
        lastCancelledWithoutReschedule: false,
        hasNoHistory: false,
      };

      const onEdit = vi.fn();
      const { unmount } = render(<PatientCard item={item} onEdit={onEdit} />);

      // 2. Expande o card e clica no botão "Editar Cadastro"
      fireEvent.click(screen.getByTestId(`patient-card-${patient.id}`));
      const editBtn = screen.getByTestId(`btn-edit-patient-${patient.id}`);
      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalledWith(patient);
      unmount();

      // 3. Renderiza CreatePatientModal com patientToEdit
      const onPatientSaved = vi.fn();
      render(
        <CreatePatientModal
          isOpen={true}
          onClose={vi.fn()}
          tenantId={tenantId}
          patientRepo={patientRepo}
          patientToEdit={patient}
          onPatientSaved={onPatientSaved}
        />
      );

      // Valida título do modal e pré-carregamento dos valores
      expect(screen.getByText('Editar Paciente')).toBeInTheDocument();
      const nameInput = screen.getByLabelText(/Nome Completo/i) as HTMLInputElement;
      const phoneInput = screen.getByLabelText(/WhatsApp/i) as HTMLInputElement;
      const notesInput = screen.getByLabelText(/Observações/i) as HTMLTextAreaElement;

      expect(nameInput.value).toBe('Daniela Original');
      expect(phoneInput.value).toBe('11988884444');
      expect(notesInput.value).toBe('Observação inicial antiga');

      // 4. Altera dados e salva
      fireEvent.change(nameInput, { target: { value: 'Daniela Silva Atualizada' } });
      fireEvent.change(phoneInput, { target: { value: '11988889999' } });
      fireEvent.change(notesInput, { target: { value: 'Observação médica atualizada recentemente' } });

      const saveBtn = screen.getByTestId('btn-save-patient');
      expect(saveBtn.textContent).toContain('Salvar Alterações');
      await user.click(saveBtn);

      // 5. Confirma persistência no repositório IndexedDB
      await waitFor(async () => {
        const updated = await patientRepo.getPatientById(patient.id);
        expect(updated).toBeDefined();
        expect(updated?.name).toBe('Daniela Silva Atualizada');
        expect(updated?.whatsapp).toBe('11988889999');
        expect(updated?.notes).toBe('Observação médica atualizada recentemente');
        expect(onPatientSaved).toHaveBeenCalledWith(
          expect.objectContaining({
            id: patient.id,
            name: 'Daniela Silva Atualizada',
            whatsapp: '11988889999',
            notes: 'Observação médica atualizada recentemente',
          })
        );
      });
    });
  });

  describe('US-069 — Exibição Contextual das Observações do Paciente no Agendamento Rápido', () => {
    it('AC-113: Bloco de Observações Clínicas na Gaveta de Agendamento @spec:AC-113', async () => {
      // 1. Paciente COM observações clínicas selecionado
      const patientWithNotes = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Eduardo com Alergia',
        whatsapp: '11999995555',
        notes: 'Alergia severa a anestésico com vasoconstritor',
      });

      const { rerender } = render(
        <InlinePatientForm
          tenantId={tenantId}
          patientRepo={patientRepo}
          selectedPatient={patientWithNotes}
          onSelectPatient={vi.fn()}
        />
      );

      // O bloco de notas clínicas deve estar visível
      await waitFor(() => {
        const notesBlock = screen.getByTestId('selected-patient-notes');
        expect(notesBlock).toBeInTheDocument();
        expect(notesBlock.textContent).toContain('Alergia severa a anestésico com vasoconstritor');
      });

      // 2. Paciente SEM observações selecionado
      const patientWithoutNotes = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Fernanda sem Alergia',
        whatsapp: '11999996666',
        notes: null,
      });

      rerender(
        <InlinePatientForm
          tenantId={tenantId}
          patientRepo={patientRepo}
          selectedPatient={patientWithoutNotes}
          onSelectPatient={vi.fn()}
        />
      );

      // O bloco de notas clínicas não deve ser exibido
      await waitFor(() => {
        expect(screen.queryByTestId('selected-patient-notes')).not.toBeInTheDocument();
      });
    });
  });
});
