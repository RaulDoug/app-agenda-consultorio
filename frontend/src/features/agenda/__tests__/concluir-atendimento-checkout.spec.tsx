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
import { App } from '../../../App';
import { LocalAppointmentWithDetails } from '../types';

describe('Feature: checkout-conclusao-agenda (TM-AGE-04 / TM-FIN-01)', () => {
  let testDb: CliniAssistLocalDB;
  let appointmentRepo: AppointmentLocalRepository;
  let patientRepo: PatientLocalRepository;
  let procedureRepo: ProcedureLocalRepository;
  let financialRepo: FinancialLocalRepository;
  const tenantId = 'tenant-test-checkout-agenda';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-checkout-agenda-${Date.now()}-${Math.random()}`);
    await testDb.open();
    appointmentRepo = new AppointmentLocalRepository(testDb);
    patientRepo = new PatientLocalRepository(testDb);
    procedureRepo = new ProcedureLocalRepository(testDb);
    financialRepo = new FinancialLocalRepository(testDb);
  });

  // AC-098
  it('AC-098: Abertura da gaveta de checkout e baixa financeira com atualização de status ao concluir atendimento @spec:AC-098', async () => {
    const user = userEvent.setup();

    // 1. Validação unitária da gaveta: clicar em Concluir Atendimento aciona onOpenCheckout
    const onOpenCheckout = vi.fn();
    const mockApp: LocalAppointmentWithDetails = {
      id: 'app-test-098',
      tenant_id: tenantId,
      patient_id: 'pat-1',
      patient_name: 'Ana Souza',
      patient_whatsapp: '11999998888',
      start_time: '2026-10-19T09:00:00.000Z',
      end_time: '2026-10-19T09:30:00.000Z',
      status: 'CONFIRMED',
      is_extra_fit: false,
      procedures: [
        {
          id: 'proc-1',
          tenant_id: tenantId,
          name: 'Limpeza Dental',
          default_duration_minutes: 30,
          default_price_cents: 18000,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    };

    const { unmount } = render(
      <AppointmentDetailsDrawer
        isOpen={true}
        appointment={mockApp}
        onClose={vi.fn()}
        onStatusChanged={vi.fn()}
        onOpenReschedule={vi.fn()}
        onOpenCheckout={onOpenCheckout}
      />
    );

    const btnConcluir = screen.getByRole('button', { name: /^✔️?\s*Concluir Atendimento$/i });
    await user.click(btnConcluir);
    expect(onOpenCheckout).toHaveBeenCalledTimes(1);
    expect(onOpenCheckout).toHaveBeenCalledWith(mockApp);
    unmount();

    // 2. Validação integrada: fluxo completo no App com baixa financeira e status COMPLETED
    const createdPatient = await patientRepo.createPatient({
      tenant_id: tenantId,
      name: 'Carlos Oliveira',
      whatsapp: '11988887777',
    });

    const createdProc = await procedureRepo.createProcedure({
      tenant_id: tenantId,
      name: 'Profilaxia',
      default_duration_minutes: 30,
      default_price_cents: 20000, // R$ 200,00
    });

    const start = new Date();
    start.setHours(9, 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60000);
    const { appointment: createdApp } = await appointmentRepo.createAppointment({
      tenant_id: tenantId,
      patient_id: createdPatient.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: 'CONFIRMED',
      items: [
        {
          procedure_id: createdProc.id,
          effective_price_cents: 20000,
          duration_minutes: 30,
        },
      ],
    });

    render(<App db={testDb} tenantId={tenantId} initialTab="agenda" />);

    // Localiza e clica no card do agendamento para abrir os detalhes
    await waitFor(() => {
      expect(screen.getByTestId(`appointment-card-${createdApp.id}`)).toBeDefined();
    });

    const card = screen.getByTestId(`appointment-card-${createdApp.id}`);
    await user.click(card);

    // Na gaveta de detalhes, clica em "Concluir Atendimento"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^✔️?\s*Concluir Atendimento$/i })).toBeDefined();
    });
    await user.click(screen.getByRole('button', { name: /^✔️?\s*Concluir Atendimento$/i }));

    // A gaveta de checkout deve se abrir exibindo o título do checkout
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Checkout.*Conclusão/i })).toBeDefined();
    });

    // Submete o checkout clicando em "Concluir Atendimento & Receber"
    const submitCheckoutBtn = screen.getByRole('button', { name: /Concluir Atendimento & Receber/i });
    await user.click(submitCheckoutBtn);

    // Valida no banco local que o status foi atualizado para COMPLETED e a transação foi salva com status PAID
    await waitFor(async () => {
      const updatedApp = await testDb.appointments.get(createdApp.id);
      expect(updatedApp?.status).toBe('COMPLETED');

      const txs = await testDb.financial_transactions.where('appointment_id').equals(createdApp.id).toArray();
      expect(txs.length).toBe(1);
      expect(txs[0].amount_cents).toBe(20000);
      expect(txs[0].status).toBe('PAID');
    });
  });

  // AC-099
  it('AC-099: Edição de valores de procedimentos e seleção de forma de pagamento no fluxo de encerramento da consulta @spec:AC-099', async () => {
    const user = userEvent.setup();

    const createdPatient = await patientRepo.createPatient({
      tenant_id: tenantId,
      name: 'Mariana Duarte',
      whatsapp: '11977776666',
    });

    const createdProc = await procedureRepo.createProcedure({
      tenant_id: tenantId,
      name: 'Restauração Resina',
      default_duration_minutes: 45,
      default_price_cents: 25000, // R$ 250,00
    });

    const start = new Date();
    start.setHours(14, 0, 0, 0);
    const end = new Date(start.getTime() + 45 * 60000);
    const { appointment: createdApp } = await appointmentRepo.createAppointment({
      tenant_id: tenantId,
      patient_id: createdPatient.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: 'CONFIRMED',
      items: [
        {
          procedure_id: createdProc.id,
          effective_price_cents: 25000,
          duration_minutes: 45,
        },
      ],
    });

    render(<App db={testDb} tenantId={tenantId} initialTab="agenda" />);

    await waitFor(() => {
      expect(screen.getByTestId(`appointment-card-${createdApp.id}`)).toBeDefined();
    });

    const card = screen.getByTestId(`appointment-card-${createdApp.id}`);
    await user.click(card);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^✔️?\s*Concluir Atendimento$/i })).toBeDefined();
    });
    await user.click(screen.getByRole('button', { name: /^✔️?\s*Concluir Atendimento$/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Checkout.*Conclusão/i })).toBeDefined();
    });

    // 1. Testa cancelamento no checkout: agendamento permanece CONFIRMED e nenhuma transação é gerada
    const cancelBtn = screen.getByRole('button', { name: /^Cancelar$/i });
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Checkout.*Conclusão/i })).toBeNull();
    });

    const unchangedApp = await testDb.appointments.get(createdApp.id);
    expect(unchangedApp?.status).toBe('CONFIRMED');
    const noTxs = await testDb.financial_transactions.where('appointment_id').equals(createdApp.id).toArray();
    expect(noTxs.length).toBe(0);

    // 2. Reabre e agora altera forma de pagamento para Dinheiro e ajusta valor com desconto
    await user.click(card);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^✔️?\s*Concluir Atendimento$/i })).toBeDefined();
    });
    await user.click(screen.getByRole('button', { name: /^✔️?\s*Concluir Atendimento$/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Checkout.*Conclusão/i })).toBeDefined();
    });

    // Seleciona forma de pagamento "DINHEIRO"
    const dinheiroBtn = screen.getByRole('button', { name: 'DINHEIRO' });
    await user.click(dinheiroBtn);

    // Altera o Total final cobrado para R$ 200,00 (dando R$ 50 de desconto)
    const totalInput = screen.getByLabelText('Total final');
    fireEvent.change(totalInput, { target: { value: '200.00' } });

    // Submete a conclusão do checkout
    const submitBtn = screen.getByRole('button', { name: /Concluir Atendimento & Receber/i });
    await user.click(submitBtn);

    // Verifica no banco de dados local a baixa correta: status COMPLETED, valor 20000 e método DINHEIRO
    await waitFor(async () => {
      const finalApp = await testDb.appointments.get(createdApp.id);
      expect(finalApp?.status).toBe('COMPLETED');

      const txs = await testDb.financial_transactions.where('appointment_id').equals(createdApp.id).toArray();
      expect(txs.length).toBe(1);
      expect(txs[0].amount_cents).toBe(20000);
      expect(txs[0].payment_method).toBe('DINHEIRO');
      expect(txs[0].status).toBe('PAID');
    });
  });
});
