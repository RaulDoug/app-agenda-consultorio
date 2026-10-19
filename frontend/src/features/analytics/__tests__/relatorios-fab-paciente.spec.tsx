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
import { BottomNav } from '../../../components/layout/BottomNav';
import { MoreMenuHub } from '../../../components/layout/MoreMenuHub';
import { ReportsView } from '../components/ReportsView';
import { CreatePatientModal } from '../../patients/components/CreatePatientModal';
import { PatientList } from '../../patients/components/PatientList';
import { App } from '../../../App';

describe('Feature: relatorios-fab-cadastro-paciente', () => {
  let testDb: CliniAssistLocalDB;
  let appointmentRepo: AppointmentLocalRepository;
  let patientRepo: PatientLocalRepository;
  let procedureRepo: ProcedureLocalRepository;
  let financialRepo: FinancialLocalRepository;
  const tenantId = 'tenant-test-relatorios-fab';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-relatorios-${Date.now()}-${Math.random()}`);
    await testDb.open();
    appointmentRepo = new AppointmentLocalRepository(testDb);
    patientRepo = new PatientLocalRepository(testDb);
    procedureRepo = new ProcedureLocalRepository(testDb);
    financialRepo = new FinancialLocalRepository(testDb);
  });

  // AC-104
  it('AC-104: Botão central + flutuante na barra inferior para acionamento direto do agendamento rápido @spec:AC-104', async () => {
    const user = userEvent.setup();
    const onQuickAppointment = vi.fn();

    render(
      <BottomNav
        activeTab="agenda"
        onTabChange={vi.fn()}
        onQuickAppointment={onQuickAppointment}
      />
    );

    // O botão FAB deve estar presente e posicionado no centro
    const fabButton = screen.getByTestId('bottom-nav-fab');
    expect(fabButton).toBeDefined();

    // Ao clicar no FAB, o callback onQuickAppointment deve ser acionado imediatamente
    await user.click(fabButton);
    expect(onQuickAppointment).toHaveBeenCalledTimes(1);
  });

  // AC-105
  it('AC-105: Distribuição de navegação mobile (Agenda, Caixa, [+], Relatórios, Mais) com acesso a Clientes e Ajustes @spec:AC-105', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();

    render(
      <BottomNav
        activeTab="agenda"
        onTabChange={onTabChange}
        onQuickAppointment={vi.fn()}
      />
    );

    // Verifica os 5 itens da barra inferior
    expect(screen.getByTestId('nav-tab-agenda')).toBeDefined();
    expect(screen.getByTestId('nav-tab-caixa')).toBeDefined();
    expect(screen.getByTestId('bottom-nav-fab')).toBeDefined();
    expect(screen.getByTestId('nav-tab-relatorios')).toBeDefined();
    expect(screen.getByTestId('nav-tab-mais')).toBeDefined();

    // Testa a navegação para o hub "Mais"
    await user.click(screen.getByTestId('nav-tab-mais'));
    expect(onTabChange).toHaveBeenCalledWith('mais');

    // Valida que o MoreMenuHub dá acesso a Clientes e Ajustes
    const onSelectSection = vi.fn();
    render(<MoreMenuHub onSelectSection={onSelectSection} patientCount={12} />);

    expect(screen.getByTestId('more-card-clientes')).toBeDefined();
    expect(screen.getByTestId('more-card-ajustes')).toBeDefined();

    await user.click(screen.getByTestId('more-card-clientes'));
    expect(onSelectSection).toHaveBeenCalledWith('clientes');

    await user.click(screen.getByTestId('more-card-ajustes'));
    expect(onSelectSection).toHaveBeenCalledWith('ajustes');
  });

  // AC-106
  it('AC-106: Tela de Relatórios com indicadores de No-Show, DRE simplificado, projeção futura e ranking de procedimentos @spec:AC-106', async () => {
    // 1. Cria procedimentos
    const procA = await procedureRepo.createProcedure({
      tenant_id: tenantId,
      name: 'Implante Dentário',
      default_duration_minutes: 60,
      default_price_cents: 150000, // R$ 1.500,00
    });

    const procB = await procedureRepo.createProcedure({
      tenant_id: tenantId,
      name: 'Limpeza Dental',
      default_duration_minutes: 30,
      default_price_cents: 20000, // R$ 200,00
    });

    // 2. Cria paciente
    const patient = await patientRepo.createPatient({
      tenant_id: tenantId,
      name: 'Lucas Mendes',
      whatsapp: '11988887777',
    });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 3. Cria agendamentos: 1 COMPLETED procA, 1 COMPLETED procB, 1 NO_SHOW procB
    const { appointment: app1 } = await appointmentRepo.createAppointment({
      tenant_id: tenantId,
      patient_id: patient.id,
      start_time: `${todayStr}T09:00:00.000Z`,
      end_time: `${todayStr}T10:00:00.000Z`,
      status: 'COMPLETED',
      items: [{ procedure_id: procA.id, effective_price_cents: 150000, duration_minutes: 60 }],
    });

    const { appointment: app2 } = await appointmentRepo.createAppointment({
      tenant_id: tenantId,
      patient_id: patient.id,
      start_time: `${todayStr}T11:00:00.000Z`,
      end_time: `${todayStr}T11:30:00.000Z`,
      status: 'COMPLETED',
      items: [{ procedure_id: procB.id, effective_price_cents: 20000, duration_minutes: 30 }],
    });

    const { appointment: app3 } = await appointmentRepo.createAppointment({
      tenant_id: tenantId,
      patient_id: patient.id,
      start_time: `${todayStr}T14:00:00.000Z`,
      end_time: `${todayStr}T14:30:00.000Z`,
      status: 'NO_SHOW',
      items: [{ procedure_id: procB.id, effective_price_cents: 20000, duration_minutes: 30 }],
    });

    // 4. Cria transações financeiras (Receita R$ 1.700,00 paga, Despesa R$ 300,00 paga, e Parcela R$ 400,00 pendente em 20 dias)
    await financialRepo.recordExpense({
      tenantId,
      category: 'MATERIAIS',
      amountCents: 30000,
      description: 'Materiais Cirúrgicos',
      paymentDate: todayStr,
    });

    // Transação de receita recebida
    await testDb.financial_transactions.add({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      type: 'INCOME',
      category: 'ATENDIMENTO',
      amount_cents: 170000,
      status: 'PAID',
      due_date: todayStr,
      payment_date: todayStr,
      installment_number: 1,
      total_installments: 1,
      is_active: true,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });

    // Parcela futura pendente
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 20);
    await testDb.financial_transactions.add({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      type: 'INCOME',
      category: 'ATENDIMENTO',
      amount_cents: 40000,
      status: 'PENDING',
      due_date: futureDate.toISOString().split('T')[0],
      installment_number: 2,
      total_installments: 2,
      is_active: true,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });

    const allApps = await testDb.appointments.toArray();
    const allItems = await testDb.appointment_items.toArray();
    const allProcs = await testDb.procedures.toArray();
    const allTxs = await testDb.financial_transactions.toArray();
    const allPatients = await testDb.patients.toArray();

    render(
      <ReportsView
        appointments={allApps}
        appointmentItems={allItems}
        procedures={allProcs}
        transactions={allTxs}
        patients={allPatients}
      />
    );

    // Valida No-Show: 1 falta em 3 agendamentos = 33.3%, perda R$ 200,00
    const noShowCard = screen.getByTestId('metric-card-noshow');
    expect(noShowCard.textContent).toContain('33.3%');
    expect(noShowCard.textContent).toContain('200.00');

    // Valida DRE: Receitas R$ 1.700,00, Despesas R$ 300,00, Lucro Líquido R$ 1.400,00
    const dreCard = screen.getByTestId('metric-card-dre');
    expect(dreCard.textContent).toContain('1700.00');
    expect(dreCard.textContent).toContain('300.00');
    expect(dreCard.textContent).toContain('1400.00');

    // Valida Projeção de Recebíveis (próximos 30 dias: R$ 400,00)
    const projectionCard = screen.getByTestId('metric-card-projection');
    expect(projectionCard.textContent).toContain('400.00');

    // Valida Ranking de Procedimentos: Implante Dentário em 1º (R$ 1.500,00)
    const rankingTable = screen.getByTestId('procedures-ranking-table');
    expect(rankingTable.textContent).toContain('Implante Dentário');
    expect(rankingTable.textContent).toContain('1500.00');
    expect(rankingTable.textContent).toContain('Limpeza Dental');
  });

  // AC-107
  it('AC-107: Cadastro direto de novo paciente com validação de dados a partir da tela de Clientes @spec:AC-107', async () => {
    const user = userEvent.setup();
    const onPatientCreated = vi.fn();

    // 1. Renderiza CreatePatientModal
    render(
      <CreatePatientModal
        isOpen={true}
        onClose={vi.fn()}
        tenantId={tenantId}
        patientRepo={patientRepo}
        onPatientCreated={onPatientCreated}
      />
    );

    // Valida que o modal está aberto
    expect(screen.getByTestId('create-patient-modal')).toBeDefined();

    // Tenta submeter sem nome -> deve exibir validação
    const submitBtn = screen.getByRole('button', { name: /Cadastrar Paciente/i });
    await user.click(submitBtn);
    expect(screen.getByText(/Informe o nome do paciente/i)).toBeDefined();

    // Preenche nome e WhatsApp inválido (< 10 dígitos)
    const nameInput = screen.getByLabelText(/Nome Completo/i);
    const phoneInput = screen.getByLabelText(/WhatsApp/i);

    fireEvent.change(nameInput, { target: { value: 'Marcos Vinicius' } });
    fireEvent.change(phoneInput, { target: { value: '123' } });
    await user.click(submitBtn);
    expect(screen.getByText(/mínimo 10 dígitos/i)).toBeDefined();

    // Preenche WhatsApp válido e submete
    fireEvent.change(phoneInput, { target: { value: '11977778888' } });
    await user.click(submitBtn);

    // Valida persistência no banco e callback
    await waitFor(async () => {
      const patients = await testDb.patients.toArray();
      const created = patients.find((p) => p.name === 'Marcos Vinicius');
      expect(created).toBeDefined();
      expect(created?.whatsapp).toBe('11977778888');
      expect(onPatientCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Marcos Vinicius',
          whatsapp: '11977778888',
        })
      );
    });
  });
});
