/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocalPatient } from '../../../db/types';
import { PatientList } from '../components/PatientList';

describe('Feature: filtro-reativacao-clientes — UI PatientList e PatientCard', () => {
  const tenantId = 'tenant-filter-ui-test';

  const mockPatients: LocalPatient[] = [
    {
      id: 'patient-act-1',
      tenant_id: tenantId,
      name: 'Ana Paula Barbosa',
      whatsapp: '11988881111',
      is_active: true,
      created_at: '2026-01-01T10:00:00Z',
      updated_at: '2026-01-01T10:00:00Z',
      deleted_at: null,
    },
    {
      id: 'patient-act-2',
      tenant_id: tenantId,
      name: 'Carlos Alberto Ferreira',
      whatsapp: '11977772222',
      is_active: true,
      created_at: '2026-01-02T10:00:00Z',
      updated_at: '2026-01-02T10:00:00Z',
      deleted_at: null,
    },
    {
      id: 'patient-inact-1',
      tenant_id: tenantId,
      name: 'Bruna Marquezine',
      whatsapp: '11966663333',
      is_active: false,
      deleted_at: '2026-02-01T10:00:00Z',
      created_at: '2026-01-03T10:00:00Z',
      updated_at: '2026-02-01T10:00:00Z',
    },
  ];

  it('AC-246: Filtro de status na tela de clientes com contadores e busca contextual @spec:AC-246', async () => {
    render(
      <PatientList
        tenantId={tenantId}
        patients={mockPatients}
        appointments={[]}
        transactions={[]}
      />
    );

    // 1. Pílulas de filtro com contadores corretos: Ativos (2), Inativos (1), Todos (3)
    const btnActive = screen.getByTestId('filter-patient-active');
    const btnInactive = screen.getByTestId('filter-patient-inactive');
    const btnAll = screen.getByTestId('filter-patient-all');

    expect(btnActive).toHaveTextContent('Ativos (2)');
    expect(btnInactive).toHaveTextContent('Inativos (1)');
    expect(btnAll).toHaveTextContent('Todos (3)');

    // 2. Por padrão, aba 'Ativos' exibe os 2 ativos e oculta o inativo
    expect(screen.getByTestId('patient-card-patient-act-1')).toBeInTheDocument();
    expect(screen.getByTestId('patient-card-patient-act-2')).toBeInTheDocument();
    expect(screen.queryByTestId('patient-card-patient-inact-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('patient-count')).toHaveTextContent('2');

    // 3. Alterna para 'Inativos'
    fireEvent.click(btnInactive);
    expect(screen.queryByTestId('patient-card-patient-act-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('patient-card-patient-act-2')).not.toBeInTheDocument();
    expect(screen.getByTestId('patient-card-patient-inact-1')).toBeInTheDocument();
    expect(screen.getByTestId('patient-count')).toHaveTextContent('1');

    // 4. Alterna para 'Todos'
    fireEvent.click(btnAll);
    expect(screen.getByTestId('patient-card-patient-act-1')).toBeInTheDocument();
    expect(screen.getByTestId('patient-card-patient-act-2')).toBeInTheDocument();
    expect(screen.getByTestId('patient-card-patient-inact-1')).toBeInTheDocument();
    expect(screen.getByTestId('patient-count')).toHaveTextContent('3');

    // 5. Busca contextual com termo textual
    const inputSearch = screen.getByTestId('input-search-patients');
    fireEvent.change(inputSearch, { target: { value: 'Carlos' } });
    expect(screen.queryByTestId('patient-card-patient-act-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('patient-card-patient-act-2')).toBeInTheDocument();
    expect(screen.queryByTestId('patient-card-patient-inact-1')).not.toBeInTheDocument();
  });

  it('AC-247: Identificação visual de clientes inativos e reativação direta em 1 toque @spec:AC-247', async () => {
    let reactivatedPatient: LocalPatient | null = null;
    const handleReactivate = (p: LocalPatient) => {
      reactivatedPatient = p;
    };

    render(
      <PatientList
        tenantId={tenantId}
        patients={mockPatients}
        appointments={[]}
        transactions={[]}
        onReactivatePatient={handleReactivate}
      />
    );

    // Seleciona aba Inativos
    fireEvent.click(screen.getByTestId('filter-patient-inactive'));

    // Verifica card de cliente inativo
    const inactiveCard = screen.getByTestId('patient-card-patient-inact-1');
    expect(inactiveCard).toBeInTheDocument();

    // Badge "Inativo"
    const badge = screen.getByTestId('badge-inactive-patient-inact-1');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Inativo');

    // Botão de ação direta "Reativar"
    const btnReactivate = screen.getByTestId('btn-reactivate-patient-patient-inact-1');
    expect(btnReactivate).toBeInTheDocument();
    expect(btnReactivate).toHaveTextContent('Reativar');

    // Clica no botão "Reativar"
    fireEvent.click(btnReactivate);
    expect(reactivatedPatient).not.toBeNull();
    expect((reactivatedPatient as any)?.id).toBe('patient-inact-1');
  });
});
