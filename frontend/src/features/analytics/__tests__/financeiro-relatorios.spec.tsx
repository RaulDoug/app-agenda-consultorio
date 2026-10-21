/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CliniAssistLocalDB } from '../../../db/local-db';
import { FinancialLocalRepository } from '../../../db/repositories/financial-local-repository';
import { FinancialLedger } from '../components/FinancialLedger';
import { ReceivablesList } from '../components/ReceivablesList';
import { QuickExpenseModal } from '../../checkout/components/QuickExpenseModal';
import { ReportsView } from '../components/ReportsView';
import { PatientFinancialDrawer } from '../../patients/components/PatientFinancialDrawer';
import { LocalFinancialTransaction, LocalPatient, LocalAppointment } from '../../../db/types';
import { ReportsApiClient } from '../../../services/reports-api';

describe('Feature financeiro-frontend-relatorios — TDD Spec Anchor', () => {
  let testDb: CliniAssistLocalDB;
  let financialRepo: FinancialLocalRepository;
  const tenantId = 'tenant-test-financeiro';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-fin-${Date.now()}-${Math.random()}`);
    await testDb.open();
    financialRepo = new FinancialLocalRepository(testDb);
  });

  // AC-178
  it('AC-178: Extrato de transações em lista vertical responsiva com filtragem e exportação @spec:AC-178', async () => {
    const transactions: LocalFinancialTransaction[] = [
      {
        id: 'tx-1',
        tenant_id: tenantId,
        appointment_id: 'app-1',
        type: 'INCOME',
        category: 'ATENDIMENTO',
        description: 'Limpeza Dental e Profilaxia',
        amount_cents: 20000,
        payment_method: 'PIX',
        status: 'PAID',
        due_date: '2026-10-20',
        payment_date: '2026-10-20',
        installment_number: 1,
        total_installments: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tx-2',
        tenant_id: tenantId,
        appointment_id: null,
        type: 'EXPENSE',
        category: 'MATERIAIS',
        description: 'Compra de luvas e gaze',
        amount_cents: 8500,
        payment_method: 'DINHEIRO',
        status: 'PAID',
        due_date: '2026-10-21',
        payment_date: '2026-10-21',
        installment_number: 1,
        total_installments: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tx-3',
        tenant_id: tenantId,
        appointment_id: 'app-2',
        type: 'INCOME',
        category: 'ATENDIMENTO',
        description: 'Tratamento Canal Parcela 1/2',
        amount_cents: 45000,
        payment_method: 'PIX',
        status: 'PENDING',
        due_date: '2026-10-25',
        payment_date: null,
        installment_number: 1,
        total_installments: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    render(<FinancialLedger transactions={transactions} />);

    // 1. Verifica renderização inicial (Todas)
    expect(screen.getByText('Limpeza Dental e Profilaxia')).toBeInTheDocument();
    expect(screen.getByText('Compra de luvas e gaze')).toBeInTheDocument();
    expect(screen.getByText('Tratamento Canal Parcela 1/2')).toBeInTheDocument();

    // 2. Filtro por Receitas
    fireEvent.click(screen.getByTestId('filter-tab-income'));
    expect(screen.getByText('Limpeza Dental e Profilaxia')).toBeInTheDocument();
    expect(screen.queryByText('Compra de luvas e gaze')).not.toBeInTheDocument();

    // 3. Filtro por Despesas
    fireEvent.click(screen.getByTestId('filter-tab-expense'));
    expect(screen.queryByText('Limpeza Dental e Profilaxia')).not.toBeInTheDocument();
    expect(screen.getByText('Compra de luvas e gaze')).toBeInTheDocument();

    // 4. Filtro por Pendentes
    fireEvent.click(screen.getByTestId('filter-tab-pending'));
    expect(screen.getByText('Tratamento Canal Parcela 1/2')).toBeInTheDocument();
    expect(screen.queryByText('Compra de luvas e gaze')).not.toBeInTheDocument();

    // 5. Busca textual
    fireEvent.click(screen.getByTestId('filter-tab-all'));
    const searchInput = screen.getByTestId('input-ledger-search');
    fireEvent.change(searchInput, { target: { value: 'luvas' } });
    expect(screen.getByText('Compra de luvas e gaze')).toBeInTheDocument();
    expect(screen.queryByText('Limpeza Dental e Profilaxia')).not.toBeInTheDocument();

    // 6. Exportação CSV
    const createObjectURLMock = vi.fn(() => 'blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    const clickMock = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = origCreateElement(tagName);
      if (tagName.toLowerCase() === 'a') {
        el.click = clickMock;
      }
      return el;
    });

    const exportBtn = screen.getByTestId('btn-export-csv');
    fireEvent.click(exportBtn);
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
  });

  // AC-179
  it('AC-179: Seleção múltipla com barra de ação inferior e baixa em lote via Bottom Sheet @spec:AC-179', async () => {
    // Insere parcelas no banco
    const today = new Date().toISOString().split('T')[0];
    const tx1: LocalFinancialTransaction = {
      id: 'tx-p1',
      tenant_id: tenantId,
      appointment_id: 'app-p1',
      type: 'INCOME',
      category: 'ATENDIMENTO',
      description: 'Clareamento Parcela 1/2',
      amount_cents: 15000,
      payment_method: 'PIX',
      status: 'PENDING',
      due_date: today,
      payment_date: null,
      installment_number: 1,
      total_installments: 2,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const tx2: LocalFinancialTransaction = {
      id: 'tx-p2',
      tenant_id: tenantId,
      appointment_id: 'app-p2',
      type: 'INCOME',
      category: 'ATENDIMENTO',
      description: 'Restauração Parcela 2/2',
      amount_cents: 25000,
      payment_method: 'DINHEIRO',
      status: 'PENDING',
      due_date: today,
      payment_date: null,
      installment_number: 2,
      total_installments: 2,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await testDb.financial_transactions.bulkAdd([tx1, tx2]);

    const handleSettleBatchMock = vi.fn(async (ids, method, date) => {
      await financialRepo.settleBatch(ids, method, date);
    });

    render(
      <ReceivablesList
        transactions={[tx1, tx2]}
        onMarkPaid={vi.fn()}
        onSettleBatch={handleSettleBatchMock}
      />
    );

    // 1. Checkboxes individuais
    const cb1 = screen.getByTestId('checkbox-receivable-tx-p1');
    const cb2 = screen.getByTestId('checkbox-receivable-tx-p2');

    fireEvent.click(cb1);
    fireEvent.click(cb2);

    // 2. Barra de ação na zona do polegar deve estar visível com valor total R$ 400,00
    const actionBar = screen.getByTestId('batch-action-bar');
    expect(actionBar).toBeInTheDocument();
    expect(screen.getByText('2 selecionada(s)')).toBeInTheDocument();
    expect(screen.getByText('R$ 400.00')).toBeInTheDocument();

    // 3. Abre Bottom Sheet modal de baixa em lote
    const openBatchBtn = screen.getByTestId('btn-open-batch-settle');
    fireEvent.click(openBatchBtn);

    expect(screen.getByTestId('batch-settle-modal')).toBeInTheDocument();

    // 4. Seleciona forma de pagamento PIX e confirma
    fireEvent.click(screen.getByTestId('btn-method-pix'));
    fireEvent.click(screen.getByTestId('btn-confirm-batch-settle'));

    await waitFor(() => {
      expect(handleSettleBatchMock).toHaveBeenCalledWith(['tx-p1', 'tx-p2'], 'PIX', expect.any(String));
    });

    // 5. Confere no banco local Dexie se viraram PAID e enfileiraram outbox
    const updated1 = await testDb.financial_transactions.get('tx-p1');
    const updated2 = await testDb.financial_transactions.get('tx-p2');
    expect(updated1?.status).toBe('PAID');
    expect(updated2?.status).toBe('PAID');

    const outboxMutations = await testDb.sync_outbox.toArray();
    expect(outboxMutations.length).toBeGreaterThanOrEqual(2);
  });

  // AC-180
  it('AC-180: Seleção dinâmica de categorias de despesa com fallback offline @spec:AC-180', async () => {
    // Insere transações prévias com categorias personalizadas
    await testDb.financial_transactions.add({
      id: 'tx-cat-1',
      tenant_id: tenantId,
      type: 'EXPENSE',
      category: 'MARKETING',
      amount_cents: 10000,
      status: 'PAID',
      due_date: '2026-10-20',
      installment_number: 1,
      total_installments: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const onExpenseSavedMock = vi.fn();

    render(
      <QuickExpenseModal
        isOpen={true}
        tenantId={tenantId}
        onClose={vi.fn()}
        financialRepo={financialRepo}
        onExpenseSaved={onExpenseSavedMock}
      />
    );

    // 1. Aguarda carregamento dinâmico das categorias
    await waitFor(() => {
      expect(screen.getByTestId('btn-expense-cat-marketing')).toBeInTheDocument();
    });

    // 2. Preenche valor e seleciona categoria dinâmica
    const amountInput = screen.getByLabelText('Valor da despesa');
    fireEvent.change(amountInput, { target: { value: '150.00' } });
    fireEvent.click(screen.getByTestId('btn-expense-cat-marketing'));

    // 3. Salva
    fireEvent.click(screen.getByText('Salvar Despesa'));

    await waitFor(() => {
      expect(onExpenseSavedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'MARKETING',
          amount_cents: 15000,
        })
      );
    });
  });

  // AC-181
  it('AC-181: Visualização instantânea de métricas em cards verticais com revalidação do servidor @spec:AC-181', async () => {
    const today = new Date().toISOString().split('T')[0];

    const mockAppointments: LocalAppointment[] = [
      {
        id: 'app-rep-1',
        tenant_id: tenantId,
        patient_id: 'pat-1',
        start_time: `${today}T10:00:00.000Z`,
        end_time: `${today}T10:30:00.000Z`,
        status: 'COMPLETED',
        is_overtime: false,
        total_charged_cents: 25000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'app-rep-2',
        tenant_id: tenantId,
        patient_id: 'pat-2',
        start_time: `${today}T11:00:00.000Z`,
        end_time: `${today}T11:30:00.000Z`,
        status: 'NO_SHOW',
        is_overtime: false,
        total_charged_cents: 15000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const mockTransactions: LocalFinancialTransaction[] = [
      {
        id: 'tx-rep-1',
        tenant_id: tenantId,
        appointment_id: 'app-rep-1',
        type: 'INCOME',
        category: 'ATENDIMENTO',
        amount_cents: 25000,
        status: 'PAID',
        due_date: today,
        payment_date: today,
        installment_number: 1,
        total_installments: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const mockApiClient = new ReportsApiClient();
    vi.spyOn(mockApiClient, 'getNoShow').mockResolvedValue({
      total_appointments: 2,
      no_show_count: 1,
      no_show_rate: 50,
      summary: '1 de 2 consultas',
      lost_estimated_cents: 15000,
      lost_estimated_reais: 'R$ 150,00',
    });
    vi.spyOn(mockApiClient, 'getDRE').mockResolvedValue({
      total_income_paid_cents: 25000,
      total_expense_paid_cents: 0,
      net_profit_cents: 25000,
      margin_percentage: 100,
    });
    vi.spyOn(mockApiClient, 'getReceivables').mockResolvedValue({
      reference_date: today,
      pending_next_30_cents: 0,
      pending_next_60_cents: 0,
      pending_next_90_cents: 0,
      breakdown: { window_0_30_cents: 0, window_31_60_cents: 0, window_61_90_cents: 0 },
    });

    render(
      <ReportsView
        appointments={mockAppointments}
        appointmentItems={[]}
        procedures={[]}
        transactions={mockTransactions}
        patients={[]}
        apiClient={mockApiClient}
      />
    );

    // 1. Renderiza inicialmente no modo Local (Offline-First)
    const badge = screen.getByTestId('badge-report-sync-source');
    expect(badge).toHaveTextContent('Local (Offline-First)');

    // 2. Clica no botão de revalidar com servidor
    const revalidateBtn = screen.getByTestId('btn-revalidate-reports');
    fireEvent.click(revalidateBtn);

    await waitFor(() => {
      expect(mockApiClient.getNoShow).toHaveBeenCalled();
      expect(badge).toHaveTextContent('Servidor Sincronizado');
    });
  });

  // AC-182
  it('AC-182: Visualização de prontuário financeiro via Bottom Drawer com quitação pontual @spec:AC-182', async () => {
    const patient: LocalPatient = {
      id: 'pat-fin-1',
      tenant_id: tenantId,
      name: 'Maria Antônia',
      whatsapp: '11988887777',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const patientAppointments: LocalAppointment[] = [
      {
        id: 'app-pat-1',
        tenant_id: tenantId,
        patient_id: patient.id,
        start_time: '2026-10-10T14:00:00.000Z',
        end_time: '2026-10-10T14:30:00.000Z',
        status: 'COMPLETED',
        is_overtime: false,
        total_charged_cents: 35000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const patientTransactions: LocalFinancialTransaction[] = [
      {
        id: 'tx-pat-paid',
        tenant_id: tenantId,
        appointment_id: 'app-pat-1',
        type: 'INCOME',
        category: 'ATENDIMENTO',
        description: 'Tratamento Estético Entrada',
        amount_cents: 20000,
        status: 'PAID',
        due_date: '2026-10-10',
        payment_date: '2026-10-10',
        installment_number: 1,
        total_installments: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tx-pat-pending',
        tenant_id: tenantId,
        appointment_id: 'app-pat-1',
        type: 'INCOME',
        category: 'ATENDIMENTO',
        description: 'Tratamento Estético Parcela 2/2',
        amount_cents: 15000,
        status: 'PENDING',
        due_date: '2026-11-10',
        payment_date: null,
        installment_number: 2,
        total_installments: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    await testDb.financial_transactions.bulkAdd(patientTransactions);

    const onUpdatedMock = vi.fn();

    render(
      <PatientFinancialDrawer
        isOpen={true}
        patient={patient}
        appointments={patientAppointments}
        transactions={patientTransactions}
        financialRepo={financialRepo}
        onClose={vi.fn()}
        onTransactionUpdated={onUpdatedMock}
      />
    );

    // 1. Resumo financeiro do paciente
    expect(screen.getByTestId('card-patient-total-spent')).toHaveTextContent('R$ 200.00');
    expect(screen.getByTestId('card-patient-pending')).toHaveTextContent('R$ 150.00');

    // 2. Lista de movimentações
    expect(screen.getByText('Tratamento Estético Entrada')).toBeInTheDocument();
    expect(screen.getByText('Tratamento Estético Parcela 2/2')).toBeInTheDocument();

    // 3. Dá baixa na parcela pendente
    const payBtn = screen.getByTestId('btn-patient-pay-tx-pat-pending');
    fireEvent.click(payBtn);

    const confirmBtn = screen.getByTestId('btn-confirm-patient-settle');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onUpdatedMock).toHaveBeenCalled();
    });

    const txInDb = await testDb.financial_transactions.get('tx-pat-pending');
    expect(txInDb?.status).toBe('PAID');
  });
});
