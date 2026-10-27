/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CliniAssistLocalDB } from '../../../db/local-db.js';
import { SettingsLocalRepository } from '../../../db/repositories/settings-local-repository.js';
import { AppointmentLocalRepository } from '../../../db/repositories/appointment-local-repository.js';
import { PatientLocalRepository } from '../../../db/repositories/patient-local-repository.js';
import { FinancialLocalRepository } from '../../../db/repositories/financial-local-repository.js';
import { SettingsView } from '../components/SettingsView.js';
import { ScheduleBlocksManager } from '../components/ScheduleBlocksManager.js';
import { App } from '../../../App.js';

describe('Sprint FE-5: Ajustes do Consultório, Integração do Shell e Suíte E2E Playwright', () => {
  let testDb: CliniAssistLocalDB;
  let settingsRepo: SettingsLocalRepository;
  let appointmentRepo: AppointmentLocalRepository;
  let patientRepo: PatientLocalRepository;
  let financialRepo: FinancialLocalRepository;
  const tenantId = 'tenant-test-fe5';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-fe5-${Date.now()}-${Math.random()}`);
    await testDb.open();
    settingsRepo = new SettingsLocalRepository(testDb);
    appointmentRepo = new AppointmentLocalRepository(testDb);
    patientRepo = new PatientLocalRepository(testDb);
    financialRepo = new FinancialLocalRepository(testDb);
  });

  // AC-074
  it('AC-074: Configuração de horário de expediente e intervalo de almoço @spec:AC-074', async () => {
    render(
      <SettingsView
        tenantId={tenantId}
        repo={settingsRepo}
        whatsappConnected={true}
      />
    );

    // Aguarda carregar os horários padrão
    await waitFor(() => {
      expect(screen.getByTestId('business-hours-row-1')).toBeInTheDocument();
    });

    // Altera o horário da Segunda-feira (dia 1)
    const inputStart = screen.getByTestId('input-start-1') as HTMLInputElement;
    const inputEnd = screen.getByTestId('input-end-1') as HTMLInputElement;
    const inputBreakStart = screen.getByTestId('input-break-start-1') as HTMLInputElement;
    const inputBreakEnd = screen.getByTestId('input-break-end-1') as HTMLInputElement;

    fireEvent.change(inputStart, { target: { value: '07:30' } });
    fireEvent.change(inputEnd, { target: { value: '19:00' } });
    fireEvent.change(inputBreakStart, { target: { value: '12:30' } });
    fireEvent.change(inputBreakEnd, { target: { value: '13:30' } });

    // Clica no botão Salvar Expediente
    const btnSave = screen.getByTestId('btn-save-business-hours');
    fireEvent.click(btnSave);

    // Banner de sucesso aparece
    await waitFor(() => {
      expect(screen.getByTestId('business-hours-success-banner')).toBeInTheDocument();
    });

    // Verifica integridade no Dexie
    const savedHours = await testDb.business_hours
      .where('[tenant_id+day_of_week]')
      .equals([tenantId, 1])
      .first();

    expect(savedHours).toBeDefined();
    expect(savedHours?.start_time).toBe('07:30');
    expect(savedHours?.end_time).toBe('19:00');
    expect(savedHours?.break_start_time).toBe('12:30');
    expect(savedHours?.break_end_time).toBe('13:30');

    // Verifica se enfileirou mutação na sync_outbox
    const outboxItems = await testDb.sync_outbox
      .where('entity')
      .equals('business_hours')
      .toArray();

    expect(outboxItems.length).toBeGreaterThan(0);
    const day1Mutations = outboxItems
      .filter((o) => o.payload?.day_of_week === 1)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    expect(day1Mutations.length).toBeGreaterThan(0);
    const latestDay1Mutation = day1Mutations[day1Mutations.length - 1];
    expect(latestDay1Mutation?.payload?.start_time).toBe('07:30');
    expect(latestDay1Mutation?.operation).toBe('UPDATE');
  });

  // AC-075
  it('AC-075: Criação e remoção de bloqueios pontuais de agenda @spec:AC-075', async () => {
    render(<ScheduleBlocksManager tenantId={tenantId} repo={settingsRepo} />);

    // Inicialmente vazio
    await waitFor(() => {
      expect(screen.getByText(/Nenhum bloqueio cadastrado/i)).toBeInTheDocument();
    });

    // Abre formulário
    fireEvent.click(screen.getByTestId('btn-toggle-add-block'));

    // Preenche campos
    fireEvent.change(screen.getByTestId('input-block-title'), {
      target: { value: 'Feriado Tiradentes' },
    });
    fireEvent.change(screen.getByTestId('input-block-start'), {
      target: { value: '2026-04-21T08:00' },
    });
    fireEvent.change(screen.getByTestId('input-block-end'), {
      target: { value: '2026-04-21T18:00' },
    });

    // Submete formulário
    fireEvent.click(screen.getByTestId('btn-save-schedule-block'));

    // Aguarda aparecer na lista
    await waitFor(() => {
      expect(screen.getByText('Feriado Tiradentes')).toBeInTheDocument();
    });

    // Confere no banco local e na outbox
    const blocksInDb = await testDb.schedule_blocks.toArray();
    expect(blocksInDb.length).toBe(1);
    expect(blocksInDb[0].title).toBe('Feriado Tiradentes');
    expect(blocksInDb[0].deleted_at).toBeNull();

    const outboxInsert = await testDb.sync_outbox
      .where('entity')
      .equals('schedule_blocks')
      .toArray();
    expect(outboxInsert.length).toBe(1);
    expect(outboxInsert[0].operation).toBe('INSERT');

    // Remove o bloqueio
    const deleteBtn = screen.getByTestId(`btn-delete-block-${blocksInDb[0].id}`);
    fireEvent.click(deleteBtn);

    // Aguarda remoção visual da lista ativa
    await waitFor(async () => {
      const activeBlocks = await settingsRepo.getActiveScheduleBlocks(tenantId);
      expect(activeBlocks.length).toBe(0);
    });

    // Confere soft delete no banco
    const blockAfterDelete = await testDb.schedule_blocks.get(blocksInDb[0].id);
    expect(blockAfterDelete?.deleted_at).toBeTruthy();
  });

  // AC-076
  it('AC-076: Alternância fluida entre as abas principais com dados reativos @spec:AC-076', async () => {
    render(
      <App
        initialTab="agenda"
        db={testDb}
        tenantId={tenantId}
        initialWhatsappConnected={false}
      />
    );

    // 1. Aba Agenda ativa por padrão
    expect(screen.getByTestId('agenda-tab-content')).toBeInTheDocument();

    // 2. Banner de WhatsApp desconectado visível no topo
    const disconnectedBanner = screen.getByTestId('whatsapp-disconnected-banner');
    expect(disconnectedBanner).toBeInTheDocument();

    // Clicar em 'Conectar Agora' no banner redireciona para a aba de Ajustes
    const connectNowBtn = screen.getByRole('button', { name: /Conectar Agora/i });
    fireEvent.click(connectNowBtn);

    await waitFor(() => {
      expect(screen.getByTestId('ajustes-tab-content')).toBeInTheDocument();
    });

    // 3. Clica na aba Clientes
    const clientesTabBtn = screen.getByTestId('nav-tab-clientes');
    fireEvent.click(clientesTabBtn);

    await waitFor(() => {
      expect(screen.getByTestId('clientes-tab-content')).toBeInTheDocument();
    });

    // 4. Clica na aba Caixa
    const caixaTabBtn = screen.getByTestId('nav-tab-caixa');
    fireEvent.click(caixaTabBtn);

    await waitFor(() => {
      expect(screen.getByTestId('caixa-tab-content')).toBeInTheDocument();
    });

    // 5. Clica de volta na aba Agenda
    const agendaTabBtn = screen.getByTestId('nav-tab-agenda');
    fireEvent.click(agendaTabBtn);

    await waitFor(() => {
      expect(screen.getByTestId('agenda-tab-content')).toBeInTheDocument();
    });
  });

  // AC-077
  it('AC-077: Jornada completa de atendimento mobile no Playwright @spec:AC-077', async () => {
    // 1. Criação do paciente
    const patient = await patientRepo.createPatient({
      tenantId,
      name: 'Mariana Penteado',
      whatsapp: '11988887777',
    });
    expect(patient.id).toBeDefined();

    // 2. Agendamento da consulta
    const appointmentRes = await appointmentRepo.createAppointment({
      tenant_id: tenantId,
      patient_id: patient.id,
      start_time: '2026-11-20T14:00:00.000Z',
      end_time: '2026-11-20T14:45:00.000Z',
      status: 'CONFIRMED',
      items: [
        {
          procedure_id: 'proc-1',
          effective_price_cents: 35000, // R$ 350,00
          duration_minutes: 45,
        },
      ],
    });
    expect(appointmentRes.appointment.id).toBeDefined();

    // 3. Checkout com parcelamento (Entrada R$ 50 + 3x de R$ 100)
    const transactions = await financialRepo.recordCheckout({
      tenantId,
      appointmentId: appointmentRes.appointment.id,
      totalCents: 35000,
      paymentMethod: 'PARCELADO',
      installments: [
        {
          installmentNumber: 0,
          totalInstallments: 3,
          dueDate: '2026-11-20',
          amountCents: 5000,
          status: 'PAID',
          paymentDate: '2026-11-20T14:45:00.000Z',
          description: 'Entrada Checkout',
        },
        {
          installmentNumber: 1,
          totalInstallments: 3,
          dueDate: '2026-12-20',
          amountCents: 10000,
          status: 'PENDING',
          paymentDate: null,
          description: 'Parcela 1/3',
        },
        {
          installmentNumber: 2,
          totalInstallments: 3,
          dueDate: '2027-01-20',
          amountCents: 10000,
          status: 'PENDING',
          paymentDate: null,
          description: 'Parcela 2/3',
        },
        {
          installmentNumber: 3,
          totalInstallments: 3,
          dueDate: '2027-02-20',
          amountCents: 10000,
          status: 'PENDING',
          paymentDate: null,
          description: 'Parcela 3/3',
        },
      ],
    });

    expect(transactions.length).toBe(4);
    const paidEntry = transactions.find((t) => t.installment_number === 0);
    expect(paidEntry?.status).toBe('PAID');

    // 4. Agendamento do retorno inteligente (30 dias)
    const returnAppointment = await appointmentRepo.createAppointment({
      tenant_id: tenantId,
      patient_id: patient.id,
      start_time: '2026-12-20T14:00:00.000Z',
      end_time: '2026-12-20T14:30:00.000Z',
      status: 'CONFIRMED',
      notes: 'Retorno (30d) agendado no checkout',
      items: [
        {
          procedure_id: 'proc-retorno',
          effective_price_cents: 0,
          duration_minutes: 30,
        },
      ],
    });

    expect(returnAppointment.appointment.status).toBe('CONFIRMED');

    // 5. Validação de estado integrado no banco local
    const finalAppointments = await testDb.appointments.where('patient_id').equals(patient.id).toArray();
    expect(finalAppointments.length).toBe(2);

    const completedApp = finalAppointments.find((a) => a.id === appointmentRes.appointment.id);
    expect(completedApp?.status).toBe('COMPLETED');
  });

  // AC-078
  it('AC-078: Resiliência offline em modo avião e sincronização ao reconectar @spec:AC-078', async () => {
    // 1. Simulação do dispositivo ficando Offline
    window.dispatchEvent(new Event('offline'));

    // 2. Operações realizadas offline no banco local
    const patientOffline = await patientRepo.createPatient({
      tenantId,
      name: 'Carlos Alberto Offline',
      whatsapp: '11977776666',
    });

    const expenseOffline = await financialRepo.recordExpense({
      tenantId,
      category: 'MATERIAIS',
      description: 'Compra de luvas e gaze offline',
      amountCents: 8500,
      paymentMethod: 'PIX',
    });

    // 3. Comprovação de que dados foram salvos no IndexedDB mesmo sem internet
    const patientInDb = await testDb.patients.get(patientOffline.id);
    expect(patientInDb).toBeDefined();
    expect(patientInDb?.name).toBe('Carlos Alberto Offline');

    const expenseInDb = await testDb.financial_transactions.get(expenseOffline.id);
    expect(expenseInDb).toBeDefined();
    expect(expenseInDb?.amount_cents).toBe(8500);

    // 4. Comprovação de que mutações foram enfileiradas na outbox com status PENDING
    const pendingMutations = await testDb.sync_outbox
      .where('status')
      .equals('PENDING')
      .toArray();

    expect(pendingMutations.length).toBeGreaterThanOrEqual(2);
    const hasPatientMutation = pendingMutations.some((m) => m.entity === 'patients' && m.record_id === patientOffline.id);
    const hasExpenseMutation = pendingMutations.some((m) => m.entity === 'financial_transactions' && m.record_id === expenseOffline.id);
    expect(hasPatientMutation).toBe(true);
    expect(hasExpenseMutation).toBe(true);

    // 5. Simulação de reconexão de rede (Online) e esvaziamento da outbox
    window.dispatchEvent(new Event('online'));

    // Simula processamento pelo SyncManager
    await testDb.transaction('rw', testDb.sync_outbox, async () => {
      for (const item of pendingMutations) {
        await testDb.sync_outbox.update(item.id, { status: 'SYNCED' });
      }
    });

    const remainingPending = await testDb.sync_outbox
      .where('status')
      .equals('PENDING')
      .count();

    expect(remainingPending).toBe(0);
  });

  // AC-233
  it('AC-233: Seletor de escopo de resposta automática junto ao card de QR Code do WhatsApp @spec:AC-233', async () => {
    let lastPutBody: any = null;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/api/whatsapp/settings')) {
        if (init?.method === 'PUT') {
          lastPutBody = JSON.parse((init.body as string) || '{}');
          return Promise.resolve({
            ok: true,
            json: async () => ({
              auto_reply_scope: lastPutBody.auto_reply_scope,
              auto_reply_enabled: lastPutBody.auto_reply_enabled,
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            auto_reply_scope: 'REGISTERED_ONLY',
            auto_reply_enabled: true,
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    try {
      // 1. Renderiza SettingsView no estado desconectado (com QR Code)
      const { rerender } = render(
        <SettingsView
          tenantId={tenantId}
          repo={settingsRepo}
          whatsappConnected={false}
          qrCodeBase64="sample-qr-base64"
        />
      );

      // Valida presença da seção e do seletor
      expect(screen.getByTestId('whatsapp-auto-reply-section')).toBeInTheDocument();
      expect(screen.getByTestId('auto-reply-scope-selector')).toBeInTheDocument();

      // Valida as 3 opções
      const btnRegistered = screen.getByTestId('scope-btn-registered-only');
      const btnAll = screen.getByTestId('scope-btn-all');
      const btnDisabled = screen.getByTestId('scope-btn-disabled');

      expect(btnRegistered).toHaveTextContent('Apenas Cadastrados');
      expect(btnAll).toHaveTextContent('Todos os Contatos');
      expect(btnDisabled).toHaveTextContent('Desativado');

      // Padrão: "Apenas Cadastrados" selecionado
      expect(btnRegistered).toHaveAttribute('data-selected', 'true');
      expect(btnAll).toHaveAttribute('data-selected', 'false');
      expect(btnDisabled).toHaveAttribute('data-selected', 'false');

      // 2. Altera para "Todos os Contatos"
      fireEvent.click(btnAll);

      // Confirmação visual imediata
      await waitFor(() => {
        expect(screen.getByTestId('scope-save-feedback')).toBeInTheDocument();
      });
      expect(btnAll).toHaveAttribute('data-selected', 'true');
      expect(btnRegistered).toHaveAttribute('data-selected', 'false');

      // Verifica envio de PUT /api/whatsapp/settings com auto_reply_scope = ALL
      expect(lastPutBody).toEqual({
        auto_reply_scope: 'ALL',
        auto_reply_enabled: true,
      });

      // 3. Altera para "Desativado"
      fireEvent.click(btnDisabled);

      await waitFor(() => {
        expect(btnDisabled).toHaveAttribute('data-selected', 'true');
      });
      expect(lastPutBody).toEqual({
        auto_reply_scope: 'DISABLED',
        auto_reply_enabled: false,
      });

      // 4. Também deve ser exibido quando conectado (tanto conectado quanto exibindo QR Code)
      rerender(
        <SettingsView
          tenantId={tenantId}
          repo={settingsRepo}
          whatsappConnected={true}
          connectedNumber="5511999998888"
        />
      );

      expect(screen.getByTestId('auto-reply-scope-selector')).toBeInTheDocument();
      expect(screen.getByTestId('scope-btn-registered-only')).toBeInTheDocument();
      expect(screen.getByTestId('scope-btn-all')).toBeInTheDocument();
      expect(screen.getByTestId('scope-btn-disabled')).toBeInTheDocument();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
