/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CliniAssistLocalDB } from '../../../db/local-db';
import { FinancialLocalRepository } from '../../../db/repositories/financial-local-repository';
import { ScheduleGrid } from '../../agenda/components/ScheduleGrid';
import { SyncManager } from '../../../sync/sync-manager';
import { InstallmentsForm } from '../../checkout/components/InstallmentsForm';
import { ItemPriceEditor } from '../../checkout/components/ItemPriceEditor';
import { CheckoutDrawer } from '../../checkout/components/CheckoutDrawer';
import { FinancialLedger } from '../components/FinancialLedger';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { QuickExpenseModal } from '../../checkout/components/QuickExpenseModal';
import { PatientCard } from '../../patients/components/PatientCard';
import { PatientFinancialDrawer } from '../../patients/components/PatientFinancialDrawer';
import { ReportsView } from '../components/ReportsView';
import { ReportsApiClient } from '../../../services/reports-api';
import { LocalFinancialTransaction, LocalPatient, LocalAppointment } from '../../../db/types';

describe('Feature melhorias-financeiro-agenda-gestao — TDD Spec Anchor', () => {
  let testDb: CliniAssistLocalDB;
  let financialRepo: FinancialLocalRepository;
  const tenantId = 'tenant-test-improvements';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-improvements-${Date.now()}-${Math.random()}`);
    await testDb.open();
    financialRepo = new FinancialLocalRepository(testDb);
  });

  // AC-183: Transição de visualização semanal/mensal para diária e navegação temporal dinâmica
  it('AC-183: Transição de visualização semanal/mensal para diária e navegação temporal dinâmica @spec:AC-183', async () => {
    const handleSelectDate = vi.fn();
    const testDate = new Date('2026-10-21T10:00:00.000Z');

    const { rerender } = render(
      <ScheduleGrid
        currentDate={testDate}
        viewMode="week"
        appointments={[]}
        onSelectDate={handleSelectDate}
      />
    );

    // Na visualização semanal, grid de semana é exibido
    const weekView = screen.getByTestId('schedule-week-view');
    expect(weekView).toBeInTheDocument();

    // Clica no dia do grid semanal
    const days = weekView.querySelectorAll('.cursor-pointer');
    expect(days.length).toBeGreaterThan(0);
    fireEvent.click(days[0]);
    expect(handleSelectDate).toHaveBeenCalled();

    // Na visualização mensal
    handleSelectDate.mockClear();
    rerender(
      <ScheduleGrid
        currentDate={testDate}
        viewMode="month"
        appointments={[]}
        onSelectDate={handleSelectDate}
      />
    );

    const monthButtons = screen.getAllByRole('button');
    expect(monthButtons.length).toBeGreaterThan(0);
    fireEvent.click(monthButtons[0]);
    expect(handleSelectDate).toHaveBeenCalled();
  });

  // AC-184: Resiliência de status local contra sobrescrita por sincronização pull desatualizada (Bug NO_SHOW)
  it('AC-184: Resiliência de status local contra sobrescrita por sincronização pull desatualizada @spec:AC-184', async () => {
    const syncManager = new SyncManager(testDb, {
      baseUrl: 'http://localhost:3000',
      getToken: () => 'fake-token',
    });

    const appointmentId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    // 1. Grava agendamento localmente com status NO_SHOW
    await testDb.appointments.put({
      id: appointmentId,
      tenant_id: tenantId,
      patient_id: 'patient-1',
      start_time: '2026-10-21T14:00:00.000Z',
      end_time: '2026-10-21T14:30:00.000Z',
      status: 'NO_SHOW',
      is_extra_fit: false,
      notes: '',
      is_active: true,
      deleted_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    });

    // 2. Registra mutação pendente na outbox para este agendamento
    await testDb.sync_outbox.add({
      id: crypto.randomUUID(),
      client_mutation_id: crypto.randomUUID(),
      entity: 'appointments',
      record_id: appointmentId,
      operation: 'UPDATE',
      payload: { id: appointmentId, status: 'NO_SHOW', updated_at: nowIso },
      status: 'PENDING',
      retry_count: 0,
      created_at: nowIso,
    });

    // 3. Simula resposta do pull do servidor contendo o status antigo 'SCHEDULED'
    const mockPullResponse = {
      patients: [],
      procedures: [],
      appointments: [
        {
          id: appointmentId,
          tenant_id: tenantId,
          patient_id: 'patient-1',
          start_time: '2026-10-21T14:00:00.000Z',
          end_time: '2026-10-21T14:30:00.000Z',
          status: 'SCHEDULED', // Status antigo do servidor
          is_extra_fit: false,
          notes: '',
          is_active: true,
          deleted_at: null,
          created_at: '2026-10-20T10:00:00.000Z',
          updated_at: '2026-10-20T10:00:00.000Z',
        },
      ],
      financial_transactions: [],
      server_timestamp: nowIso,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPullResponse,
    } as any);

    await syncManager.pull();

    // 4. Verifica que o status NO_SHOW NÃO foi sobrescrito pelo status SCHEDULED antigo
    const localApp = await testDb.appointments.get(appointmentId);
    expect(localApp?.status).toBe('NO_SHOW');
  });

  // AC-185: Cartão de Crédito à vista e parcelamento exclusivo na modalidade Parcelado com vencimentos individuais
  it('AC-185: Cartão de Crédito à vista e parcelamento exclusivo na modalidade Parcelado com vencimentos individuais @spec:AC-185', async () => {
    // 1. Form de parcelamento com vencimentos customizados
    let capturedPlan: any[] = [];
    let capturedValid = false;

    render(
      <InstallmentsForm
        totalCents={30000} // R$ 300,00
        defaultFirstDueDate="2026-11-01"
        onChangePlan={(plan, isValid) => {
          capturedPlan = plan;
          capturedValid = isValid;
        }}
      />
    );

    expect(capturedValid).toBe(true);
    expect(capturedPlan.length).toBe(3); // Default 3x

    // Altera a data de vencimento da 2ª parcela manualmente
    const dateInputs = screen.getAllByLabelText(/Data da parcela/i);
    expect(dateInputs.length).toBe(3);

    fireEvent.change(dateInputs[1], { target: { value: '2026-12-25' } });

    await waitFor(() => {
      expect(capturedPlan[1].dueDate).toBe('2026-12-25');
    });

    // 2. No CheckoutDrawer: Cartão de Crédito é pagamento à vista (não renderiza InstallmentsForm)
    const mockAppointment: any = {
      id: 'app-checkout-credit',
      tenant_id: tenantId,
      patient_id: 'pat-1',
      patient_name: 'Ana Costa',
      patient_whatsapp: '11988887777',
      start_time: '2026-10-21T10:00:00.000Z',
      end_time: '2026-10-21T10:30:00.000Z',
      status: 'CONFIRMED',
      procedures: [
        {
          id: 'proc-1',
          name: 'Clareamento Dental',
          default_duration_minutes: 30,
          default_price_cents: 30000,
        },
      ],
    };

    const handleComplete = vi.fn().mockResolvedValue(undefined);

    const { unmount } = render(
      <CheckoutDrawer
        isOpen={true}
        appointment={mockAppointment}
        onClose={vi.fn()}
        onCompleteCheckout={handleComplete}
      />
    );

    // Clica em Crédito
    const creditBtn = screen.getByRole('button', { name: 'Crédito' });
    fireEvent.click(creditBtn);

    // Não deve renderizar o formulário de parcelas
    expect(screen.queryByText(/Número de Parcelas/i)).not.toBeInTheDocument();

    // Clica em Concluir Checkout com Crédito
    const submitBtn = screen.getByRole('button', { name: /Concluir Atendimento & Receber/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: 'CARTAO_CREDITO',
          installments: undefined, // Pagamento único à vista
        })
      );
    });

    unmount();
  });

  // AC-186: Ajuste manual e irrestrito de valores e procedimentos no checkout
  it('AC-186: Ajuste manual e irrestrito de valores e procedimentos no checkout @spec:AC-186', async () => {
    const handleUpdatePrice = vi.fn();
    const handleRemove = vi.fn();

    const items = [
      {
        id: 'proc-1',
        name: 'Consulta Padrão',
        basePriceCents: 15000,
        effectivePriceCents: 15000,
        discountCents: 0,
      },
    ];

    render(
      <ItemPriceEditor
        items={items}
        onUpdateItemPrice={handleUpdatePrice}
        onRemoveItem={handleRemove}
        allowItemPriceEdit={true}
      />
    );

    const priceInput = screen.getByLabelText('Preço de Consulta Padrão');
    expect(priceInput).toHaveValue(150);

    // Permite zerar o valor (cortesia R$ 0,00)
    fireEvent.change(priceInput, { target: { value: '0' } });
    expect(handleUpdatePrice).toHaveBeenCalledWith('proc-1', 0);

    // Permite cobrar valor mais alto (R$ 350,50)
    fireEvent.change(priceInput, { target: { value: '350.50' } });
    expect(handleUpdatePrice).toHaveBeenCalledWith('proc-1', 35050);

    // 2. Testa edição fluida no CheckoutDrawer pelo campo Total Final Cobrado
    const mockApp: any = {
      id: 'app-edit-total',
      tenant_id: tenantId,
      patient_id: 'pat-1',
      patient_name: 'Marcos Silva',
      patient_whatsapp: '11988889999',
      start_time: '2026-10-21T10:00:00.000Z',
      end_time: '2026-10-21T10:30:00.000Z',
      status: 'CONFIRMED',
      procedures: [
        {
          id: 'proc-1',
          name: 'Avaliação Clínica',
          default_duration_minutes: 30,
          default_price_cents: 15000,
        },
      ],
    };

    const handleComplete = vi.fn().mockResolvedValue(undefined);

    const { unmount } = render(
      <CheckoutDrawer
        isOpen={true}
        appointment={mockApp}
        onClose={vi.fn()}
        onCompleteCheckout={handleComplete}
      />
    );

    const totalInput = screen.getByLabelText('Total final');
    expect(totalInput).toHaveValue(150);

    // Permite aumentar o valor total cobrado (R$ 220,00) - gera acréscimo positivo sem mudar preço de tabela
    fireEvent.change(totalInput, { target: { value: '220.00' } });
    expect(totalInput).toHaveValue(220);
    expect(screen.getByText(/Rateio: \+R\$ 70\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ R\$ 70\.00 \(\+46\.7%\)/i)).toBeInTheDocument();
    // O valor do procedimento continua sendo exibido com seu valor de tabela R$ 150.00 (tanto no item quanto no subtotal)
    expect(screen.getAllByText('R$ 150.00').length).toBe(2);

    // Permite diminuir o valor total cobrado (R$ 100,00) - gera desconto negativo sem mudar preço de tabela
    fireEvent.change(totalInput, { target: { value: '100.00' } });
    expect(totalInput).toHaveValue(100);
    expect(screen.getByText(/Rateio: -R\$ 50\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/- R\$ 50\.00 \(-33\.3%\)/i)).toBeInTheDocument();
    expect(screen.getAllByText('R$ 150.00').length).toBe(2);

    // Permite zerar o valor total cobrado (cortesia R$ 0,00)
    fireEvent.change(totalInput, { target: { value: '0' } });
    expect(totalInput).toHaveValue(0);

    unmount();
  });

  // AC-187: Filtros temporais avançados e busca textual normalizada no Extrato
  it('AC-187: Filtros temporais avançados e busca textual normalizada no Extrato @spec:AC-187', async () => {
    const patient1: LocalPatient = {
      id: 'pat-joao',
      tenant_id: tenantId,
      name: 'João da Silva',
      whatsapp: '11999991111',
      is_active: true,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const app1: LocalAppointment = {
      id: 'app-joao',
      tenant_id: tenantId,
      patient_id: patient1.id,
      start_time: '2026-10-15T10:00:00.000Z',
      end_time: '2026-10-15T10:30:00.000Z',
      status: 'COMPLETED',
      is_extra_fit: false,
      notes: '',
      is_active: true,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const transactions: LocalFinancialTransaction[] = [
      {
        id: 'tx-1',
        tenant_id: tenantId,
        appointment_id: app1.id,
        type: 'INCOME',
        category: 'ATENDIMENTO',
        description: 'Limpeza Dental e Cartão',
        amount_cents: 15000,
        payment_method: 'CARTAO_CREDITO',
        status: 'PAID',
        due_date: '2026-10-15',
        payment_date: '2026-10-15T12:00:00.000Z',
        installment_number: 1,
        total_installments: 1,
        is_active: true,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tx-2',
        tenant_id: tenantId,
        appointment_id: null,
        type: 'EXPENSE',
        category: 'ALUGUEL',
        description: 'Aluguel do Consultório',
        amount_cents: 200000,
        payment_method: 'PIX',
        status: 'PAID',
        due_date: '2026-09-10',
        payment_date: '2026-09-10T12:00:00.000Z',
        installment_number: 1,
        total_installments: 1,
        is_active: true,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    render(
      <FinancialLedger
        transactions={transactions}
        patients={[patient1]}
        appointments={[app1]}
      />
    );

    // 1. Busca textual normalizada: "cartao" sem acento deve encontrar "Cartão" (TM-FIN-03)
    const searchInput = screen.getByTestId('input-ledger-search');
    fireEvent.change(searchInput, { target: { value: 'cartao' } });
    expect(screen.getByText(/Limpeza Dental e Cartão/i)).toBeInTheDocument();
    expect(screen.queryByText(/Aluguel do Consultório/i)).not.toBeInTheDocument();

    // 2. Busca pelo nome do paciente "joao" sem acento
    fireEvent.change(searchInput, { target: { value: 'joao' } });
    expect(screen.getByText(/Limpeza Dental e Cartão/i)).toBeInTheDocument();

    // Limpa busca
    fireEvent.change(searchInput, { target: { value: '' } });

    // 3. Filtro por período com Data Inicial e Data Final
    const startDateInput = screen.getByTestId('input-ledger-start-date');
    const endDateInput = screen.getByTestId('input-ledger-end-date');

    // Filtra período que cobre apenas Setembro/2026
    fireEvent.change(startDateInput, { target: { value: '2026-09-01' } });
    fireEvent.change(endDateInput, { target: { value: '2026-09-30' } });
    expect(screen.getByText(/Aluguel do Consultório/i)).toBeInTheDocument();
    expect(screen.queryByText(/Limpeza Dental e Cartão/i)).not.toBeInTheDocument();

    // Filtra período que cobre apenas Outubro/2026
    fireEvent.change(startDateInput, { target: { value: '2026-10-01' } });
    fireEvent.change(endDateInput, { target: { value: '2026-10-31' } });
    expect(screen.getByText(/Limpeza Dental e Cartão/i)).toBeInTheDocument();
    expect(screen.queryByText(/Aluguel do Consultório/i)).not.toBeInTheDocument();

    // Filtra período amplo cobrindo ambos
    fireEvent.change(startDateInput, { target: { value: '2026-09-01' } });
    fireEvent.change(endDateInput, { target: { value: '2026-10-31' } });
    expect(screen.getByText(/Limpeza Dental e Cartão/i)).toBeInTheDocument();
    expect(screen.getByText(/Aluguel do Consultório/i)).toBeInTheDocument();

    // Limpa período
    fireEvent.change(startDateInput, { target: { value: '' } });
    fireEvent.change(endDateInput, { target: { value: '' } });

    // 4. Filtro por mês
    const monthSelect = screen.getByTestId('select-ledger-month');
    fireEvent.change(monthSelect, { target: { value: '2026-09' } });
    expect(screen.getByText(/Aluguel do Consultório/i)).toBeInTheDocument();
    expect(screen.queryByText(/Limpeza Dental e Cartão/i)).not.toBeInTheDocument();

    // 5. Filtro por data específica
    const dateInput = screen.getByTestId('input-ledger-specific-date');
    fireEvent.change(dateInput, { target: { value: '2026-10-15' } });
    expect(screen.getByText(/Limpeza Dental e Cartão/i)).toBeInTheDocument();
    expect(screen.queryByText(/Aluguel do Consultório/i)).not.toBeInTheDocument();
  });

  // AC-188: Exportação CSV do Livro Caixa com identificação de cliente e telefone em receitas
  it('AC-188: Exportação CSV do Livro Caixa com identificação de cliente e telefone em receitas @spec:AC-188', async () => {
    let capturedBlob: Blob | null = null;
    global.URL.createObjectURL = vi.fn().mockImplementation((blob) => {
      capturedBlob = blob;
      return 'blob:mock-url';
    });
    global.URL.revokeObjectURL = vi.fn();

    const patient: LocalPatient = {
      id: 'pat-maria',
      tenant_id: tenantId,
      name: 'Maria Oliveira',
      whatsapp: '11988882222',
      is_active: true,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const app: LocalAppointment = {
      id: 'app-maria',
      tenant_id: tenantId,
      patient_id: patient.id,
      start_time: '2026-10-21T10:00:00.000Z',
      end_time: '2026-10-21T10:30:00.000Z',
      status: 'COMPLETED',
      is_extra_fit: false,
      notes: '',
      is_active: true,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const transactions: LocalFinancialTransaction[] = [
      {
        id: 'tx-income',
        tenant_id: tenantId,
        appointment_id: app.id,
        type: 'INCOME',
        category: 'ATENDIMENTO',
        description: 'Consulta Maria',
        amount_cents: 20000,
        payment_method: 'PIX',
        status: 'PAID',
        due_date: '2026-10-21',
        payment_date: '2026-10-21T12:00:00.000Z',
        installment_number: 1,
        total_installments: 1,
        is_active: true,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tx-expense',
        tenant_id: tenantId,
        appointment_id: null,
        type: 'EXPENSE',
        category: 'MATERIAIS',
        description: 'Luvas',
        amount_cents: 5000,
        payment_method: 'DINHEIRO',
        status: 'PAID',
        due_date: '2026-10-21',
        payment_date: '2026-10-21T12:00:00.000Z',
        installment_number: 1,
        total_installments: 1,
        is_active: true,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    render(
      <FinancialLedger
        transactions={transactions}
        patients={[patient]}
        appointments={[app]}
      />
    );

    const exportBtn = screen.getByTestId('btn-export-csv');
    fireEvent.click(exportBtn);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(capturedBlob).not.toBeNull();
  });

  // AC-189: Detalhes, edição, estorno de pagamentos e soft-delete de transações no Extrato
  it('AC-189: Detalhes, edição, estorno de pagamentos e soft-delete de transações no Extrato @spec:AC-189', async () => {
    const handleSave = vi.fn();
    const handleSettle = vi.fn();
    const handleRevert = vi.fn();
    const handleDelete = vi.fn();

    const tx: LocalFinancialTransaction = {
      id: 'tx-modal-test',
      tenant_id: tenantId,
      appointment_id: 'app-completed-1',
      type: 'INCOME',
      category: 'ATENDIMENTO',
      description: 'Procedimento Estético',
      amount_cents: 50000,
      payment_method: 'PIX',
      status: 'PAID',
      due_date: '2026-10-21',
      payment_date: '2026-10-21T10:00:00.000Z',
      installment_number: 1,
      total_installments: 1,
      is_active: true,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    render(
      <TransactionDetailModal
        isOpen={true}
        transaction={tx}
        patientName="Carlos Souza"
        patientPhone="11977773333"
        isAppointmentCompleted={true}
        onClose={vi.fn()}
        onSave={handleSave}
        onSettle={handleSettle}
        onRevert={handleRevert}
        onDelete={handleDelete}
      />
    );

    expect(screen.getByText('Detalhes do Lançamento')).toBeInTheDocument();
    expect(screen.getByText(/Paciente: Carlos Souza/i)).toBeInTheDocument();

    // 1. Estorno com consulta concluída requer checkbox (Q-001)
    const startRevertBtn = screen.getByTestId('btn-start-revert');
    fireEvent.click(startRevertBtn);

    // Aviso visível
    expect(screen.getByTestId('revert-completed-warning')).toBeInTheDocument();

    const confirmRevertBtn = screen.getByTestId('btn-confirm-revert');
    expect(confirmRevertBtn).toBeDisabled();

    // Marca checkbox de ciência
    const checkbox = screen.getByTestId('checkbox-confirm-revert');
    fireEvent.click(checkbox);
    expect(confirmRevertBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(confirmRevertBtn);
    });
    expect(handleRevert).toHaveBeenCalled();

    // 2. Soft-delete
    const startDeleteBtn = screen.getByTestId('btn-start-delete');
    await act(async () => {
      fireEvent.click(startDeleteBtn);
    });
    const confirmDeleteBtn = screen.getByTestId('btn-confirm-delete');
    await act(async () => {
      fireEvent.click(confirmDeleteBtn);
    });
    expect(handleDelete).toHaveBeenCalled();

    // 3. Validação do campo Categoria para Entrada (bloqueado com Procedimento/Serviço e nome do procedimento)
    const categoryInput = screen.getByLabelText('Procedimento/Serviço');
    expect(categoryInput).toHaveValue('Procedimento Estético');
    expect(categoryInput).toBeDisabled();

    // 4. Validação do campo Categoria para Saída (select com opções disponíveis)
    const expenseTx: LocalFinancialTransaction = {
      ...tx,
      id: 'tx-expense-99',
      type: 'EXPENSE',
      category: 'ALUGUEL',
      description: 'Aluguel do Consultório',
    };

    const { unmount } = render(
      <TransactionDetailModal
        isOpen={true}
        transaction={expenseTx}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    const expenseCategorySelect = screen.getByTestId('select-expense-category') as HTMLSelectElement;
    expect(expenseCategorySelect).toBeInTheDocument();
    expect(expenseCategorySelect.value).toBe('ALUGUEL');
    fireEvent.change(expenseCategorySelect, { target: { value: 'MATERIAIS' } });
    expect(expenseCategorySelect.value).toBe('MATERIAIS');
    unmount();
  });

  // AC-190: Despesas rápidas com reset de formulário, suporte a pendências, parcelamento e recorrência
  it('AC-190: Despesas rápidas com reset de formulário, suporte a pendências, parcelamento e recorrência @spec:AC-190', async () => {
    const handleClose = vi.fn();
    const handleSaved = vi.fn();

    const { rerender } = render(
      <QuickExpenseModal
        isOpen={true}
        tenantId={tenantId}
        onClose={handleClose}
        financialRepo={financialRepo}
        onExpenseSaved={handleSaved}
      />
    );

    // Campos iniciam limpos
    const valueInput = screen.getByLabelText(/Valor da despesa/i);
    expect(valueInput).toHaveValue(null);

    // Digita valor e escolhe status Pendente
    fireEvent.change(valueInput, { target: { value: '300.00' } });
    const btnPending = screen.getByTestId('btn-expense-status-pending');
    fireEvent.click(btnPending);

    // Escolhe modalidade Parcelada em 3x
    const btnInstallments = screen.getByTestId('btn-expense-modality-installments');
    fireEvent.click(btnInstallments);

    const selectInstallments = screen.getByTestId('select-expense-installments');
    fireEvent.change(selectInstallments, { target: { value: '3' } });

    // Salva despesa
    const submitBtn = screen.getByText('Salvar Despesa');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSaved).toHaveBeenCalled();
    });

    // Verifica que gerou 3 transações no banco local
    const savedTxs = await financialRepo.listTransactions(tenantId);
    expect(savedTxs.length).toBe(3);
    expect(savedTxs[0].status).toBe('PENDING');

    // Ao fechar e reabrir, campos voltam limpos
    rerender(
      <QuickExpenseModal
        isOpen={false}
        tenantId={tenantId}
        onClose={handleClose}
        financialRepo={financialRepo}
      />
    );

    rerender(
      <QuickExpenseModal
        isOpen={true}
        tenantId={tenantId}
        onClose={handleClose}
        financialRepo={financialRepo}
      />
    );

    expect(screen.getByLabelText(/Valor da despesa/i)).toHaveValue(null);
  });

  // AC-191: Indicador visual de débitos no card do paciente e isolamento financeiro estrito por ID
  it('AC-191: Indicador visual de débitos no card do paciente e isolamento financeiro estrito por ID @spec:AC-191', async () => {
    // 1. Badge de pendência no PatientCard
    const patientTeste: LocalPatient = {
      id: 'pat-teste',
      tenant_id: tenantId,
      name: 'teste',
      whatsapp: '11999990000',
      is_active: true,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    render(
      <PatientCard
        item={{
          patient: patientTeste,
          totalAppointments: 1,
          nextAppointment: null,
          lastCancelledWithoutReschedule: false,
          hasNoHistory: false,
        }}
        pendingAmountCents={15000} // R$ 150,00 de pendência
      />
    );

    expect(screen.getByTestId(`badge-pending-${patientTeste.id}`)).toHaveTextContent('Pendência: R$ 150.00');

    // 2. Isolamento estrito no PatientFinancialDrawer (TM-FIN-12)
    const appTeste: LocalAppointment = {
      id: 'app-teste-1',
      tenant_id: tenantId,
      patient_id: patientTeste.id,
      start_time: '2026-10-21T10:00:00.000Z',
      end_time: '2026-10-21T10:30:00.000Z',
      status: 'SCHEDULED',
      is_extra_fit: false,
      notes: '',
      is_active: true,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const appTeste3: LocalAppointment = {
      id: 'app-teste3-1',
      tenant_id: tenantId,
      patient_id: 'pat-teste3',
      start_time: '2026-10-21T11:00:00.000Z',
      end_time: '2026-10-21T11:30:00.000Z',
      status: 'SCHEDULED',
      is_extra_fit: false,
      notes: '',
      is_active: true,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Transação de 'teste3' que tem na descrição "Consulta teste3"
    const txTeste3: LocalFinancialTransaction = {
      id: 'tx-teste3-1',
      tenant_id: tenantId,
      appointment_id: appTeste3.id, // Pertence a app-teste3-1
      type: 'INCOME',
      category: 'ATENDIMENTO',
      description: 'Consulta teste3',
      amount_cents: 8000,
      payment_method: 'PIX',
      status: 'PAID',
      due_date: '2026-10-21',
      payment_date: '2026-10-21T11:00:00.000Z',
      installment_number: 1,
      total_installments: 1,
      is_active: true,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    render(
      <PatientFinancialDrawer
        isOpen={true}
        patient={patientTeste}
        appointments={[appTeste, appTeste3]}
        transactions={[txTeste3]}
        onClose={vi.fn()}
      />
    );

    // O prontuário de "teste" NÃO deve exibir o lançamento de "teste3" mesmo contendo o termo "teste" na descrição!
    expect(screen.queryByText('Consulta teste3')).not.toBeInTheDocument();
    expect(within(screen.getByTestId('card-patient-total-spent')).getByText('R$ 0.00')).toBeInTheDocument();
  });

  // AC-192: Baixa individual com seleção de método e valor, persistência de abas/filtros e autenticação de relatórios
  it('AC-192: Baixa individual com seleção de método e valor, persistência de abas/filtros e autenticação de relatórios @spec:AC-192', async () => {
    // 1. Autenticação de relatórios sem 401
    const mockApiClient = new ReportsApiClient({ baseUrl: 'http://localhost:3000' });
    let authHeader = '';

    global.fetch = vi.fn().mockImplementation((url, opts) => {
      authHeader = opts?.headers?.['Authorization'] || '';
      return Promise.resolve({
        ok: true,
        json: async () => ({
          no_show_rate: 0,
          no_show_count: 0,
          lost_estimated_cents: 0,
          net_profit_cents: 0,
          total_income_paid_cents: 0,
          total_expense_paid_cents: 0,
          margin_percentage: 0,
          pending_next_30_cents: 0,
          pending_next_60_cents: 0,
          pending_next_90_cents: 0,
        }),
      });
    });

    render(
      <ReportsView
        appointments={[]}
        appointmentItems={[]}
        procedures={[]}
        transactions={[]}
        patients={[]}
        token="jwt_token_valido"
        apiClient={mockApiClient}
      />
    );

    // Revalidação com servidor
    const revalidateBtn = screen.getByText(/Revalidar com Servidor/i);
    fireEvent.click(revalidateBtn);

    await waitFor(() => {
      expect(authHeader).toBe('Bearer jwt_token_valido');
    });

    // 2. Baixa individual com seleção de forma de pagamento e valor
    const txPending: LocalFinancialTransaction = {
      id: 'tx-baixa-individual',
      tenant_id: tenantId,
      appointment_id: 'app-pend-1',
      type: 'INCOME',
      category: 'ATENDIMENTO',
      description: 'Tratamento de Canal',
      amount_cents: 50000,
      payment_method: 'PIX',
      status: 'PENDING',
      due_date: '2026-10-21',
      payment_date: null,
      installment_number: 1,
      total_installments: 1,
      is_active: true,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await testDb.financial_transactions.put(txPending);

    const settled = await financialRepo.settleTransaction(txPending.id, {
      paymentMethod: 'CARTAO_CREDITO',
      paymentDate: '2026-10-22',
      amountCents: 45000, // Ajuste de valor com desconto negociado
    });

    expect(settled.status).toBe('PAID');
    expect(settled.payment_method).toBe('CARTAO_CREDITO');
    expect(settled.amount_cents).toBe(45000);
  });
});
