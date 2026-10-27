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
import { ScheduleGrid } from '../components/ScheduleGrid';
import { ViewModeSelector } from '../components/ViewModeSelector';
import { AppointmentCard } from '../components/AppointmentCard';
import { QuickAppointmentDrawer } from '../components/QuickAppointmentDrawer';
import { AppointmentDetailsDrawer } from '../components/AppointmentDetailsDrawer';
import { RescheduleModal } from '../components/RescheduleModal';
import { InlineProcedureForm } from '../components/InlineProcedureForm';
import { PatientList } from '../../patients/components/PatientList';
import { LocalAppointmentWithDetails } from '../types';
import { LocalAppointment, LocalPatient } from '../../../db/types';

describe('Sprint FE-2: Agenda de Atendimentos e Gestão de Clientes', () => {
  let testDb: CliniAssistLocalDB;
  let appointmentRepo: AppointmentLocalRepository;
  let patientRepo: PatientLocalRepository;
  let procedureRepo: ProcedureLocalRepository;
  const tenantId = 'tenant-test-fe2';

  beforeEach(async () => {
    testDb = new CliniAssistLocalDB(`test-fe2-${Date.now()}-${Math.random()}`);
    await testDb.open();
    appointmentRepo = new AppointmentLocalRepository(testDb);
    patientRepo = new PatientLocalRepository(testDb);
    procedureRepo = new ProcedureLocalRepository(testDb);
  });

  // AC-057
  it('AC-057: Renderização da Grade Diária com Slots de 30min e Alternância Dia/Semana/Mês @spec:AC-057', async () => {
    const testDate = new Date('2026-10-18T10:00:00.000Z');
    const onSlotClick = vi.fn();
    const onViewModeChange = vi.fn();

    // Renderiza seletor de visão
    const { rerender } = render(
      <div>
        <ViewModeSelector
          currentDate={testDate}
          viewMode="day"
          onViewModeChange={onViewModeChange}
          onPrevDate={vi.fn()}
          onNextDate={vi.fn()}
          onToday={vi.fn()}
        />
        <ScheduleGrid
          currentDate={testDate}
          viewMode="day"
          appointments={[]}
          onSlotClick={onSlotClick}
        />
      </div>
    );

    // Valida slots de 30 minutos (08:00, 08:30, 09:00, ...)
    expect(screen.getByTestId('schedule-slot-08:00')).toBeDefined();
    expect(screen.getByTestId('schedule-slot-08:30')).toBeDefined();
    expect(screen.getByTestId('schedule-slot-09:00')).toBeDefined();

    // Valida intervalo de almoço destacado
    expect(screen.getByTestId('lunch-slot-12:00')).toBeDefined();
    expect(screen.getAllByText('Intervalo de Almoço').length).toBeGreaterThan(0);

    // Clica para alternar visão para "Semana"
    const weekBtn = screen.getByRole('button', { name: 'Semana' });
    fireEvent.click(weekBtn);
    expect(onViewModeChange).toHaveBeenCalledWith('week');

    // Rerenderiza com visão "Semana"
    rerender(
      <ScheduleGrid
        currentDate={testDate}
        viewMode="week"
        appointments={[]}
        onSlotClick={onSlotClick}
      />
    );
    expect(screen.getByTestId('schedule-week-view')).toBeDefined();

    // Rerenderiza com visão "Mês"
    rerender(
      <ScheduleGrid
        currentDate={testDate}
        viewMode="month"
        appointments={[]}
        onSlotClick={onSlotClick}
      />
    );
    expect(screen.getByTestId('schedule-month-view')).toBeDefined();
  });

  // AC-058
  it('AC-058: Identidade Visual e Badges Semânticos dos Cards de Consulta @spec:AC-058', () => {
    const statuses: Array<LocalAppointment['status']> = [
      'CONFIRMED',
      'PENDING',
      'RESCHEDULE_REQUESTED',
      'MESSAGE_RECEIVED',
      'COMPLETED',
      'NO_SHOW',
    ];

    const sampleAppointments: LocalAppointmentWithDetails[] = statuses.map((status, idx) => ({
      id: `app-${idx}`,
      tenant_id: tenantId,
      patient_id: `patient-${idx}`,
      patient_name: `Paciente ${status}`,
      start_time: '2026-10-19T09:00:00.000Z',
      end_time: '2026-10-19T09:30:00.000Z',
      status,
      is_extra_fit: idx === 0, // Primeiro como encaixe
      notes: 'Consulta Padrão',
    }));

    render(
      <div data-testid="cards-container">
        {sampleAppointments.map((app) => (
          <AppointmentCard key={app.id} appointment={app} />
        ))}
      </div>
    );

    // Valida presença de rótulos dos badges semânticos
    expect(screen.getByText('Confirmado')).toBeDefined();
    expect(screen.getByText('Pendente')).toBeDefined();
    expect(screen.getByText('Reagendamento Solicitado')).toBeDefined();
    expect(screen.getByText('Mensagem Recebida')).toBeDefined();
    expect(screen.getByText('Concluído')).toBeDefined();
    expect(screen.getByText('Paciente Faltou')).toBeDefined();

    // Valida badge de Encaixe no primeiro
    expect(screen.getByText('⚡ Encaixe')).toBeDefined();
  });

  // AC-059
  it('AC-059: Gaveta de Criação Rápida ao Tocar em Slot Vago com Cadastro On-the-Fly @spec:AC-059', async () => {
    const user = userEvent.setup();
    const testDate = new Date('2026-10-18T14:00:00.000Z');
    const onCreated = vi.fn();
    const onClose = vi.fn();

    // Mock das repositórios no componente
    render(
      <QuickAppointmentDrawer
        isOpen={true}
        onClose={onClose}
        tenantId={tenantId}
        initialDate={testDate}
        initialTimeStr="14:00"
        existingAppointments={[]}
        appointmentRepo={appointmentRepo}
        patientRepo={patientRepo}
        procedureRepo={procedureRepo}
        onAppointmentCreated={onCreated}
      />
    );

    expect(screen.getByText('Novo Agendamento Rápido')).toBeDefined();

    // Digita nome de paciente novo
    const patientInput = screen.getByLabelText('Buscar paciente');
    await user.type(patientInput, 'Ana Maria');

    // Botão de cadastro inline deve surgir
    const createPatientBtn = await screen.findByText('+ Cadastrar "Ana Maria"');
    await user.click(createPatientBtn);

    // Preenche WhatsApp inline e salva paciente
    const phoneInput = screen.getByPlaceholderText('WhatsApp com DDD (Ex: 11987654321)');
    await user.type(phoneInput, '11999998888');

    const savePatientBtn = screen.getByRole('button', { name: 'Salvar Paciente' });
    await user.click(savePatientBtn);

    // Paciente selecionado com sucesso
    await waitFor(() => {
      expect(screen.getByText('Ana Maria')).toBeDefined();
      expect(screen.getByText('11999998888')).toBeDefined();
    });

    // Salva o agendamento
    const saveAppointmentBtn = screen.getByRole('button', { name: 'Salvar Agendamento' });
    await user.click(saveAppointmentBtn);

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  // AC-060
  it('AC-060: Aviso de Sobreposição (Encaixe) e Proteção Contra Duplo Clique @spec:AC-060', async () => {
    const user = userEvent.setup();
    const testDate = new Date(2026, 9, 18, 15, 0, 0, 0);
    const onCreated = vi.fn();

    // Agendamento já existente no horário das 15:00 às 15:30
    const existing: LocalAppointmentWithDetails[] = [
      {
        id: 'existing-1',
        tenant_id: tenantId,
        patient_id: 'p-1',
        patient_name: 'Carlos Antigo',
        start_time: testDate.toISOString(),
        end_time: new Date(testDate.getTime() + 30 * 60000).toISOString(),
        status: 'CONFIRMED',
        is_extra_fit: false,
      },
    ];

    render(
      <QuickAppointmentDrawer
        isOpen={true}
        onClose={vi.fn()}
        tenantId={tenantId}
        initialDate={testDate}
        initialTimeStr="15:00"
        existingAppointments={existing}
        appointmentRepo={appointmentRepo}
        patientRepo={patientRepo}
        procedureRepo={procedureRepo}
        onAppointmentCreated={onCreated}
      />
    );

    // Deve exibir aviso visual claro de Encaixe devido à sobreposição
    expect(screen.getByTestId('encaixe-warning')).toBeDefined();
    expect(screen.getByText(/Aviso de Encaixe:/i)).toBeDefined();

    // Cadastra paciente rapidamente
    const patientInput = screen.getByLabelText('Buscar paciente');
    await user.type(patientInput, 'Paciente Sobreposto');
    const createPatientBtn = await screen.findByText('+ Cadastrar "Paciente Sobreposto"');
    await user.click(createPatientBtn);
    const phoneInput = screen.getByPlaceholderText('WhatsApp com DDD (Ex: 11987654321)');
    await user.type(phoneInput, '11988887777');
    await user.click(screen.getByRole('button', { name: 'Salvar Paciente' }));

    await waitFor(() => {
      expect(screen.getByText('Paciente Sobreposto')).toBeDefined();
    });

    // Marca o checkbox de autorização de encaixe
    const encaixeCheckbox = screen.getByLabelText(/Permitir Encaixe/i);
    fireEvent.click(encaixeCheckbox);

    const submitBtn = screen.getByRole('button', { name: 'Salvar Agendamento' });

    // Testa prevenção de duplo clique: clicar 2 vezes rapidamente
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Callback deve ter sido disparado exatamente 1 vez
      expect(onCreated).toHaveBeenCalledTimes(1);
    });
  });

  // AC-061
  it('AC-061: Ação de 1 Toque para Marcar Falta (NO_SHOW) e Atualização de Status @spec:AC-061', async () => {
    // Cria paciente e agendamento no testDb
    const patient = await patientRepo.createPatient({
      tenant_id: tenantId,
      name: 'João Falta',
      whatsapp: '11911112222',
    });

    const created = await appointmentRepo.createAppointment({
      tenant_id: tenantId,
      patient_id: patient.id,
      start_time: '2026-10-18T10:00:00.000Z',
      end_time: '2026-10-18T10:30:00.000Z',
      status: 'CONFIRMED',
      items: [],
    });

    const appointmentDetails: LocalAppointmentWithDetails = {
      ...created.appointment,
      patient_name: patient.name,
      patient_whatsapp: patient.whatsapp,
    };

    const onStatusChanged = vi.fn();

    render(
      <AppointmentDetailsDrawer
        isOpen={true}
        appointment={appointmentDetails}
        appointmentRepo={appointmentRepo}
        onClose={vi.fn()}
        onStatusChanged={onStatusChanged}
        onOpenReschedule={vi.fn()}
      />
    );

    // Clica na ação rápida "Paciente Faltou"
    const markNoShowBtn = screen.getByRole('button', { name: /Paciente Faltou/i });
    fireEvent.click(markNoShowBtn);

    await waitFor(async () => {
      // Verifica atualização no banco local
      const inDb = await testDb.appointments.get(created.appointment.id);
      expect(inDb?.status).toBe('NO_SHOW');

      // Verifica enfileiramento na sync_outbox
      const outboxEntries = await testDb.sync_outbox
        .where('record_id')
        .equals(created.appointment.id)
        .toArray();
      const updateMutation = outboxEntries.find((m) => m.operation === 'UPDATE');
      expect(updateMutation).toBeDefined();
    });
  });

  // AC-062
  it('AC-062: Modal de Remarcação de Consulta com Calendário e Novos Horários @spec:AC-062', async () => {
    // Cria paciente e agendamento prévio
    const patient = await patientRepo.createPatient({
      tenant_id: tenantId,
      name: 'Mariana Remarcar',
      whatsapp: '11922223333',
    });

    const created = await appointmentRepo.createAppointment({
      tenant_id: tenantId,
      patient_id: patient.id,
      start_time: '2026-10-19T09:00:00.000Z',
      end_time: '2026-10-19T09:30:00.000Z',
      status: 'RESCHEDULE_REQUESTED',
      items: [],
    });

    const appointmentDetails: LocalAppointmentWithDetails = {
      ...created.appointment,
      patient_name: patient.name,
    };

    const onRescheduled = vi.fn();
    const onClose = vi.fn();

    render(
      <RescheduleModal
        isOpen={true}
        appointment={appointmentDetails}
        appointmentRepo={appointmentRepo}
        onClose={onClose}
        onRescheduled={onRescheduled}
      />
    );

    expect(screen.getByText('Remarcar Consulta')).toBeDefined();

    // Seleciona um novo horário (ex: 11:00)
    const timeBtn = screen.getByRole('button', { name: '11:00' });
    fireEvent.click(timeBtn);

    // Confirma remarcação
    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Remarcação' });
    fireEvent.click(confirmBtn);

    await waitFor(async () => {
      expect(onRescheduled).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();

      // Confirma alteração no Dexie.js
      const updatedInDb = await testDb.appointments.get(created.appointment.id);
      expect(updatedInDb?.status).toBe('CONFIRMED');
      expect(new Date(updatedInDb!.start_time).getHours()).toBe(11);
    });
  });

  // AC-063
  it('AC-063: Lista de Clientes com Indicadores de Histórico e Consultas Futuras @spec:AC-063', async () => {
    // Cria 3 pacientes com perfis distintos
    const p1Novo: LocalPatient = {
      id: 'p-novo',
      tenant_id: tenantId,
      name: 'Beatriz Novata',
      whatsapp: '11900001111',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const p2ComFuturo: LocalPatient = {
      id: 'p-futuro',
      tenant_id: tenantId,
      name: 'Carlos Com Futura',
      whatsapp: '11900002222',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const p3Cancelado: LocalPatient = {
      id: 'p-cancelado',
      tenant_id: tenantId,
      name: 'Daniel Cancelou',
      whatsapp: '11900003333',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Agendamentos:
    // p1: nenhum agendamento
    // p2: consulta no futuro
    // p3: consulta passada cancelada
    const futureDate = new Date(Date.now() + 86400000 * 2).toISOString(); // daqui a 2 dias
    const pastDate = new Date(Date.now() - 86400000 * 5).toISOString(); // 5 dias atrás

    const appointments: LocalAppointment[] = [
      {
        id: 'app-futuro',
        tenant_id: tenantId,
        patient_id: p2ComFuturo.id,
        start_time: futureDate,
        end_time: futureDate,
        status: 'CONFIRMED',
        is_extra_fit: false,
        created_at: pastDate,
        updated_at: pastDate,
      },
      {
        id: 'app-cancelado',
        tenant_id: tenantId,
        patient_id: p3Cancelado.id,
        start_time: pastDate,
        end_time: pastDate,
        status: 'CANCELLED',
        is_extra_fit: false,
        created_at: pastDate,
        updated_at: pastDate,
      },
    ];

    render(
      <PatientList
        tenantId={tenantId}
        patients={[p1Novo, p2ComFuturo, p3Cancelado]}
        appointments={appointments}
      />
    );

    // Valida badge para paciente sem histórico (Novo)
    expect(screen.getByText('Novo / Sem consultas anteriores')).toBeDefined();

    // Valida badge para paciente com consulta futura
    expect(screen.getByTestId('badge-proxima-consulta')).toBeDefined();

    // Valida badge para paciente que cancelou e não remarcou
    expect(screen.getByText('Consulta cancelada sem reagendamento')).toBeDefined();

    // Valida filtro de busca por nome
    const searchInput = screen.getByLabelText('Buscar clientes');
    fireEvent.change(searchInput, { target: { value: 'Novata' } });

    expect(screen.getByText('Beatriz Novata')).toBeDefined();
    expect(screen.queryByText('Carlos Com Futura')).toBeNull();
  });

  // AC-064
  it('AC-064: Procedimentos Padrão Genéricos e Múltiplos Procedimentos por Atendimento @spec:AC-064', async () => {
    const user = userEvent.setup();
    const onChangeSelection = vi.fn();

    render(
      <InlineProcedureForm
        tenantId={tenantId}
        procedureRepo={procedureRepo}
        selectedProcedureIds={[]}
        onChangeSelection={onChangeSelection}
      />
    );

    // Procedimentos padrão genéricos devem ser carregados
    await waitFor(() => {
      expect(screen.getByText('Consulta Inicial / Avaliação')).toBeDefined();
      expect(screen.getByText('Atendimento Padrão')).toBeDefined();
      expect(screen.getByText('Retorno / Revisão')).toBeDefined();
      expect(screen.getByText('Procedimento Especializado')).toBeDefined();
    });

    // Seleciona o primeiro procedimento
    const proc1 = screen.getByText('Consulta Inicial / Avaliação');
    await user.click(proc1);

    expect(onChangeSelection).toHaveBeenCalled();
  });
});
