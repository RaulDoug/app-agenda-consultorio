/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

  it('AC-250: Validação imediata de WhatsApp ao preencher contato e preservação do nome original no CreatePatientModal @spec:AC-250', async () => {
    const user = userEvent.setup();

    // 1. Cadastra cliente inativo e um cliente ativo
    const inactive = await repo.createPatient({
      tenant_id: tenantId,
      name: 'Fabiana Rossi',
      whatsapp: '11988887766',
    });
    await repo.deletePatient(inactive.id);

    await repo.createPatient({
      tenant_id: tenantId,
      name: 'Rodrigo Faro Ativo',
      whatsapp: '11955554444',
    });

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

    // 2. Digita outro nome no campo Nome Completo e preenche o WhatsApp de cliente ativo
    await user.type(screen.getByLabelText(/Nome Completo/i), 'Outro Nome Qualquer');
    const phoneInput = screen.getByLabelText(/WhatsApp/i);
    await user.type(phoneInput, '11955554444');

    // Aviso de cliente ativo deve aparecer IMEDIATAMENTE sem clicar em Salvar
    await waitFor(() => {
      expect(screen.getByTestId('alert-error-patient')).toBeInTheDocument();
    });
    expect(screen.getByTestId('alert-error-patient')).toHaveTextContent('Rodrigo Faro Ativo');

    // 3. Troca o WhatsApp para o número do cliente INATIVO
    await user.clear(phoneInput);
    await user.type(phoneInput, '11988887766');

    // Alerta de cliente inativo deve aparecer IMEDIATAMENTE sem clicar em Salvar
    await waitFor(() => {
      expect(screen.getByTestId('alert-inactive-patient')).toBeInTheDocument();
    });
    expect(screen.getByTestId('alert-inactive-patient')).toHaveTextContent('Fabiana Rossi');

    // 4. Clica em "Reativar Cadastro"
    await user.click(screen.getByTestId('btn-reactivate-from-modal'));

    // 5. Verifica que o paciente foi reativado mantendo o NOME ORIGINAL ("Fabiana Rossi" e não "Outro Nome Qualquer")
    await waitFor(() => {
      expect(createdOrReactivated).not.toBeNull();
      expect(isClosed).toBe(true);
    });
    expect(createdOrReactivated?.id).toBe(inactive.id);
    expect(createdOrReactivated?.is_active).toBe(true);
    expect(createdOrReactivated?.name).toBe('Fabiana Rossi');

    const inDb = await db.patients.get(inactive.id);
    expect(inDb?.is_active).toBe(true);
    expect(inDb?.deleted_at).toBeNull();
    expect(inDb?.name).toBe('Fabiana Rossi');
  });

  it('AC-250: Detecção imediata na barra de pesquisa da agenda e no campo de contato mantendo nome original (InlinePatientForm) @spec:AC-250', async () => {
    const user = userEvent.setup();

    // 1. Cadastra dois clientes inativos
    const inactiveSearch = await repo.createPatient({
      tenant_id: tenantId,
      name: 'Gabriel Medina',
      whatsapp: '11977775544',
    });
    await repo.deletePatient(inactiveSearch.id);

    const inactiveForm = await repo.createPatient({
      tenant_id: tenantId,
      name: 'Beatriz Haddad',
      whatsapp: '11966663322',
    });
    await repo.deletePatient(inactiveForm.id);

    let selectedPatient: LocalPatient | null = null;

    const { rerender } = render(
      <InlinePatientForm
        tenantId={tenantId}
        patientRepo={repo}
        selectedPatient={null}
        onSelectPatient={(p) => {
          selectedPatient = p;
        }}
      />
    );

    // 2. Cenário A: Digita o número diretamente na barra de pesquisa da tela de agendamento
    const searchInput = screen.getByLabelText(/Buscar paciente/i);
    await user.type(searchInput, '11977775544');

    // Deve informar imediatamente na barra de pesquisa que o cadastro vinculado está inativo e perguntar se quer reativar
    await waitFor(() => {
      expect(screen.getByTestId('inline-inactive-patient-alert')).toBeInTheDocument();
    });
    expect(screen.getByTestId('inline-inactive-patient-alert')).toHaveTextContent('Gabriel Medina');

    // Clica em "Reativar e Selecionar" direto da busca
    await user.click(screen.getByTestId('btn-inline-reactivate-patient'));

    await waitFor(() => {
      expect(selectedPatient).not.toBeNull();
    });
    expect(selectedPatient?.id).toBe(inactiveSearch.id);
    expect(selectedPatient?.name).toBe('Gabriel Medina');
    expect(selectedPatient?.is_active).toBe(true);

    // 3. Cenário B: Abre cadastro rápido digitando outro nome e preenche o WhatsApp de outro cliente inativo
    selectedPatient = null;
    rerender(
      <InlinePatientForm
        tenantId={tenantId}
        patientRepo={repo}
        selectedPatient={null}
        onSelectPatient={(p) => {
          selectedPatient = p;
        }}
      />
    );

    const searchInput2 = screen.getByLabelText(/Buscar paciente/i);
    await user.clear(searchInput2);
    await user.type(searchInput2, 'Nome Temporario Digitado');

    const btnNew = await screen.findByTestId('btn-open-inline-new-patient');
    await user.click(btnNew);

    // Preenche o campo de contato (WhatsApp com DDD) sem clicar em Salvar
    const phoneInput = screen.getByLabelText(/WhatsApp com DDD/i);
    await user.type(phoneInput, '11966663322');

    // Alerta de cliente inativo aparece IMEDIATAMENTE ao preencher o campo de contato
    await waitFor(() => {
      expect(screen.getByTestId('inline-inactive-patient-alert')).toBeInTheDocument();
    });
    expect(screen.getByTestId('inline-inactive-patient-alert')).toHaveTextContent('Beatriz Haddad');

    // Clica em "Reativar e Selecionar"
    await user.click(screen.getByTestId('btn-inline-reactivate-patient'));

    // Verifica que manteve o nome original "Beatriz Haddad" e não "Nome Temporario Digitado"
    await waitFor(() => {
      expect(selectedPatient).not.toBeNull();
    });
    expect(selectedPatient?.id).toBe(inactiveForm.id);
    expect(selectedPatient?.name).toBe('Beatriz Haddad');

    const inDb = await db.patients.get(inactiveForm.id);
    expect(inDb?.is_active).toBe(true);
    expect(inDb?.name).toBe('Beatriz Haddad');
  });
});
