/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CliniAssistLocalDB } from '../../../db/local-db';
import { PatientLocalRepository } from '../../../db/repositories/patient-local-repository';
import { InlinePatientForm } from '../components/InlinePatientForm';
import { LocalPatient } from '../../../db/types';

describe('Feature: filtro-reativacao-clientes — Busca Dinâmica e Rolagem de Pacientes na Agenda', () => {
  let db: CliniAssistLocalDB;
  let repo: PatientLocalRepository;
  const tenantId = 'tenant-busca-dinamica-test';

  beforeEach(async () => {
    db = new CliniAssistLocalDB(`test-busca-dinamica-${Date.now()}-${Math.random()}`);
    await db.open();
    repo = new PatientLocalRepository(db);
  });

  it('AC-251: Listagem alfabética com paginação dinâmica por scroll no formulário de agendamento @spec:AC-251', async () => {
    // 1. Cadastra 25 pacientes para testar ordenação e rolagem (além do antigo limite fixo de 5)
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXY'.split('');
    for (let i = 0; i < alphabet.length; i++) {
      const letter = alphabet[i];
      await repo.createPatient({
        tenant_id: tenantId,
        name: `Paciente ${letter}`,
        whatsapp: `119999900${i.toString().padStart(2, '0')}`,
      });
    }

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

    // 2. Aguarda carregamento inicial
    await waitFor(() => {
      expect(screen.getByTestId('inline-patient-results-card')).toBeInTheDocument();
    });

    // 3. Verifica indicador de quantidade inicial (15 de 25) — superando o limite antigo de 5
    const indicator = screen.getByTestId('inline-patient-count-indicator');
    expect(indicator).toHaveTextContent('Exibindo 15 de 25 pacientes');

    // 4. Confirma ordenação alfabética: primeiro é "Paciente A", segundo é "Paciente B"
    const buttons = screen.getAllByTestId(/^btn-select-patient-/);
    expect(buttons.length).toBe(15);
    expect(buttons[0]).toHaveTextContent('Paciente A');
    expect(buttons[1]).toHaveTextContent('Paciente B');

    // 5. Simula rolagem para carregar mais itens no jsdom
    const scrollContainer = screen.getByTestId('inline-patient-scroll-container');
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 500, configurable: true, writable: true });
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 200, configurable: true, writable: true });
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 700, configurable: true, writable: true });

    fireEvent.scroll(scrollContainer);

    // 6. Verifica que novos pacientes foram carregados dinamicamente
    await waitFor(() => {
      expect(screen.getByTestId('inline-patient-count-indicator')).toHaveTextContent(
        'Exibindo 25 de 25 pacientes'
      );
    });

    const updatedButtons = screen.getAllByTestId(/^btn-select-patient-/);
    expect(updatedButtons.length).toBe(25);
    expect(updatedButtons[24]).toHaveTextContent('Paciente Y');

    // 7. Testa filtragem textual dinâmica
    const input = screen.getByLabelText(/Buscar paciente/i);
    fireEvent.change(input, { target: { value: 'Paciente M' } });

    await waitFor(() => {
      expect(screen.getByTestId('inline-patient-count-indicator')).toHaveTextContent(
        'Exibindo 1 de 1 pacientes'
      );
    });
    expect(screen.getByText('Paciente M')).toBeInTheDocument();

    // 8. Clica para selecionar o paciente
    fireEvent.click(screen.getByText('Paciente M'));
    expect(selectedPatient).not.toBeNull();
    expect((selectedPatient as any)?.name).toBe('Paciente M');
  });
});
