/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CliniAssistLocalDB } from '../../../db/local-db';
import { AppointmentLocalRepository } from '../../../db/repositories/appointment-local-repository';
import { PatientLocalRepository } from '../../../db/repositories/patient-local-repository';
import { FinancialLocalRepository } from '../../../db/repositories/financial-local-repository';
import { CheckoutDrawer } from '../components/CheckoutDrawer';
import { InstallmentsForm } from '../components/InstallmentsForm';
import { SmartReturnDrawer } from '../components/SmartReturnDrawer';
import { QuickExpenseModal } from '../components/QuickExpenseModal';
import { splitDiscountProportionally } from '../utils/discount-splitter';
import { LocalAppointmentWithDetails } from '../../agenda/types';

describe('Sprint FE-3: Checkout Financeiro, Rateio de Descontos e Retorno Inteligente', () => {
  let testDb: CliniAssistLocalDB;
  let appointmentRepo: AppointmentLocalRepository;
  let patientRepo: PatientLocalRepository;
  let financialRepo: FinancialLocalRepository;
  const tenantId = 'tenant-test-fe3';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-fe3-${Date.now()}-${Math.random()}`);
    await testDb.open();
    appointmentRepo = new AppointmentLocalRepository(testDb);
    patientRepo = new PatientLocalRepository(testDb);
    financialRepo = new FinancialLocalRepository(testDb);
  });

  // AC-065
  it('AC-065: Edição Individual de Procedimentos e Rateio Automático de Desconto Geral (R$ e %) @spec:AC-065', async () => {
    const user = userEvent.setup();

    // 1. Teste direto do utilitário de rateio proporcional com método dos maiores restos (Hare-Niemeyer)
    const itemsSample = [
      { id: '1', name: 'Limpeza', basePriceCents: 20000 }, // R$ 200,00
      { id: '2', name: 'Restauração', basePriceCents: 25000 }, // R$ 250,00
    ];
    // Desconto de R$ 50,00 (5000 centavos) sobre subtotal de R$ 450,00
    const split = splitDiscountProportionally(itemsSample, 5000);
    expect(split.subtotalCents).toBe(45000);
    expect(split.discountCents).toBe(5000);
    expect(split.totalCents).toBe(40000); // R$ 400,00
    expect(split.items[0].effectivePriceCents + split.items[1].effectivePriceCents).toBe(40000);

    // 2. Teste da interface do CheckoutDrawer com edição de preços e remoção
    const mockAppointment: LocalAppointmentWithDetails = {
      id: 'app-checkout-1',
      tenant_id: tenantId,
      patient_id: 'pat-1',
      patient_name: 'Marcos Silva',
      start_time: '2026-10-18T14:00:00.000Z',
      end_time: '2026-10-18T15:00:00.000Z',
      status: 'CONFIRMED',
      is_extra_fit: false,
      procedures: [
        {
          id: 'proc-1',
          tenant_id: tenantId,
          name: 'Limpeza',
          default_duration_minutes: 30,
          default_price_cents: 20000,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'proc-2',
          tenant_id: tenantId,
          name: 'Restauração',
          default_duration_minutes: 45,
          default_price_cents: 25000,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    };

    const onComplete = vi.fn();

    render(
      <CheckoutDrawer
        isOpen={true}
        appointment={mockAppointment}
        onClose={vi.fn()}
        onCompleteCheckout={onComplete}
      />
    );

    expect(screen.getByText('Checkout & Conclusão de Atendimento')).toBeDefined();
    expect(screen.getByText('Limpeza')).toBeDefined();
    expect(screen.getByText('Restauração')).toBeDefined();

    // Aplica desconto no Total digitando diretamente R$ 400.00 no Total Final Cobrado
    const totalInput = screen.getByLabelText('Total final');
    fireEvent.change(totalInput, { target: { value: '400.00' } });

    await waitFor(() => {
      // O aviso de rateio do desconto deve aparecer
      expect(screen.getAllByText(/Rateio: -R\$/i).length).toBe(2);
    });

    // Remove o item "Limpeza"
    const removeBtn = screen.getByLabelText('Remover Limpeza');
    await user.click(removeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Limpeza')).toBeNull();
      expect(screen.getByText('Restauração')).toBeDefined();
    });
  });

  // AC-066
  it('AC-066: Validação Visual de Entrada e Formatação Monetária Fluida @spec:AC-066', async () => {
    const onChangePlan = vi.fn();
    const totalCents = 30000; // R$ 300,00

    render(
      <InstallmentsForm
        totalCents={totalCents}
        onChangePlan={onChangePlan}
        defaultFirstDueDate="2026-11-17"
      />
    );

    // Entrada válida inicial
    expect(screen.queryByTestId('entry-invalid-error')).toBeNull();

    // Digita entrada maior que o total (R$ 350.00)
    const entryInput = screen.getByLabelText('Valor de entrada');
    fireEvent.change(entryInput, { target: { value: '350.00' } });

    await waitFor(() => {
      // Exibe erro de validação
      expect(screen.getByTestId('entry-invalid-error')).toBeDefined();
      expect(screen.getByText(/não pode ser superior ao valor total cobrado/i)).toBeDefined();

      // Confirma que o callback reportou plano inválido
      const lastCall = onChangePlan.mock.calls[onChangePlan.mock.calls.length - 1];
      expect(lastCall[1]).toBe(false); // isValid === false
    });
  });

  // AC-067
  it('AC-067: Configuração de Parcelamento com Entrada e Calendário de Vencimentos @spec:AC-067', async () => {
    const onChangePlan = vi.fn();
    const totalCents = 40000; // R$ 400,00

    render(
      <InstallmentsForm
        totalCents={totalCents}
        onChangePlan={onChangePlan}
        defaultFirstDueDate="2026-11-17"
      />
    );

    // Define entrada de R$ 100,00
    const entryInput = screen.getByLabelText('Valor de entrada');
    fireEvent.change(entryInput, { target: { value: '100.00' } });

    // Define 3 parcelas
    const installmentsSelect = screen.getByLabelText('Número de parcelas');
    fireEvent.change(installmentsSelect, { target: { value: '3' } });

    await waitFor(() => {
      // A prévia deve exibir a Entrada + 3 parcelas com datas sucessivas: 17/11/2026, 17/12/2026, 17/01/2027
      const preview = screen.getByTestId('installments-preview');
      expect(preview.textContent).toContain('Entrada (Hoje)');
      expect(preview.textContent).toContain('Parcela 1/3');
      expect(preview.textContent).toContain('2026-11-17');
      expect(preview.textContent).toContain('Parcela 2/3');
      expect(preview.textContent).toContain('2026-12-17');
      expect(preview.textContent).toContain('Parcela 3/3');
      expect(preview.textContent).toContain('2027-01-17');
    });

    // Grava as transações geradas no banco local
    const patient = await patientRepo.createPatient({
      tenant_id: tenantId,
      name: 'Cliente Parcelado',
      whatsapp: '11988889999',
    });

    const appointment = await appointmentRepo.createAppointment({
      tenant_id: tenantId,
      patient_id: patient.id,
      start_time: '2026-10-18T10:00:00.000Z',
      end_time: '2026-10-18T10:30:00.000Z',
      status: 'CONFIRMED',
      items: [],
    });

    const lastPlan = onChangePlan.mock.calls[onChangePlan.mock.calls.length - 1][0];

    const transactions = await financialRepo.recordCheckout({
      tenantId,
      appointmentId: appointment.appointment.id,
      totalCents: 40000,
      paymentMethod: 'PARCELADO',
      installments: lastPlan,
    });

    expect(transactions).toHaveLength(4); // Entrada + 3 parcelas
    expect(transactions[0].status).toBe('PAID');
    expect(transactions[0].amount_cents).toBe(10000);
    expect(transactions[1].status).toBe('PENDING');
    expect(transactions[1].due_date).toBe('2026-11-17');
    expect(transactions[2].due_date).toBe('2026-12-17');
    expect(transactions[3].due_date).toBe('2027-01-17');

    // Confirma que o agendamento foi finalizado como COMPLETED
    const updatedApp = await testDb.appointments.get(appointment.appointment.id);
    expect(updatedApp?.status).toBe('COMPLETED');

    // Confirma enfileiramento na outbox
    const outboxTxs = await testDb.sync_outbox
      .where('entity')
      .equals('financial_transactions')
      .toArray();
    expect(outboxTxs).toHaveLength(4);
  });

  // AC-068
  it('AC-068: Sugestão de Retorno Rápido (15 dias, 30 dias, 6 meses) com Resolução de Conflitos @spec:AC-068', async () => {
    const user = userEvent.setup();
    const baseDate = new Date(2026, 9, 18, 14, 0, 0, 0); // 18 de Outubro de 2026 às 14:00
    const onReturnScheduled = vi.fn();
    const onClose = vi.fn();

    // Cria agendamento existente conflitante daqui a 30 dias às 14:00
    const conflictingDate = new Date(2026, 9, 18, 14, 0, 0, 0);
    conflictingDate.setDate(conflictingDate.getDate() + 30); // 17 de Novembro de 2026

    const existingAppointments = [
      {
        start_time: conflictingDate.toISOString(),
        end_time: new Date(conflictingDate.getTime() + 30 * 60000).toISOString(),
        status: 'CONFIRMED',
      },
    ];

    render(
      <SmartReturnDrawer
        isOpen={true}
        onClose={onClose}
        tenantId={tenantId}
        patientId="pat-return-1"
        patientName="Paciente Retorno"
        baseDate={baseDate}
        preferredTimeStr="14:00"
        existingAppointments={existingAppointments}
        appointmentRepo={appointmentRepo}
        onReturnScheduled={onReturnScheduled}
      />
    );

    expect(screen.getByText('Retorno Inteligente')).toBeDefined();

    // Como 14:00 está ocupado em 30 dias, deve exibir alerta de ocupado e as alternativas vagas mais próximas
    await waitFor(() => {
      expect(screen.getByTestId('smart-return-alternatives')).toBeDefined();
      expect(screen.getByText(/já está ocupado nesta data/i)).toBeDefined();
    });

    // Alterna para "Em 15 dias" (onde 14:00 está livre)
    const btn15d = screen.getByRole('button', { name: 'Em 15 dias' });
    await user.click(btn15d);

    // Agora 14:00 deve estar livre com botão de confirmação em 1 toque
    await waitFor(() => {
      expect(screen.getByText(/Agendar para 14:00 \(1 Toque\)/i)).toBeDefined();
    });

    // Clica no botão de 1 toque para confirmar o retorno
    const confirmBtn = screen.getByText(/Agendar para 14:00 \(1 Toque\)/i);
    await user.click(confirmBtn);

    await waitFor(async () => {
      expect(onReturnScheduled).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();

      // Confirma registro de retorno criado no Dexie
      const apps = await testDb.appointments.where('patient_id').equals('pat-return-1').toArray();
      expect(apps).toHaveLength(1);
      expect(apps[0].status).toBe('CONFIRMED');
    });
  });

  // AC-069
  it('AC-069: Modal de Lançamento Rápido de Despesa (< 10 segundos) @spec:AC-069', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const onClose = vi.fn();

    render(
      <QuickExpenseModal
        isOpen={true}
        tenantId={tenantId}
        onClose={onClose}
        financialRepo={financialRepo}
        onExpenseSaved={onSaved}
      />
    );

    expect(screen.getByText('Nova Despesa Rápida')).toBeDefined();

    // Preenche valor: R$ 180.50
    const valInput = screen.getByLabelText('Valor da despesa');
    await user.type(valInput, '180.50');

    // Seleciona categoria "Materiais & Insumos"
    const catBtn = screen.getByRole('button', { name: /Materiais & Insumos/i });
    await user.click(catBtn);

    // Preenche descrição
    const descInput = screen.getByLabelText('Descrição da despesa');
    await user.type(descInput, 'Resinas e Luvas Descartáveis');

    // Clica em Salvar
    const submitBtn = screen.getByRole('button', { name: 'Salvar Despesa' });
    await user.click(submitBtn);

    await waitFor(async () => {
      expect(onSaved).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();

      // Confirma criação no Dexie.js
      const txs = await testDb.financial_transactions.toArray();
      expect(txs).toHaveLength(1);
      expect(txs[0].type).toBe('EXPENSE');
      expect(txs[0].amount_cents).toBe(18050);
      expect(txs[0].category).toBe('MATERIAIS');
      expect(txs[0].status).toBe('PAID');

      // Confirma enfileiramento na outbox
      const outboxEntries = await testDb.sync_outbox
        .where('record_id')
        .equals(txs[0].id)
        .toArray();
      expect(outboxEntries).toHaveLength(1);
      expect(outboxEntries[0].operation).toBe('INSERT');
    });
  });
});
