/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WhatsappTemplatesDrawer } from '../components/WhatsappTemplatesDrawer.js';
import type { TenantWhatsappSettings } from '@cliniassist/shared';

describe('WhatsappTemplatesDrawer — Gabarito e Auxiliares de Templates (US-128)', () => {
  const mockSettings: TenantWhatsappSettings = {
    id: 'settings-1',
    tenant_id: 'tenant-1',
    confirmation_message_template: '{Olá|Oi} {nome}, confirmamos sua consulta para {data} às {horario}?',
    confirmation_reply_template: 'Obrigado por confirmar, {nome}!',
    reschedule_reply_template: 'Recebemos seu pedido de remarcação, {nome}.',
    welcome_fallback_reply_template: 'Olá {nome}, nossa equipe já vai te responder.',
    confirmation_hour: 9,
    confirmation_days_ahead: 1,
    auto_reply_enabled: true,
  };

  it('AC-227: Exibição do painel informativo com gabarito de variáveis e regras de Spintax @spec:AC-227', () => {
    render(
      <WhatsappTemplatesDrawer
        isOpen={true}
        settings={mockSettings}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    // O painel/card de gabarito deve ser exibido
    const cheatSheet = screen.getByTestId('templates-cheat-sheet');
    expect(cheatSheet).toBeInTheDocument();
    expect(cheatSheet).toHaveTextContent('Guia de Personalização & Anti-Bloqueio (Gabarito)');

    // Deve exibir as tags dinâmicas
    expect(cheatSheet).toHaveTextContent('{nome}');
    expect(cheatSheet).toHaveTextContent('{data}');
    expect(cheatSheet).toHaveTextContent('{horario}');

    // Deve explicar o Spintax anti-ban
    expect(cheatSheet).toHaveTextContent('Variação de Palavras (Spintax anti-ban)');
    expect(cheatSheet).toHaveTextContent('{opção1|opção2|opção3}');
  });

  it('AC-228: Inserção rápida de variáveis e Spintax via botões/chips @spec:AC-228', () => {
    render(
      <WhatsappTemplatesDrawer
        isOpen={true}
        settings={mockSettings}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const inputConfirmation = screen.getByTestId('input-template-confirmation') as HTMLTextAreaElement;
    expect(inputConfirmation.value).toContain('{nome}');

    // Clica no chip de inserir {horario}
    const btnInsertHorario = screen.getByTestId('btn-insert-horario-confirmation');
    fireEvent.click(btnInsertHorario);

    // Verifica que {horario} foi adicionado ao texto
    expect(inputConfirmation.value).toContain('{horario}');

    // Clica no chip de inserir {data}
    const btnInsertData = screen.getByTestId('btn-insert-data-confirmation');
    fireEvent.click(btnInsertData);
    expect(inputConfirmation.value).toContain('{data}');
  });

  it('AC-229: Prévia simulada em tempo real da mensagem @spec:AC-229', () => {
    render(
      <WhatsappTemplatesDrawer
        isOpen={true}
        settings={mockSettings}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const previewBox = screen.getByTestId('template-preview-box');
    expect(previewBox).toBeInTheDocument();
    expect(previewBox).toHaveTextContent('Prévia do WhatsApp');

    // A prévia deve interpolar as tags com os dados simulados (Carlos, 28/10, 14:30) e Spintax
    expect(previewBox).toHaveTextContent('Carlos');
    expect(previewBox).toHaveTextContent('28/10');
    expect(previewBox).toHaveTextContent('14:30');

    // Alterar o texto atualiza a prévia
    const inputConfirmation = screen.getByTestId('input-template-confirmation');
    fireEvent.change(inputConfirmation, { target: { value: 'Oi {nome}, nos vemos às {horario}!' } });

    expect(previewBox).toHaveTextContent('Oi Carlos, nos vemos às 14:30!');
  });

  describe('Cards Expansíveis e Salvamento Individual (US-129)', () => {
    it('AC-230: Expansão e recolhimento individual dos cards de template @spec:AC-230', () => {
      render(
        <WhatsappTemplatesDrawer
          isOpen={true}
          settings={mockSettings}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      );

      // Card 1 (confirmation) começa expandido por padrão
      expect(screen.getByTestId('card-body-confirmation')).toBeInTheDocument();
      expect(screen.queryByTestId('card-body-reschedule-reply')).not.toBeInTheDocument();

      // Clica no cabeçalho do card de remarcação (reschedule-reply)
      const rescheduleHeader = screen.getByTestId('card-header-reschedule-reply');
      fireEvent.click(rescheduleHeader);

      // Agora o card de remarcação está expandido e o de confirmação foi recolhido
      expect(screen.getByTestId('card-body-reschedule-reply')).toBeInTheDocument();
      expect(screen.queryByTestId('card-body-confirmation')).not.toBeInTheDocument();

      // Clica novamente no cabeçalho do card de remarcação para recolhê-lo
      fireEvent.click(rescheduleHeader);
      expect(screen.queryByTestId('card-body-reschedule-reply')).not.toBeInTheDocument();
    });

    it('AC-231: Exibição de prévia simulada contextual dentro do card expandido @spec:AC-231', () => {
      render(
        <WhatsappTemplatesDrawer
          isOpen={true}
          settings={mockSettings}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      );

      // Abre o card de confirmação de réplica
      fireEvent.click(screen.getByTestId('card-header-confirmation-reply'));

      const previewReply = screen.getByTestId('preview-box-confirmation-reply');
      expect(previewReply).toBeInTheDocument();
      expect(previewReply).toHaveTextContent('Obrigado por confirmar, Carlos!');

      // Altera o texto do template de confirmação de réplica
      const inputReply = screen.getByTestId('input-template-confirmation-reply');
      fireEvent.change(inputReply, { target: { value: 'Confirmadíssimo para você, {nome}!' } });

      expect(previewReply).toHaveTextContent('Confirmadíssimo para você, Carlos!');
    });

    it('AC-232: Botão de salvar individual por card de mensagem com feedback visual @spec:AC-232', async () => {
      const mockOnSave = vi.fn().mockResolvedValue(undefined);

      render(
        <WhatsappTemplatesDrawer
          isOpen={true}
          settings={mockSettings}
          onClose={vi.fn()}
          onSave={mockOnSave}
        />
      );

      // Abre o card de reagendamento
      fireEvent.click(screen.getByTestId('card-header-reschedule-reply'));
      expect(screen.getByTestId('card-body-reschedule-reply')).toBeInTheDocument();

      // Altera o texto
      const inputReschedule = screen.getByTestId('input-template-reschedule-reply');
      fireEvent.change(inputReschedule, { target: { value: 'Remarcaremos seu horário em breve, {nome}.' } });

      // Clica no botão de salvar do card de reagendamento
      const btnSave = screen.getByTestId('btn-save-card-reschedule-reply');
      fireEvent.click(btnSave);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith({
        reschedule_reply_template: 'Remarcaremos seu horário em breve, {nome}.',
      });

      // Feedback visual deve aparecer
      expect(await screen.findByText('Mensagem salva com sucesso!')).toBeInTheDocument();
    });
  });
});

