/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { CliniAssistLocalDB } from '../../../db/local-db';
import { ProcedureLocalRepository } from '../../../db/repositories/procedure-local-repository';
import App from '../../../App';
import { ProcedureList } from '../components/ProcedureList';
import { ProcedureFormModal } from '../components/ProcedureFormModal';
import { ConfirmDeleteProcedureModal } from '../components/ConfirmDeleteProcedureModal';
import { LocalProcedure } from '../../../db/types';

describe('Feature: Gestão do Catálogo de Procedimentos e Serviços (F-06)', () => {
  let db: CliniAssistLocalDB;
  let repo: ProcedureLocalRepository;
  const tenantId = 'tenant-proc-ui-test';

  beforeEach(async () => {
    db = new CliniAssistLocalDB(`test_proc_ui_${Date.now()}_${Math.random()}`);
    await db.open();
    repo = new ProcedureLocalRepository(db);
  });

  it('AC-238: Acesso à tela de procedimentos pela seção Mais e navegação consistente @spec:AC-238', async () => {
    // 1. Cria procedimentos de teste no banco
    await repo.createProcedure({
      tenant_id: tenantId,
      name: 'Consulta Inicial',
      default_duration_minutes: 30,
      default_price_cents: 15000,
      cost_cents: 2000,
    });

    render(<App db={db} tenantId={tenantId} initialTab="mais" />);

    // 2. Verifica presença do card "Procedimentos & Serviços" no hub Mais
    const cardProc = await screen.findByTestId('more-card-procedimentos');
    expect(cardProc).toBeInTheDocument();
    expect(cardProc).toHaveTextContent('Procedimentos & Serviços');

    // 3. Clica no card para navegar para a tela de Procedimentos
    fireEvent.click(cardProc);

    // 4. A tela de procedimentos deve ser exibida com catálogo e botões
    await waitFor(() => {
      const container = screen.getByTestId('procedure-list-container');
      expect(container).toBeInTheDocument();
      expect(screen.getByTestId('input-search-procedures')).toBeInTheDocument();
      expect(screen.getByTestId('btn-new-procedure-top')).toBeInTheDocument();
    });

    // 5. O tab de navegação móvel "Mais" deve permanecer ativado/destacado
    const maisTab = screen.getByTestId('nav-tab-mais');
    expect(maisTab).toHaveClass('text-teal-700');
  });

  it('AC-239: Visualização, contadores e busca reativa por nome de procedimentos @spec:AC-239', async () => {
    const mockProcedures: LocalProcedure[] = [
      {
        id: 'proc-1',
        tenant_id: tenantId,
        name: 'Restauração em Resina Composta',
        default_duration_minutes: 45,
        default_price_cents: 18000,
        cost_cents: 3500,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'proc-2',
        tenant_id: tenantId,
        name: 'Profilaxia e Aplicação de Flúor',
        default_duration_minutes: 30,
        default_price_cents: 12000,
        cost_cents: 2000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'proc-3',
        tenant_id: tenantId,
        name: 'Exodontia de Terceiro Molar',
        default_duration_minutes: 60,
        default_price_cents: 35000,
        cost_cents: 5000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    render(
      <ProcedureList
        tenantId={tenantId}
        procedures={mockProcedures}
        onOpenCreateModal={() => {}}
        onEditProcedure={() => {}}
        onDeleteProcedure={() => {}}
      />
    );

    // 1. Contador exibe 3 procedimentos
    const countBadge = screen.getByTestId('procedure-count');
    expect(countBadge).toHaveTextContent('3');

    // 2. Verifica dados financeiros e margens renderizados no card
    const cardResina = screen.getByTestId('procedure-card-proc-1');
    expect(cardResina).toHaveTextContent('Restauração em Resina Composta');
    expect(screen.getByTestId('badge-duration-proc-1')).toHaveTextContent('45 min');
    expect(screen.getByTestId('procedure-price-proc-1')).toHaveTextContent('R$ 180,00');
    expect(screen.getByTestId('procedure-cost-proc-1')).toHaveTextContent('R$ 35,00');
    expect(screen.getByTestId('procedure-margin-proc-1')).toHaveTextContent('R$ 145,00');

    // 3. Busca reativa: filtra digitando "Profilaxia"
    const searchInput = screen.getByTestId('input-search-procedures');
    fireEvent.change(searchInput, { target: { value: 'profilaxia' } });

    // Apenas profilaxia deve permanecer visível
    expect(screen.getByTestId('procedure-card-proc-2')).toBeInTheDocument();
    expect(screen.queryByTestId('procedure-card-proc-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('procedure-card-proc-3')).not.toBeInTheDocument();
    expect(screen.getByTestId('procedure-count')).toHaveTextContent('1');
  });

  it('AC-240: Cadastro e edição de procedimentos com validação de regras de negócio @spec:AC-240', async () => {
    let savedProc: LocalProcedure | null = null;
    const handleSaved = (p: LocalProcedure) => {
      savedProc = p;
    };

    const { rerender } = render(
      <ProcedureFormModal
        isOpen={true}
        onClose={() => {}}
        tenantId={tenantId}
        procedureRepo={repo}
        procedureToEdit={null}
        onProcedureSaved={handleSaved}
      />
    );

    // 1. Validação de duração inválida (duração 0)
    const nameInput = screen.getByTestId('input-procedure-name');
    const durationInput = screen.getByTestId('input-procedure-duration');
    const priceInput = screen.getByTestId('input-procedure-price');
    const costInput = screen.getByTestId('input-procedure-cost');
    const btnSave = screen.getByTestId('btn-save-procedure');

    fireEvent.change(nameInput, { target: { value: 'Clareamento Dental' } });
    fireEvent.change(durationInput, { target: { value: '0' } });
    fireEvent.click(btnSave);

    expect(await screen.findByTestId('procedure-form-error')).toHaveTextContent(
      'A duração padrão deve ser maior que zero minutos.'
    );

    // 2. Preenchimento válido com nome, duração de 60m, preço R$ 400,00 e custo R$ 80,00
    fireEvent.change(durationInput, { target: { value: '60' } });
    fireEvent.change(priceInput, { target: { value: '400.00' } });
    fireEvent.change(costInput, { target: { value: '80.00' } });

    // Verifica preview da margem estimada: R$ 320,00
    expect(screen.getByTestId('procedure-margin-preview')).toHaveTextContent('R$ 320,00');

    fireEvent.click(btnSave);

    await waitFor(() => {
      expect(savedProc).not.toBeNull();
      expect(savedProc?.name).toBe('Clareamento Dental');
      expect(savedProc?.default_duration_minutes).toBe(60);
      expect(savedProc?.default_price_cents).toBe(40000);
      expect(savedProc?.cost_cents).toBe(8000);
    });

    // 3. Testa Edição do procedimento salvo
    rerender(
      <ProcedureFormModal
        isOpen={true}
        onClose={() => {}}
        tenantId={tenantId}
        procedureRepo={repo}
        procedureToEdit={savedProc}
        onProcedureSaved={handleSaved}
      />
    );

    expect(screen.getByTestId('procedure-modal-title')).toHaveTextContent('Editar Procedimento');
    const editPriceInput = screen.getByTestId('input-procedure-price');
    fireEvent.change(editPriceInput, { target: { value: '450.00' } });
    fireEvent.click(screen.getByTestId('btn-save-procedure'));

    await waitFor(() => {
      expect(savedProc?.default_price_cents).toBe(45000);
    });
  });

  it('AC-241: Exclusão com soft-delete e modal de confirmação de segurança @spec:AC-241', async () => {
    // 1. Cadastra procedimento no banco
    const proc = await repo.createProcedure({
      tenant_id: tenantId,
      name: 'Procedimento Para Desativar',
      default_duration_minutes: 30,
      default_price_cents: 10000,
      cost_cents: 1500,
    });

    let confirmedProc: LocalProcedure | null = null;
    let isDone = false;
    render(
      <ConfirmDeleteProcedureModal
        isOpen={true}
        procedure={proc}
        onClose={() => {}}
        onConfirm={async (p) => {
          confirmedProc = p;
          await repo.deleteProcedure(p.id);
          isDone = true;
        }}
      />
    );

    // 2. Alerta de segurança explícito visível
    const modal = screen.getByTestId('confirm-delete-procedure-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveTextContent('Procedimento Para Desativar');
    expect(modal).toHaveTextContent('Consultas anteriores e relatórios financeiros manterão os registros');

    // 3. Confirma exclusão
    const btnConfirm = screen.getByTestId('btn-confirm-delete-procedure');
    fireEvent.click(btnConfirm);

    await waitFor(() => {
      expect(isDone).toBe(true);
    });

    // 4. Verifica soft-delete no Dexie (is_active = false, deleted_at preenchido)
    const inDb = await db.procedures.get(proc.id);
    expect(inDb?.is_active).toBe(false);
    expect(inDb?.deleted_at).toBeDefined();

    // 5. Verifica que outbox contém mutação DELETE
    const mutations = await db.sync_outbox
      .where('record_id')
      .equals(proc.id)
      .filter((m) => m.operation === 'DELETE')
      .toArray();
    expect(mutations).toHaveLength(1);
  });

  it('AC-244: Filtro de procedimentos inativos e reativação em um clique @spec:AC-244', async () => {
    const mockProcedures: LocalProcedure[] = [
      {
        id: 'proc-active-1',
        tenant_id: tenantId,
        name: 'Consulta de Rotina',
        default_duration_minutes: 30,
        default_price_cents: 10000,
        cost_cents: 2000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'proc-active-2',
        tenant_id: tenantId,
        name: 'Limpeza Dental',
        default_duration_minutes: 40,
        default_price_cents: 15000,
        cost_cents: 2500,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'proc-inactive-1',
        tenant_id: tenantId,
        name: 'Clareamento Antigo',
        default_duration_minutes: 60,
        default_price_cents: 50000,
        cost_cents: 10000,
        is_active: false,
        deleted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let reactivatedProc: LocalProcedure | null = null;
    const handleReactivate = (proc: LocalProcedure) => {
      reactivatedProc = proc;
    };

    render(
      <ProcedureList
        tenantId={tenantId}
        procedures={mockProcedures}
        onOpenCreateModal={() => {}}
        onEditProcedure={() => {}}
        onDeleteProcedure={() => {}}
        onReactivateProcedure={handleReactivate}
      />
    );

    // 1. Contadores nas abas de filtro: Ativos (2), Inativos (1), Todos (3)
    const tabActive = screen.getByTestId('filter-proc-active');
    const tabInactive = screen.getByTestId('filter-proc-inactive');
    const tabAll = screen.getByTestId('filter-proc-all');

    expect(tabActive).toHaveTextContent('Ativos (2)');
    expect(tabInactive).toHaveTextContent('Inativos (1)');
    expect(tabAll).toHaveTextContent('Todos (3)');

    // 2. Por padrão, aba 'Ativos' exibe apenas os 2 ativos
    expect(screen.getByTestId('procedure-card-proc-active-1')).toBeInTheDocument();
    expect(screen.getByTestId('procedure-card-proc-active-2')).toBeInTheDocument();
    expect(screen.queryByTestId('procedure-card-proc-inactive-1')).not.toBeInTheDocument();

    // 3. Seleciona aba 'Inativos'
    fireEvent.click(tabInactive);

    // Agora apenas o inativo é exibido
    expect(screen.queryByTestId('procedure-card-proc-active-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('procedure-card-proc-active-2')).not.toBeInTheDocument();
    const inactiveCard = screen.getByTestId('procedure-card-proc-inactive-1');
    expect(inactiveCard).toBeInTheDocument();

    // Deve exibir badge "Inativo" e botão "Reativar"
    expect(screen.getByTestId('badge-inactive-proc-inactive-1')).toHaveTextContent('Inativo');
    const btnReactivate = screen.getByTestId('btn-reactivate-proc-inactive-1');
    expect(btnReactivate).toBeInTheDocument();
    expect(btnReactivate).toHaveTextContent('Reativar');

    // 4. Seleciona aba 'Todos'
    fireEvent.click(tabAll);
    expect(screen.getByTestId('procedure-card-proc-active-1')).toBeInTheDocument();
    expect(screen.getByTestId('procedure-card-proc-active-2')).toBeInTheDocument();
    expect(screen.getByTestId('procedure-card-proc-inactive-1')).toBeInTheDocument();

    // 5. Clica no botão 'Reativar'
    fireEvent.click(btnReactivate);
    expect(reactivatedProc).not.toBeNull();
    expect((reactivatedProc as any)?.id).toBe('proc-inactive-1');
  });
});

