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
import { CashFlowDashboard } from '../components/CashFlowDashboard';
import { ReceivablesList } from '../components/ReceivablesList';
import { WhatsAppAlertBanner } from '../components/WhatsAppAlertBanner';
import { WhatsAppPairingView } from '../components/WhatsAppPairingView';
import { InactivePatientsList } from '../components/InactivePatientsList';
import { LocalFinancialTransaction, LocalPatient, LocalAppointment } from '../../../db/types';

describe('Sprint FE-4: Gestão Financeira de Caixa, Conexão WhatsApp e Reativação de Clientes', () => {
  let testDb: CliniAssistLocalDB;
  let financialRepo: FinancialLocalRepository;
  const tenantId = 'tenant-test-fe4';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-fe4-${Date.now()}-${Math.random()}`);
    await testDb.open();
    financialRepo = new FinancialLocalRepository(testDb);
  });

  // AC-070
  it('AC-070: Dashboard de Indicadores Financeiros (Entrou no Caixa, A Receber, Despesas e Lucro) @spec:AC-070', async () => {
    const todayStr = new Date().toISOString().split('T')[0];

    const transactions: LocalFinancialTransaction[] = [
      // Receita Paga: R$ 500,00
      {
        id: 'tx-1',
        tenant_id: tenantId,
        appointment_id: 'app-1',
        type: 'INCOME',
        category: 'ATENDIMENTO',
        description: 'Consulta Dr. Silva',
        amount_cents: 50000,
        payment_method: 'PIX',
        status: 'PAID',
        due_date: todayStr,
        payment_date: todayStr,
        installment_number: 1,
        total_installments: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      // Parcela a Receber: R$ 300,00
      {
        id: 'tx-2',
        tenant_id: tenantId,
        appointment_id: 'app-2',
        type: 'INCOME',
        category: 'ATENDIMENTO',
        description: 'Parcela 1/2 Tratamento',
        amount_cents: 30000,
        payment_method: 'PARCELADO',
        status: 'PENDING',
        due_date: todayStr,
        payment_date: null,
        installment_number: 1,
        total_installments: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      // Despesa Paga: R$ 150,00
      {
        id: 'tx-3',
        tenant_id: tenantId,
        appointment_id: null,
        type: 'EXPENSE',
        category: 'MATERIAIS',
        description: 'Compra de Resinas',
        amount_cents: 15000,
        payment_method: 'DINHEIRO',
        status: 'PAID',
        due_date: todayStr,
        payment_date: todayStr,
        installment_number: 1,
        total_installments: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    render(
      <CashFlowDashboard
        transactions={transactions}
        financialRepo={financialRepo}
      />
    );

    // Valida card: Entrou no Caixa (R$ 500.00)
    const incomeCard = screen.getByTestId('card-income-paid');
    expect(incomeCard.textContent).toContain('500.00');

    // Valida card: A Receber no Mês (R$ 300.00)
    const receivablesCard = screen.getByTestId('card-receivables-pending');
    expect(receivablesCard.textContent).toContain('300.00');

    // Valida card: Despesas Pagas (R$ 150.00)
    const expensesCard = screen.getByTestId('card-expenses-paid');
    expect(expensesCard.textContent).toContain('150.00');

    // Valida card: Lucro Líquido Real (500 - 150 = R$ 350.00)
    const profitCard = screen.getByTestId('card-net-profit');
    expect(profitCard.textContent).toContain('350.00');
  });

  // AC-071
  it('AC-071: Baixa Rápida de Parcelas Pendentes com Atualização Local e Outbox @spec:AC-071', async () => {
    // Insere parcela pendente diretamente no testDb
    const pendingTx: LocalFinancialTransaction = {
      id: 'tx-parcela-pendente-1',
      tenant_id: tenantId,
      appointment_id: 'app-3',
      type: 'INCOME',
      category: 'ATENDIMENTO',
      description: 'Parcela 2/3 - Carlos',
      amount_cents: 20000,
      payment_method: 'PARCELADO',
      status: 'PENDING',
      due_date: '2026-10-25',
      payment_date: null,
      installment_number: 2,
      total_installments: 3,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await testDb.financial_transactions.add(pendingTx);

    const onMarkPaidMock = vi.fn(async (id: string) => {
      await financialRepo.markAsPaid(id);
    });

    render(
      <ReceivablesList
        transactions={[pendingTx]}
        onMarkPaid={onMarkPaidMock}
      />
    );

    // Localiza a linha da parcela e clica em "✓ Dar Baixa"
    const row = screen.getByTestId(`receivable-row-${pendingTx.id}`);
    expect(row.textContent).toContain('Parcela 2/3 - Carlos');
    expect(row.textContent).toContain('R$ 200.00');

    const markPaidBtn = screen.getByRole('button', { name: /Dar Baixa/i });
    fireEvent.click(markPaidBtn);

    await waitFor(async () => {
      expect(onMarkPaidMock).toHaveBeenCalledWith(pendingTx.id);

      // Confirma que o status no Dexie mudou para PAID
      const updatedInDb = await testDb.financial_transactions.get(pendingTx.id);
      expect(updatedInDb?.status).toBe('PAID');
      expect(updatedInDb?.payment_date).toBeDefined();

      // Confirma que a mutação UPDATE foi enfileirada na sync_outbox
      const outboxEntries = await testDb.sync_outbox
        .where('record_id')
        .equals(pendingTx.id)
        .toArray();
      const updateEntry = outboxEntries.find((m) => m.operation === 'UPDATE');
      expect(updateEntry).toBeDefined();
    });
  });

  // AC-072
  it('AC-072: Tela de QR Code e Banner de Alerta de Desconexão @spec:AC-072', () => {
    const onConnectClick = vi.fn();

    // 1. Cenário: WhatsApp Desconectado
    const { rerender } = render(
      <div>
        <WhatsAppAlertBanner isConnected={false} onConnectClick={onConnectClick} />
        <WhatsAppPairingView isConnected={false} qrCodeBase64="sample-qr-base64" />
      </div>
    );

    // Valida banner de alerta vermelho presente
    expect(screen.getByTestId('whatsapp-disconnected-banner')).toBeDefined();
    expect(screen.getByText(/WhatsApp Desconectado!/i)).toBeDefined();

    // Valida imagem do QR Code renderizada na view
    expect(screen.getByTestId('whatsapp-qrcode-image')).toBeDefined();
    expect(screen.getByText('Desconectado')).toBeDefined();

    // Clica no botão do banner
    const connectBtn = screen.getByRole('button', { name: 'Conectar Agora' });
    fireEvent.click(connectBtn);
    expect(onConnectClick).toHaveBeenCalled();

    // 2. Cenário: WhatsApp Conectado
    rerender(
      <div>
        <WhatsAppAlertBanner isConnected={true} />
        <WhatsAppPairingView
          isConnected={true}
          connectedNumber="+55 (11) 98765-4321"
        />
      </div>
    );

    // Banner de alerta não deve mais existir
    expect(screen.queryByTestId('whatsapp-disconnected-banner')).toBeNull();

    // Badge e status verde presentes
    expect(screen.getByText('Conectado (Verde)')).toBeDefined();
    expect(screen.getByText('WhatsApp Conectado e Operacional')).toBeDefined();
    expect(screen.getByText(/Número conectado: \+55 \(11\) 98765-4321/i)).toBeDefined();
  });

  // AC-073
  it('AC-073: Lista de Pacientes Inativos (>180 dias) com Atalho Direto de WhatsApp @spec:AC-073', () => {
    const now = new Date(2026, 9, 18, 12, 0, 0, 0); // 18 de Outubro de 2026
    const nowTime = now.getTime();

    // Paciente A: Consulta há 200 dias (>180d) e SEM agendamento futuro -> DEVE APARECER
    const pA: LocalPatient = {
      id: 'pat-inativo-a',
      tenant_id: tenantId,
      name: 'Juliana Inativa',
      whatsapp: '11977776666',
      is_active: true,
      created_at: new Date(nowTime - 300 * 86400000).toISOString(),
      updated_at: new Date(nowTime - 300 * 86400000).toISOString(),
    };

    // Paciente B: Consulta há 200 dias (>180d), mas COM agendamento futuro em 5 dias -> NÃO DEVE APARECER
    const pB: LocalPatient = {
      id: 'pat-com-futuro-b',
      tenant_id: tenantId,
      name: 'Roberto Agendado',
      whatsapp: '11988885555',
      is_active: true,
      created_at: new Date(nowTime - 300 * 86400000).toISOString(),
      updated_at: new Date(nowTime - 300 * 86400000).toISOString(),
    };

    // Paciente C: Consulta recente há 30 dias (<180d) -> NÃO DEVE APARECER
    const pC: LocalPatient = {
      id: 'pat-recente-c',
      tenant_id: tenantId,
      name: 'Camila Recente',
      whatsapp: '11999994444',
      is_active: true,
      created_at: new Date(nowTime - 40 * 86400000).toISOString(),
      updated_at: new Date(nowTime - 40 * 86400000).toISOString(),
    };

    const past200DaysIso = new Date(nowTime - 200 * 86400000).toISOString();
    const past30DaysIso = new Date(nowTime - 30 * 86400000).toISOString();
    const future5DaysIso = new Date(nowTime + 5 * 86400000).toISOString();

    const appointments: LocalAppointment[] = [
      // Consulta concluída do Paciente A há 200 dias
      {
        id: 'app-pa-1',
        tenant_id: tenantId,
        patient_id: pA.id,
        start_time: past200DaysIso,
        end_time: past200DaysIso,
        status: 'COMPLETED',
        is_extra_fit: false,
        created_at: past200DaysIso,
        updated_at: past200DaysIso,
      },
      // Consulta concluída do Paciente B há 200 dias + agendamento no futuro
      {
        id: 'app-pb-1',
        tenant_id: tenantId,
        patient_id: pB.id,
        start_time: past200DaysIso,
        end_time: past200DaysIso,
        status: 'COMPLETED',
        is_extra_fit: false,
        created_at: past200DaysIso,
        updated_at: past200DaysIso,
      },
      {
        id: 'app-pb-futuro',
        tenant_id: tenantId,
        patient_id: pB.id,
        start_time: future5DaysIso,
        end_time: future5DaysIso,
        status: 'CONFIRMED',
        is_extra_fit: false,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      // Consulta concluída do Paciente C há 30 dias
      {
        id: 'app-pc-1',
        tenant_id: tenantId,
        patient_id: pC.id,
        start_time: past30DaysIso,
        end_time: past30DaysIso,
        status: 'COMPLETED',
        is_extra_fit: false,
        created_at: past30DaysIso,
        updated_at: past30DaysIso,
      },
    ];

    render(
      <InactivePatientsList
        patients={[pA, pB, pC]}
        appointments={appointments}
      />
    );

    // Valida que apenas Juliana Inativa aparece na lista
    expect(screen.getByText('Juliana Inativa')).toBeDefined();
    expect(screen.getByText(/\d+ dias sem retorno/i)).toBeDefined();
    expect(screen.queryByText('Roberto Agendado')).toBeNull();
    expect(screen.queryByText('Camila Recente')).toBeNull();

    // Valida botão com link direto para o WhatsApp com mensagem amigável
    const waLink = screen.getByLabelText('Chamar Juliana Inativa no WhatsApp') as HTMLAnchorElement;
    expect(waLink.href).toContain('https://wa.me/5511977776666?text=');
    expect(decodeURIComponent(waLink.href)).toContain('Olá Juliana, tudo bem? Já faz um tempo');
  });
});
