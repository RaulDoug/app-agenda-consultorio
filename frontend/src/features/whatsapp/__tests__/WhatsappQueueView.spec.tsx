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
  const mockSetDateFilter = vi.fn();
  const mockSetCategoryFilter = vi.fn();

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
      sendNow: mockSendNow,
      exclude: mockExclude,
      updateMessage: mockUpdateMessage,
      reorder: mockReorder,
      togglePause: mockTogglePause,
      triggerBatch: mockTriggerBatch,
      saveSettings: mockSaveSettings,
      resolveStatus: mockResolveStatus,
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
});

