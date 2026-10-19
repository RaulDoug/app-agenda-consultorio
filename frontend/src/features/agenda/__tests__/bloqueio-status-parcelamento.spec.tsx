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
import { ProcedureLocalRepository } from '../../../db/repositories/procedure-local-repository';
import { FinancialLocalRepository } from '../../../db/repositories/financial-local-repository';
import { AppointmentDetailsDrawer } from '../components/AppointmentDetailsDrawer';
import { CheckoutDrawer } from '../../checkout/components/CheckoutDrawer';
import { LocalAppointmentWithDetails } from '../types';

describe('Feature: bloqueio-recorrencia-parcelamento-checkout (TM-AGE-04 / TM-FIN-01)', () => {
  let testDb: CliniAssistLocalDB;
  let appointmentRepo: AppointmentLocalRepository;
  let patientRepo: PatientLocalRepository;
  let procedureRepo: ProcedureLocalRepository;
  let financialRepo: FinancialLocalRepository;
  const tenantId = 'tenant-test-bloqueio-parcelamento';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-bloqueio-${Date.now()}-${Math.random()}`);
    await testDb.open();
    appointmentRepo = new AppointmentLocalRepository(testDb);
    patientRepo = new PatientLocalRepository(testDb);
    procedureRepo = new ProcedureLocalRepository(testDb);
    financialRepo = new FinancialLocalRepository(testDb);
  });

  // AC-100
  it('AC-100: Bloqueio visual de ações rápidas de status e edição em consultas concluídas @spec:AC-100', async () => {
    const mockCompletedApp: LocalAppointmentWithDetails = {
      id: 'app-completed-100',
      tenant_id: tenantId,
      patient_id: 'pat-1',
      patient_name: 'Carlos Alberto',
      patient_whatsapp: '11988887777',
      start_time: '2026-10-19T10:00:00.000Z',
      end_time: '2026-10-19T10:30:00.000Z',
      status: 'COMPLETED',
      is_extra_fit: false,
      procedures: [
        {
          id: 'proc-1',
          tenant_id: tenantId,
          name: 'Restauração',
          default_duration_minutes: 30,
          default_price_cents: 15000,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    };

    render(
      <AppointmentDetailsDrawer
        isOpen={true}
        appointment={mockCompletedApp}
        onClose={vi.fn()}
        onStatusChanged={vi.fn()}
        onOpenReschedule={vi.fn()}
        appointmentRepo={appointmentRepo}
        procedureRepo={procedureRepo}
        financialRepo={financialRepo}
        tenantId={tenantId}
      />
    );

    // 1. O botão de editar/alterar procedimentos não deve existir
    expect(screen.queryByRole('button', { name: /Alterar Procedimentos/i })).toBeNull();

    // 2. Os botões de transição comum de status não devem existir
    expect(screen.queryByRole('button', { name: /Confirmar Presença/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Remarcar Consulta/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Paciente Faltou/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Concluir Atendimento/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Cancelar este agendamento/i })).toBeNull();

    // 3. O banner verde informativo de faturamento concluído deve ser visível
    const banner = screen.getByTestId('completed-locked-banner');
    expect(banner).toBeDefined();
    expect(banner.textContent).toContain('Atendimento Concluído & Faturado');

    // 4. O botão de estorno deve estar presente no banner
    expect(screen.getByTestId('btn-trigger-revert')).toBeDefined();
    expect(screen.getByText(/Estornar Pagamento e Reabrir Consulta/i)).toBeDefined();
  });

  // AC-101
  it('AC-101: Proteção idempotente no repositório financeiro contra checkout duplicado @spec:AC-101', async () => {
    // 1. Cria agendamento inicial
    const createdPatient = await patientRepo.createPatient({
      tenant_id: tenantId,
      name: 'Juliana Paes',
      whatsapp: '11911112222',
    });

    const { appointment } = await appointmentRepo.createAppointment({
      tenant_id: tenantId,
      patient_id: createdPatient.id,
      start_time: '2026-10-19T11:00:00.000Z',
      end_time: '2026-10-19T11:30:00.000Z',
      status: 'CONFIRMED',
      items: [],
    });

    // 2. Primeiro faturamento do agendamento
    await financialRepo.recordCheckout({
      tenantId,
      appointmentId: appointment.id,
      totalCents: 20000,
      paymentMethod: 'PIX',
      installments: [
        {
          installmentNumber: 1,
          totalInstallments: 1,
          dueDate: '2026-10-19',
          amountCents: 20000,
          status: 'PAID',
          paymentDate: '2026-10-19',
          description: 'Consulta Realizada',
        },
      ],
    });

    // 3. Tenta faturar novamente o mesmo agendamento -> deve lançar erro
    await expect(
      financialRepo.recordCheckout({
        tenantId,
        appointmentId: appointment.id,
        totalCents: 20000,
        paymentMethod: 'PIX',
        installments: [
          {
            installmentNumber: 1,
            totalInstallments: 1,
            dueDate: '2026-10-19',
            amountCents: 20000,
            status: 'PAID',
            paymentDate: '2026-10-19',
            description: 'Segunda Tentativa Faturamento',
          },
        ],
      })
    ).rejects.toThrow(/já possui faturamento registrado/i);

    // 4. Confirma que existe apenas 1 transação registrada no banco
    const txs = await testDb.financial_transactions
      .where('appointment_id')
      .equals(appointment.id)
      .toArray();
    expect(txs.length).toBe(1);
    expect(txs[0].description).toBe('Consulta Realizada');
  });

  // AC-102
  it('AC-102: Integração nativa do formulário de parcelamento com entrada e vencimentos no checkout @spec:AC-102', async () => {
    const user = userEvent.setup();
    const onCompleteCheckout = vi.fn();

    const mockApp: LocalAppointmentWithDetails = {
      id: 'app-parcelado-102',
      tenant_id: tenantId,
      patient_id: 'pat-2',
      patient_name: 'Roberto Silva',
      patient_whatsapp: '11944445555',
      start_time: '2026-10-19T14:00:00.000Z',
      end_time: '2026-10-19T14:45:00.000Z',
      status: 'CONFIRMED',
      procedures: [
        {
          id: 'proc-parc',
          tenant_id: tenantId,
          name: 'Tratamento de Canal',
          default_duration_minutes: 45,
          default_price_cents: 60000, // R$ 600,00
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    };

    render(
      <CheckoutDrawer
        isOpen={true}
        appointment={mockApp}
        onClose={vi.fn()}
        onCompleteCheckout={onCompleteCheckout}
      />
    );

    // Clica na opção "Parcelado"
    const parceladoBtn = screen.getByRole('button', { name: /^Parcelado$/i });
    await user.click(parceladoBtn);

    // Os campos de entrada e parcelas devem ser renderizados imediatamente
    await waitFor(() => {
      expect(screen.getByLabelText('Valor de entrada')).toBeDefined();
      expect(screen.getByLabelText('Número de parcelas')).toBeDefined();
      expect(screen.getByTestId('installments-preview')).toBeDefined();
    });

    // Define entrada de R$ 100,00
    const entryInput = screen.getByLabelText('Valor de entrada');
    fireEvent.change(entryInput, { target: { value: '100.00' } });

    // Define 2 parcelas
    const installmentsSelect = screen.getByLabelText('Número de parcelas');
    fireEvent.change(installmentsSelect, { target: { value: '2' } });

    // Confirma se a prévia calculou: Entrada (100) + 2 parcelas de 250
    await waitFor(() => {
      const preview = screen.getByTestId('installments-preview');
      expect(preview.textContent).toContain('Entrada (Hoje)');
      expect(preview.textContent).toContain('Parcela 1/2');
      expect(preview.textContent).toContain('Parcela 2/2');
    });

    // Clica em "Concluir Atendimento & Receber"
    const submitBtn = screen.getByRole('button', { name: /Concluir Atendimento & Receber/i });
    await user.click(submitBtn);

    // Verifica se onCompleteCheckout recebeu os dados estruturados do parcelamento
    expect(onCompleteCheckout).toHaveBeenCalledTimes(1);
    const checkoutResult = onCompleteCheckout.mock.calls[0][0];
    expect(checkoutResult.paymentMethod).toBe('PARCELADO');
    expect(checkoutResult.totalCents).toBe(60000);
    expect(checkoutResult.installments).toBeDefined();
    expect(checkoutResult.installments.length).toBe(3); // 1 entrada + 2 parcelas

    // Entrada paga hoje
    expect(checkoutResult.installments[0].installmentNumber).toBe(0);
    expect(checkoutResult.installments[0].amountCents).toBe(10000);
    expect(checkoutResult.installments[0].status).toBe('PAID');

    // Parcelas pendentes
    expect(checkoutResult.installments[1].installmentNumber).toBe(1);
    expect(checkoutResult.installments[1].amountCents).toBe(25000);
    expect(checkoutResult.installments[1].status).toBe('PENDING');

    expect(checkoutResult.installments[2].installmentNumber).toBe(2);
    expect(checkoutResult.installments[2].amountCents).toBe(25000);
    expect(checkoutResult.installments[2].status).toBe('PENDING');
  });

  // AC-103
  it('AC-103: Estorno financeiro com desativação de transações e reabertura do agendamento para CONFIRMED @spec:AC-103', async () => {
    const user = userEvent.setup();

    // 1. Cria agendamento e paciente
    const createdPatient = await patientRepo.createPatient({
      tenant_id: tenantId,
      name: 'Fernanda Montenegro',
      whatsapp: '11933332222',
    });

    const { appointment } = await appointmentRepo.createAppointment({
      tenant_id: tenantId,
      patient_id: createdPatient.id,
      start_time: '2026-10-19T15:00:00.000Z',
      end_time: '2026-10-19T15:30:00.000Z',
      status: 'CONFIRMED',
      items: [],
    });

    // 2. Fatura com 1 entrada e 1 parcela pendente
    await financialRepo.recordCheckout({
      tenantId,
      appointmentId: appointment.id,
      totalCents: 30000,
      paymentMethod: 'PARCELADO',
      installments: [
        {
          installmentNumber: 0,
          totalInstallments: 1,
          dueDate: '2026-10-19',
          amountCents: 10000,
          status: 'PAID',
          paymentDate: '2026-10-19',
          description: 'Entrada Consulta',
        },
        {
          installmentNumber: 1,
          totalInstallments: 1,
          dueDate: '2026-11-19',
          amountCents: 20000,
          status: 'PENDING',
          paymentDate: null,
          description: 'Parcela 1/1',
        },
      ],
    });

    // Confirma que o agendamento foi para COMPLETED e tem 2 transações ativas
    const appCompleted = await testDb.appointments.get(appointment.id);
    expect(appCompleted?.status).toBe('COMPLETED');

    const initialTxs = await testDb.financial_transactions
      .where('appointment_id')
      .equals(appointment.id)
      .toArray();
    expect(initialTxs.length).toBe(2);
    expect(initialTxs.every((t) => t.is_active && !t.deleted_at)).toBe(true);

    const onStatusChanged = vi.fn();

    const mockAppWithDetails: LocalAppointmentWithDetails = {
      ...appCompleted!,
      patient_name: createdPatient.name,
      patient_whatsapp: createdPatient.whatsapp,
    };

    // 3. Renderiza o drawer de detalhes do agendamento concluído
    const { rerender } = render(
      <AppointmentDetailsDrawer
        isOpen={true}
        appointment={mockAppWithDetails}
        onClose={vi.fn()}
        onStatusChanged={onStatusChanged}
        onOpenReschedule={vi.fn()}
        appointmentRepo={appointmentRepo}
        procedureRepo={procedureRepo}
        financialRepo={financialRepo}
        tenantId={tenantId}
      />
    );

    // Clica no botão de estorno
    const revertBtn = screen.getByTestId('btn-trigger-revert');
    await user.click(revertBtn);

    // Caixa de confirmação de segurança deve aparecer
    expect(screen.getByTestId('revert-confirm-box')).toBeDefined();
    expect(screen.getByText(/Confirmar estorno/i)).toBeDefined();

    // Clica no botão de confirmação "Sim, Estornar"
    const confirmRevertBtn = screen.getByTestId('btn-confirm-revert');
    await user.click(confirmRevertBtn);

    // 4. Valida que o método de estorno foi executado
    await waitFor(async () => {
      // Agendamento volta para CONFIRMED
      const appReverted = await testDb.appointments.get(appointment.id);
      expect(appReverted?.status).toBe('CONFIRMED');

      // Todas as transações do agendamento receberam soft-delete
      const updatedTxs = await testDb.financial_transactions
        .where('appointment_id')
        .equals(appointment.id)
        .toArray();
      expect(updatedTxs.length).toBe(2);
      expect(updatedTxs.every((t) => t.is_active === false && Boolean(t.deleted_at))).toBe(true);

      // Callback foi acionado notificando a alteração
      expect(onStatusChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          id: appointment.id,
          status: 'CONFIRMED',
        })
      );
    });
  });
});
