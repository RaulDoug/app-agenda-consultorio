/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CliniAssistLocalDB } from '../../../db/local-db';
import { PatientLocalRepository } from '../../../db/repositories/patient-local-repository';
import { CreatePatientModal } from '../components/CreatePatientModal';
import { InlinePatientForm } from '../../agenda/components/InlinePatientForm';
import { LocalPatient } from '../../../db/types';

describe('Feature: filtro-reativacao-clientes — Reativação Assistida no Cadastro', () => {
  let db: CliniAssistLocalDB;
  let repo: PatientLocalRepository;
  const tenantId = 'tenant-duplicidade-reativacao-test';

  beforeEach(async () => {
    db = new CliniAssistLocalDB(`test-dup-reactivate-${Date.now()}-${Math.random()}`);
    await db.open();
    repo = new PatientLocalRepository(db);
  });

  it('AC-250: Validação de WhatsApp com proposta de reativação de cliente inativo no CreatePatientModal @spec:AC-250', async () => {
    const user = userEvent.setup();

    // 1. Cadastra cliente inativo
    const inactive = await repo.createPatient({
      tenant_id: tenantId,
      name: 'Fabiana Rossi',
      whatsapp: '11988887766',
    });
    await repo.deletePatient(inactive.id);

    let createdOrReactivated: LocalPatient | null = null;
    let isClosed = false;

    render(
      <CreatePatientModal
        isOpen={true}
        onClose={() => {
          isClosed = true;
        }}
        tenantId={tenantId}
        patientRepo={repo}
        onPatientSaved={(p) => {
          createdOrReactivated = p;
        }}
      />
    );

    // 2. Preenche formulário com o mesmo WhatsApp do cliente inativo
    await user.type(screen.getByLabelText(/Nome Completo/i), 'Fabiana Rossi Nova');
    await user.type(screen.getByLabelText(/WhatsApp/i), '11988887766');

    // Clica em Salvar
    await user.click(screen.getByTestId('btn-save-patient'));

    // 3. Sistema detecta e exibe o alerta de cliente inativo com proposta de reativação
    await waitFor(() => {
      expect(screen.getByTestId('alert-inactive-patient')).toBeInTheDocument();
    });
    expect(screen.getByTestId('alert-inactive-patient')).toHaveTextContent('Fabiana Rossi');

    // 4. Clica em "Reativar Cadastro"
    await user.click(screen.getByTestId('btn-reactivate-from-modal'));

    // 5. Verifica que o paciente foi reativado e o callback chamado
    await waitFor(() => {
      expect(createdOrReactivated).not.toBeNull();
      expect(isClosed).toBe(true);
    });
    expect(createdOrReactivated?.id).toBe(inactive.id);
    expect(createdOrReactivated?.is_active).toBe(true);

    const inDb = await db.patients.get(inactive.id);
    expect(inDb?.is_active).toBe(true);
    expect(inDb?.deleted_at).toBeNull();
  });

  it('AC-250: Validação de WhatsApp com proposta de reativação no cadastro rápido da agenda (InlinePatientForm) @spec:AC-250', async () => {
    const user = userEvent.setup();

    // 1. Cadastra cliente inativo
    const inactive = await repo.createPatient({
      tenant_id: tenantId,
      name: 'Gabriel Medina',
      whatsapp: '11977775544',
    });
    await repo.deletePatient(inactive.id);

    let selectedPatient: LocalPatient | null = null;

    render(
      <InlinePatientForm
        tenantId={tenantId}
        patientRepo={repo}
        selectedPatient={null}
        onSelectPatient={(p) => {
          selectedPatient = p;
        }}
      />
    );

    // 2. Abre o cadastro rápido inline
    const searchInput = screen.getByLabelText(/Buscar paciente/i);
    await user.type(searchInput, 'Gabriel Medina');

    const btnNew = await screen.findByTestId('btn-open-inline-new-patient');
    await user.click(btnNew);

    // 3. Preenche WhatsApp do inativo
    const phoneInput = screen.getByLabelText(/WhatsApp com DDD/i);
    await user.type(phoneInput, '11977775544');

    // Clica em Salvar Paciente
    await user.click(screen.getByTestId('btn-save-inline-patient'));

    // 4. Sistema detecta que é inativo e exibe o alerta com botão de reativação
    await waitFor(() => {
      expect(screen.getByTestId('inline-inactive-patient-alert')).toBeInTheDocument();
    });
    expect(screen.getByTestId('inline-inactive-patient-alert')).toHaveTextContent('Gabriel Medina');

    // 5. Clica em "Reativar e Selecionar"
    await user.click(screen.getByTestId('btn-inline-reactivate-patient'));

    // 6. Confirma que foi selecionado e reativado no banco
    await waitFor(() => {
      expect(selectedPatient).not.toBeNull();
    });
    expect(selectedPatient?.id).toBe(inactive.id);
    expect(selectedPatient?.is_active).toBe(true);

    const inDb = await db.patients.get(inactive.id);
    expect(inDb?.is_active).toBe(true);
    expect(inDb?.deleted_at).toBeNull();
  });
});

