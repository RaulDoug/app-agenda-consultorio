/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { CliniAssistLocalDB } from '../../../db/local-db';
import { ProcedureLocalRepository } from '../../../db/repositories/procedure-local-repository';
import { InlineProcedureForm } from '../components/InlineProcedureForm';
import { LocalProcedure } from '../../../db/types';

describe('InlineProcedureForm — Custo Operacional no Cadastro Rápido de Procedimento', () => {
  let db: CliniAssistLocalDB;
  let repo: ProcedureLocalRepository;
  const tenantId = 'tenant-test-inline-cost';

  beforeEach(async () => {
    db = new CliniAssistLocalDB(`test_inline_${Date.now()}_${Math.random()}`);
    await db.open();
    repo = new ProcedureLocalRepository(db);
  });

  it('AC-242: Preenchimento de custo no cadastro rápido direto pela tela de agendamento @spec:AC-242', async () => {
    let currentSelection: LocalProcedure[] = [];
    const handleChangeSelection = vi.fn((procs: LocalProcedure[]) => {
      currentSelection = procs;
    });

    render(
      <InlineProcedureForm
        tenantId={tenantId}
        procedureRepo={repo}
        selectedProcedureIds={[]}
        onChangeSelection={handleChangeSelection}
      />
    );

    // 1. Toca no botão de adicionar novo procedimento
    const btnNew = await screen.findByTestId('btn-add-inline-procedure');
    fireEvent.click(btnNew);

    // 2. Verifica presença dos campos, inclusive o campo de custo
    const nameInput = screen.getByTestId('input-inline-procedure-name');
    const durationInput = screen.getByTestId('input-inline-procedure-duration');
    const priceInput = screen.getByTestId('input-inline-procedure-price');
    const costInput = screen.getByTestId('input-inline-procedure-cost');

    expect(nameInput).toBeInTheDocument();
    expect(costInput).toBeInTheDocument();

    // 3. Preenche os dados com nome, duração, preço de 300,00 e custo de 65,00
    fireEvent.change(nameInput, { target: { value: 'Extração de Siso' } });
    fireEvent.change(durationInput, { target: { value: '60' } });
    fireEvent.change(priceInput, { target: { value: '300.00' } });
    fireEvent.change(costInput, { target: { value: '65.00' } });

    // 4. Salva o procedimento inline
    const btnSave = screen.getByTestId('btn-save-inline-procedure');
    fireEvent.click(btnSave);

    // 5. Verifica que o callback foi acionado com o procedimento criado contendo cost_cents: 6500
    await waitFor(() => {
      expect(handleChangeSelection).toHaveBeenCalled();
      const created = currentSelection.find((p) => p.name === 'Extração de Siso');
      expect(created).toBeDefined();
      expect(created?.cost_cents).toBe(6500);
      expect(created?.default_duration_minutes).toBe(60);
      expect(created?.default_price_cents).toBe(30000);
    });

    // 6. Verifica persistência no Dexie e na Outbox
    const procsInDb = await db.procedures.where('tenant_id').equals(tenantId).toArray();
    const procInDb = procsInDb.find((p) => p.name === 'Extração de Siso');
    expect(procInDb).toBeDefined();
    expect(procInDb?.cost_cents).toBe(6500);

    const mutations = await db.sync_outbox.where('record_id').equals(procInDb!.id).toArray();
    expect(mutations.length).toBeGreaterThan(0);
    expect(mutations[0].operation).toBe('INSERT');
    expect(mutations[0].payload.cost_cents).toBe(6500);
  });
});
