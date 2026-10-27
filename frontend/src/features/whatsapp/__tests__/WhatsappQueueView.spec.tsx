/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WhatsappQueueView } from '../components/WhatsappQueueView.js';
import * as hookModule from '../hooks/useWhatsappQueue.js';

vi.mock('../hooks/useWhatsappQueue.js');

describe('WhatsappQueueView — Componentes e Interações da Central de Fila (T-141)', () => {
  const mockSendNow = vi.fn();
  const mockExclude = vi.fn();
  const mockUpdateMessage = vi.fn();
  const mockReorder = vi.fn();
  const mockTogglePause = vi.fn();
  const mockTriggerBatch = vi.fn();
  const mockSaveSettings = vi.fn();
  const mockResolveStatus = vi.fn();
  const mockMarkInboundReplied = vi.fn();
  const mockSendRescheduleNotice = vi.fn();
  const mockSetDateFilter = vi.fn();
  const mockSetCategoryFilter = vi.fn();
  const mockRefresh = vi.fn();

  const sampleItems = [
    {
      appointment_id: 'app-1',
      patient_id: 'pat-1',
      patient_name: 'Carlos Alberto',
      phone: '11988887777',
      appointment_start_time: '2026-10-28T10:00:00Z',
      appointment_end_time: '2026-10-28T10:30:00Z',
      appointment_status: 'PENDING',
      queue_category: 'PENDING_QUEUE',
      queue_order: 1,
      queue_excluded: false,
      preview_message: 'Olá Carlos, confirmamos seu horário?',
      custom_message: null,
      last_outbound_at: null,
      last_inbound_text: null,
      last_inbound_at: null,
      enqueued_job_id: null,
      enqueued_delay_ms: null,
    },
    {
      appointment_id: 'app-2',
      patient_id: 'pat-2',
      patient_name: 'Ana Paula',
      phone: '11977776666',
      appointment_start_time: '2026-10-28T11:00:00Z',
      appointment_end_time: '2026-10-28T11:30:00Z',
      appointment_status: 'MESSAGE_RECEIVED',
      queue_category: 'HUMAN_ATTENTION',
      queue_order: 2,
      queue_excluded: false,
      preview_message: 'Olá Ana, confirmamos seu horário?',
      custom_message: null,
      last_outbound_at: '2026-10-27T09:00:00Z',
      last_inbound_text: 'Posso chegar 15 minutos atrasada?',
      last_inbound_at: '2026-10-27T10:15:00Z',
      enqueued_job_id: null,
      enqueued_delay_ms: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (hookModule.useWhatsappQueue as any).mockReturnValue({
      items: sampleItems,
      allItems: sampleItems,
      counts: {
        total: 2,
        pending_queue: 1,
        awaiting_reply: 0,
        confirmed: 0,
        reschedule_requested: 0,
        human_attention: 1,
      },
      queuePaused: false,
      pendingJobsCount: 0,
      loading: false,
      error: null,
      dateFilter: 'today',
      setDateFilter: mockSetDateFilter,
      categoryFilter: 'ALL',
      setCategoryFilter: mockSetCategoryFilter,
      settings: {
        confirmation_message_template: 'Oi {nome}',
      },
      refresh: mockRefresh,
      sendNow: mockSendNow,
      exclude: mockExclude,
      updateMessage: mockUpdateMessage,
      reorder: mockReorder,
      togglePause: mockTogglePause,
      triggerBatch: mockTriggerBatch,
      saveSettings: mockSaveSettings,
      resolveStatus: mockResolveStatus,
      markInboundReplied: mockMarkInboundReplied,
      sendRescheduleNotice: mockSendRescheduleNotice,
    });
  });

  it('deve renderizar a lista da fila, badges e contadores (@spec:AC-209)', () => {
    render(<WhatsappQueueView token="test" />);

    expect(screen.getByText('Carlos Alberto')).toBeInTheDocument();
    expect(screen.getByText('Ana Paula')).toBeInTheDocument();
    expect(screen.getByText('Na Fila')).toBeInTheDocument();
    expect(screen.getByText('Atenção Humana')).toBeInTheDocument();
    expect(screen.getByText('Todos (2)')).toBeInTheDocument();
    expect(screen.getByText('Na Fila (1)')).toBeInTheDocument();
    expect(screen.getByText('Atenção Humana (1)')).toBeInTheDocument();
  });

  it('deve exibir balão com última resposta do paciente e link wa.me (@spec:AC-210)', () => {
    render(<WhatsappQueueView token="test" />);

    expect(screen.getByText('"Posso chegar 15 minutos atrasada?"')).toBeInTheDocument();
    const link = screen.getByTestId('link-wa-chat-app-2');
    expect(link).toHaveAttribute('href', expect.stringContaining('wa.me/5511977776666'));

    const btnConfirmManual = screen.getByTestId('btn-resolve-confirm-app-2');
    fireEvent.click(btnConfirmManual);
    expect(mockResolveStatus).toHaveBeenCalledWith('app-2', 'CONFIRMED');
  });

  it('deve permitir disparar envio manual instantâneo pelo botão do card (@spec:AC-214)', () => {
    render(<WhatsappQueueView token="test" />);

    const btnSend = screen.getByTestId('btn-send-now-app-1');
    fireEvent.click(btnSend);
    expect(mockSendNow).toHaveBeenCalledWith('app-1');
  });

  it('deve permitir excluir da fila pelo botão de lixeira (@spec:AC-211)', () => {
    render(<WhatsappQueueView token="test" />);

    const btnExclude = screen.getByTestId('btn-exclude-queue-app-1');
    fireEvent.click(btnExclude);
    expect(mockExclude).toHaveBeenCalledWith('app-1');
  });

  it('deve abrir gaveta para editar mensagem individual (@spec:AC-212)', async () => {
    render(<WhatsappQueueView token="test" />);

    const btnEdit = screen.getByTestId('btn-edit-msg-app-1');
    fireEvent.click(btnEdit);

    expect(screen.getByTestId('edit-queue-message-drawer')).toBeInTheDocument();
    const input = screen.getByTestId('input-custom-message');
    fireEvent.change(input, { target: { value: 'Texto VIP alterado' } });

    const btnSave = screen.getByTestId('btn-save-custom-message');
    fireEvent.click(btnSave);

    await waitFor(() => {
      expect(mockUpdateMessage).toHaveBeenCalledWith('app-1', 'Texto VIP alterado');
    });
  });

  it('deve permitir acionar pausa da fila e disparo em lote global (@spec:AC-216)', () => {
    render(<WhatsappQueueView token="test" />);

    const btnPause = screen.getByTestId('btn-toggle-pause');
    fireEvent.click(btnPause);
    expect(mockTogglePause).toHaveBeenCalled();

    const btnBatch = screen.getByTestId('btn-trigger-batch-now');
    fireEvent.click(btnBatch);
    expect(mockTriggerBatch).toHaveBeenCalled();
  });

  it('deve disparar sincronização e recarregar a lista ao clicar no botão Recarregar Lista (@spec:AC-218)', async () => {
    const mockSync = vi.fn().mockResolvedValue(undefined);
    render(<WhatsappQueueView token="test" onSync={mockSync} />);

    const btnRefresh = screen.getByTestId('btn-refresh-queue');
    expect(btnRefresh).toBeInTheDocument();
    expect(screen.getByText('Recarregar Lista')).toBeInTheDocument();

    fireEvent.click(btnRefresh);

    await waitFor(() => {
      expect(mockSync).toHaveBeenCalledTimes(1);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('deve substituir o botão de confirmação manual por reagendamento quando o cliente enviar pedido de agendamento (@spec:AC-220)', () => {
    const rescheduleItem = {
      appointment_id: 'app-reschedule',
      patient_id: 'pat-reschedule',
      patient_name: 'Roberto Silva',
      phone: '11966665555',
      appointment_start_time: '2026-10-28T14:00:00Z',
      appointment_end_time: '2026-10-28T14:30:00Z',
      appointment_status: 'RESCHEDULE_REQUESTED',
      queue_category: 'RESCHEDULE_REQUESTED',
      queue_order: 1,
      queue_excluded: false,
      preview_message: 'Olá Roberto, confirmamos seu horário?',
      custom_message: null,
      last_outbound_at: '2026-10-27T09:00:00Z',
      last_inbound_text: 'Olá, é um pedido de agendamento para outro dia',
      last_inbound_at: '2026-10-27T10:30:00Z',
      enqueued_job_id: null,
      enqueued_delay_ms: null,
    };

    (hookModule.useWhatsappQueue as any).mockReturnValue({
      items: [rescheduleItem],
      allItems: [rescheduleItem],
      counts: {
        total: 1,
        pending_queue: 0,
        awaiting_reply: 0,
        confirmed: 0,
        reschedule_requested: 1,
        human_attention: 0,
      },
      queuePaused: false,
      pendingJobsCount: 0,
      loading: false,
      error: null,
      dateFilter: 'today',
      setDateFilter: mockSetDateFilter,
      categoryFilter: 'ALL',
      setCategoryFilter: mockSetCategoryFilter,
      settings: null,
      refresh: mockRefresh,
      sendNow: mockSendNow,
      exclude: mockExclude,
      updateMessage: mockUpdateMessage,
      reorder: mockReorder,
      togglePause: mockTogglePause,
      triggerBatch: mockTriggerBatch,
      saveSettings: mockSaveSettings,
      resolveStatus: mockResolveStatus,
    });

    render(<WhatsappQueueView token="test" />);

    // Botão de confirmação manual NÃO deve existir
    expect(screen.queryByTestId('btn-resolve-confirm-app-reschedule')).toBeNull();
    expect(screen.queryByText('Confirmar Manualmente')).toBeNull();

    // Botão de reagendamento DEVE existir com destaque
    const btnReschedule = screen.getByTestId('btn-resolve-reschedule-app-reschedule');
    expect(btnReschedule).toBeInTheDocument();
    expect(btnReschedule).toHaveTextContent('Reagendar Consulta');
  });

  it('deve acionar o fluxo de remarcação com os dados da consulta ao clicar no botão de reagendamento (@spec:AC-221)', async () => {
    const mockOnOpenReschedule = vi.fn();
    const rescheduleItem = {
      appointment_id: 'app-reschedule',
      patient_id: 'pat-reschedule',
      patient_name: 'Roberto Silva',
      phone: '11966665555',
      appointment_start_time: '2026-10-28T14:00:00Z',
      appointment_end_time: '2026-10-28T14:30:00Z',
      appointment_status: 'RESCHEDULE_REQUESTED',
      queue_category: 'RESCHEDULE_REQUESTED',
      queue_order: 1,
      queue_excluded: false,
      preview_message: 'Olá Roberto, confirmamos seu horário?',
      custom_message: null,
      last_outbound_at: '2026-10-27T09:00:00Z',
      last_inbound_text: 'reagendamento por favor',
      last_inbound_at: '2026-10-27T10:30:00Z',
      enqueued_job_id: null,
      enqueued_delay_ms: null,
    };

    (hookModule.useWhatsappQueue as any).mockReturnValue({
      items: [rescheduleItem],
      allItems: [rescheduleItem],
      counts: {
        total: 1,
        pending_queue: 0,
        awaiting_reply: 0,
        confirmed: 0,
        reschedule_requested: 1,
        human_attention: 0,
      },
      queuePaused: false,
      pendingJobsCount: 0,
      loading: false,
      error: null,
      dateFilter: 'today',
      setDateFilter: mockSetDateFilter,
      categoryFilter: 'ALL',
      setCategoryFilter: mockSetCategoryFilter,
      settings: null,
      refresh: mockRefresh,
      sendNow: mockSendNow,
      exclude: mockExclude,
      updateMessage: mockUpdateMessage,
      reorder: mockReorder,
      togglePause: mockTogglePause,
      triggerBatch: mockTriggerBatch,
      saveSettings: mockSaveSettings,
      resolveStatus: mockResolveStatus,
    });

    render(<WhatsappQueueView token="test" onOpenReschedule={mockOnOpenReschedule} />);

    const btnReschedule = screen.getByTestId('btn-resolve-reschedule-app-reschedule');
    fireEvent.click(btnReschedule);

    await waitFor(() => {
      expect(mockOnOpenReschedule).toHaveBeenCalledTimes(1);
      expect(mockOnOpenReschedule).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'app-reschedule',
          patient_name: 'Roberto Silva',
          start_time: '2026-10-28T14:00:00Z',
          end_time: '2026-10-28T14:30:00Z',
        })
      );
    });
  });

  it('AC-224: Ocultação do botão de reagendamento após conclusão da remarcação @spec:AC-224', () => {
    const rescheduledConfirmedItem = {
      appointment_id: 'app-rescheduled',
      patient_id: 'pat-99',
      patient_name: 'Roberto Silva',
      phone: '11988887777',
      appointment_start_time: '2026-10-29T10:00:00Z',
      appointment_end_time: '2026-10-29T10:30:00Z',
      appointment_status: 'CONFIRMED',
      queue_category: 'CONFIRMED',
      queue_order: 1,
      queue_excluded: false,
      preview_message: 'Olá Roberto, sua consulta está confirmada.',
      custom_message: null,
      last_outbound_at: null,
      last_inbound_text: 'Quero remarcar para outro dia',
      last_inbound_at: '2026-10-27T10:15:00Z',
      is_replied: false,
      enqueued_job_id: null,
      enqueued_delay_ms: null,
    };

    (hookModule.useWhatsappQueue as any).mockReturnValue({
      items: [rescheduledConfirmedItem],
      allItems: [rescheduledConfirmedItem],
      counts: { total: 1, pending_queue: 0, awaiting_reply: 0, confirmed: 1, reschedule_requested: 0, human_attention: 0 },
      queuePaused: false,
      pendingJobsCount: 0,
      loading: false,
      error: null,
      dateFilter: 'today',
      setDateFilter: mockSetDateFilter,
      categoryFilter: 'ALL',
      setCategoryFilter: mockSetCategoryFilter,
      settings: null,
      refresh: mockRefresh,
      sendNow: mockSendNow,
      exclude: mockExclude,
      updateMessage: mockUpdateMessage,
      reorder: mockReorder,
      togglePause: mockTogglePause,
      triggerBatch: mockTriggerBatch,
      saveSettings: mockSaveSettings,
      resolveStatus: mockResolveStatus,
      markInboundReplied: mockMarkInboundReplied,
      sendRescheduleNotice: mockSendRescheduleNotice,
    });

    render(<WhatsappQueueView token="test" />);

    // O botão "Reagendar Consulta" NÃO deve existir, pois a consulta já está confirmada/reagendada
    expect(screen.queryByTestId('btn-resolve-reschedule-app-rescheduled')).not.toBeInTheDocument();
    // Em seu lugar, deve estar o botão de enviar aviso da nova data
    expect(screen.getByTestId('btn-send-reschedule-notice-app-rescheduled')).toBeInTheDocument();
  });

  it('AC-225: Exibição de opções de resposta enquanto o paciente aguarda retorno @spec:AC-225', () => {
    const awaitingReplyItem = {
      appointment_id: 'app-awaiting',
      patient_id: 'pat-100',
      patient_name: 'Mariana Lima',
      phone: '11988886666',
      appointment_start_time: '2026-10-29T15:00:00Z',
      appointment_end_time: '2026-10-29T15:30:00Z',
      appointment_status: 'CONFIRMED',
      queue_category: 'CONFIRMED',
      queue_order: 1,
      queue_excluded: false,
      preview_message: 'Mensagem de confirmação',
      custom_message: null,
      last_outbound_at: null,
      last_inbound_text: 'Remarca para às 15h por favor',
      last_inbound_at: '2026-10-27T11:00:00Z',
      is_replied: false,
      enqueued_job_id: null,
      enqueued_delay_ms: null,
    };

    (hookModule.useWhatsappQueue as any).mockReturnValue({
      items: [awaitingReplyItem],
      allItems: [awaitingReplyItem],
      counts: { total: 1, pending_queue: 0, awaiting_reply: 0, confirmed: 1, reschedule_requested: 0, human_attention: 0 },
      queuePaused: false,
      pendingJobsCount: 0,
      loading: false,
      error: null,
      dateFilter: 'today',
      setDateFilter: mockSetDateFilter,
      categoryFilter: 'ALL',
      setCategoryFilter: mockSetCategoryFilter,
      settings: null,
      refresh: mockRefresh,
      sendNow: mockSendNow,
      exclude: mockExclude,
      updateMessage: mockUpdateMessage,
      reorder: mockReorder,
      togglePause: mockTogglePause,
      triggerBatch: mockTriggerBatch,
      saveSettings: mockSaveSettings,
      resolveStatus: mockResolveStatus,
      markInboundReplied: mockMarkInboundReplied,
      sendRescheduleNotice: mockSendRescheduleNotice,
    });

    render(<WhatsappQueueView token="test" />);

    // Enquanto is_replied for false, deve exibir opções para responder
    expect(screen.getByTestId('btn-send-reschedule-notice-app-awaiting')).toBeInTheDocument();
    expect(screen.getByTestId('link-wa-chat-app-awaiting')).toBeInTheDocument();
    expect(screen.getByTestId('btn-mark-replied-app-awaiting')).toBeInTheDocument();

    // Ações acionam as funções correspondentes
    fireEvent.click(screen.getByTestId('btn-send-reschedule-notice-app-awaiting'));
    expect(mockSendRescheduleNotice).toHaveBeenCalledWith('app-awaiting');

    fireEvent.click(screen.getByTestId('btn-mark-replied-app-awaiting'));
    expect(mockMarkInboundReplied).toHaveBeenCalledWith('app-awaiting');
  });

  it('AC-226: Transição para estado de respondido e ocultação dos botões de resposta @spec:AC-226', () => {
    const repliedItem = {
      appointment_id: 'app-replied',
      patient_id: 'pat-101',
      patient_name: 'Mariana Lima',
      phone: '11988886666',
      appointment_start_time: '2026-10-29T15:00:00Z',
      appointment_end_time: '2026-10-29T15:30:00Z',
      appointment_status: 'CONFIRMED',
      queue_category: 'CONFIRMED',
      queue_order: 1,
      queue_excluded: false,
      preview_message: 'Mensagem de confirmação',
      custom_message: null,
      last_outbound_at: '2026-10-27T11:05:00Z',
      last_inbound_text: 'Remarca para às 15h por favor',
      last_inbound_at: '2026-10-27T11:00:00Z',
      is_replied: true,
      enqueued_job_id: null,
      enqueued_delay_ms: null,
    };

    (hookModule.useWhatsappQueue as any).mockReturnValue({
      items: [repliedItem],
      allItems: [repliedItem],
      counts: { total: 1, pending_queue: 0, awaiting_reply: 0, confirmed: 1, reschedule_requested: 0, human_attention: 0 },
      queuePaused: false,
      pendingJobsCount: 0,
      loading: false,
      error: null,
      dateFilter: 'today',
      setDateFilter: mockSetDateFilter,
      categoryFilter: 'ALL',
      setCategoryFilter: mockSetCategoryFilter,
      settings: null,
      refresh: mockRefresh,
      sendNow: mockSendNow,
      exclude: mockExclude,
      updateMessage: mockUpdateMessage,
      reorder: mockReorder,
      togglePause: mockTogglePause,
      triggerBatch: mockTriggerBatch,
      saveSettings: mockSaveSettings,
      resolveStatus: mockResolveStatus,
      markInboundReplied: mockMarkInboundReplied,
      sendRescheduleNotice: mockSendRescheduleNotice,
    });

    render(<WhatsappQueueView token="test" />);

    // Os botões de resposta e reagendamento devem estar ocultos
    expect(screen.queryByTestId('btn-send-reschedule-notice-app-replied')).not.toBeInTheDocument();
    expect(screen.queryByTestId('link-wa-chat-app-replied')).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-mark-replied-app-replied')).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-resolve-reschedule-app-replied')).not.toBeInTheDocument();

    // Deve exibir o badge de Respondido
    const badge = screen.getByTestId('badge-replied-app-replied');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Respondido');
  });
});

