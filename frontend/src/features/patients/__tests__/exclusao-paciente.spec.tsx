/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CliniAssistLocalDB } from '../../../db/local-db';
import { PatientLocalRepository } from '../../../db/repositories/patient-local-repository';
import { PatientCard } from '../components/PatientCard';
import { ConfirmDeletePatientModal } from '../components/ConfirmDeletePatientModal';
import { CreatePatientModal } from '../components/CreatePatientModal';
import { App } from '../../../App';
import { PatientWithHistoryStatus } from '../types';

describe('Feature: exclusao-cadastro-paciente', () => {
  let testDb: CliniAssistLocalDB;
  let patientRepo: PatientLocalRepository;
  const tenantId = 'tenant-exclusao-test';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-db-exclusao-${Date.now()}-${Math.random()}`);
    await testDb.open();
    patientRepo = new PatientLocalRepository(testDb);
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('US-071 — Exclusão Segura de Pacientes da Listagem Ativa', () => {
    it('AC-116: Exclusão Lógica e Desativação no Repositório Local de Pacientes @spec:AC-116', async () => {
      // 1. Cadastra paciente ativo
      const created = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Roberto Silveira',
        whatsapp: '11977771234',
        notes: 'Paciente para teste de exclusão',
      });

      expect(created.is_active).toBe(true);

      // 2. Confirma presença nas listagens ativas
      const listBefore = await patientRepo.listPatients(tenantId);
      expect(listBefore.some((p) => p.id === created.id)).toBe(true);

      const searchBefore = await patientRepo.searchPatients(tenantId, 'Roberto');
      expect(searchBefore.some((p) => p.id === created.id)).toBe(true);

      // 3. Executa exclusão lógica
      await patientRepo.deletePatient(created.id);

      // 4. Confirma no banco local que o registro permanece, mas com is_active: false
      const rawInDb = await testDb.patients.get(created.id);
      expect(rawInDb).toBeDefined();
      expect(rawInDb?.is_active).toBe(false);

      // 5. Confirma mutação de DELETE enfileirada na sync_outbox
      const outboxEntries = await testDb.sync_outbox
        .where('record_id')
        .equals(created.id)
        .toArray();

      const deleteMutation = outboxEntries.find(
        (entry) => entry.entity === 'patients' && entry.operation === 'DELETE'
      );
      expect(deleteMutation).toBeDefined();
      expect(deleteMutation?.payload).toEqual(
        expect.objectContaining({
          id: created.id,
          is_active: false,
        })
      );

      // 6. Confirma que listPatients e searchPatients NÃO retornam mais o paciente desativado
      const listAfter = await patientRepo.listPatients(tenantId);
      expect(listAfter.some((p) => p.id === created.id)).toBe(false);

      const searchAfter = await patientRepo.searchPatients(tenantId, 'Roberto');
      expect(searchAfter.some((p) => p.id === created.id)).toBe(false);
    });

    it('AC-117: Ação de Exclusão no Card do Paciente e Modal com Confirmação Segura @spec:AC-117', async () => {
      const user = userEvent.setup();

      // 1. Cria paciente no banco
      const patient = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Camila Fernandes',
        whatsapp: '11988884321',
        notes: 'Alergia a iodo',
      });

      const item: PatientWithHistoryStatus = {
        patient,
        totalAppointments: 2,
        nextAppointment: null,
        lastCancelledWithoutReschedule: false,
        hasNoHistory: false,
      };

      const mockOnDelete = vi.fn();
      const mockOnEdit = vi.fn();

      // 2. Renderiza PatientCard e valida expansão e botão de exclusão
      const { unmount } = render(
        <PatientCard
          item={item}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      // Antes de expandir, botão de exclusão não está visível
      expect(screen.queryByTestId(`btn-delete-patient-${patient.id}`)).toBeNull();

      // Expande o card
      const toggleBtn = screen.getByTestId(`btn-toggle-expand-${patient.id}`);
      await user.click(toggleBtn);

      // Botão Excluir fica visível no card expandido
      const deleteCardBtn = screen.getByTestId(`btn-delete-patient-${patient.id}`);
      expect(deleteCardBtn).toBeDefined();

      // Clica no botão Excluir do card
      await user.click(deleteCardBtn);
      expect(mockOnDelete).toHaveBeenCalledWith(patient);

      unmount();

      // 3. Valida ConfirmDeletePatientModal: cancelamento e confirmação
      const mockCloseModal = vi.fn();
      const mockConfirmModal = vi.fn().mockResolvedValue(undefined);

      const { unmount: unmountModal, rerender } = render(
        <ConfirmDeletePatientModal
          isOpen={true}
          patient={patient}
          onClose={mockCloseModal}
          onConfirm={mockConfirmModal}
        />
      );

      // Confirma que exibe o nome do paciente e textos de alerta
      expect(screen.getByTestId('delete-patient-modal-title')).toHaveTextContent('Excluir Paciente');
      expect(screen.getByText(/Camila Fernandes/)).toBeDefined();
      expect(screen.getByText(/Aviso importante:/i)).toBeDefined();

      // Clica em Cancelar
      const cancelBtn = screen.getByTestId('btn-cancel-delete');
      await user.click(cancelBtn);
      expect(mockCloseModal).toHaveBeenCalled();
      expect(mockConfirmModal).not.toHaveBeenCalled();

      // Clica em Confirmar Exclusão
      const confirmBtn = screen.getByTestId('btn-confirm-delete-patient');
      await user.click(confirmBtn);
      expect(mockConfirmModal).toHaveBeenCalledWith(patient);

      unmountModal();

      // 4. Valida botão de exclusão no CreatePatientModal em modo de edição
      const mockDeleteFromModal = vi.fn();
      render(
        <CreatePatientModal
          isOpen={true}
          tenantId={tenantId}
          patientRepo={patientRepo}
          patientToEdit={patient}
          onClose={vi.fn()}
          onDeletePatient={mockDeleteFromModal}
        />
      );

      const modalDeleteBtn = screen.getByTestId('btn-delete-patient-modal');
      expect(modalDeleteBtn).toBeDefined();
      await user.click(modalDeleteBtn);
      expect(mockDeleteFromModal).toHaveBeenCalledWith(patient);
    });

    it('Fluxo Integrado no App: Exclusão Reativa de Paciente da Listagem @spec:AC-117', async () => {
      const user = userEvent.setup();

      // 1. Cadastra 2 pacientes no banco de testes
      const p1 = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Marcos Aurelio',
        whatsapp: '11999990001',
      });

      const p2 = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Juliana Paes',
        whatsapp: '11999990002',
      });

      // 2. Renderiza App diretamente na aba Clientes
      render(
        <App
          initialTab="clientes"
          tenantId={tenantId}
          db={testDb}
          initialWhatsappConnected={false}
        />
      );

      // Espera renderizar os dois pacientes na lista
      await waitFor(() => {
        expect(screen.getByText('Marcos Aurelio')).toBeDefined();
        expect(screen.getByText('Juliana Paes')).toBeDefined();
      });

      // 3. Expande o card de Marcos Aurelio
      const toggleMarcos = screen.getByTestId(`btn-toggle-expand-${p1.id}`);
      await user.click(toggleMarcos);

      // 4. Clica em Excluir no card
      const deleteBtn = screen.getByTestId(`btn-delete-patient-${p1.id}`);
      await user.click(deleteBtn);

      // 5. Diálogo de confirmação abre
      expect(screen.getByTestId('confirm-delete-patient-modal')).toBeDefined();

      // 6. Confirma a exclusão
      const confirmDeleteBtn = screen.getByTestId('btn-confirm-delete-patient');
      await user.click(confirmDeleteBtn);

      // 7. Confirma que Marcos Aurelio foi removido reativamente da interface
      await waitFor(() => {
        expect(screen.queryByText('Marcos Aurelio')).toBeNull();
        expect(screen.getByText('Juliana Paes')).toBeDefined();
      });

      // 8. Confirma que Marcos Aurelio está com is_active: false no banco local
      const dbRecord = await testDb.patients.get(p1.id);
      expect(dbRecord?.is_active).toBe(false);
    });
  });
});
