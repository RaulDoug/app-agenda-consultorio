/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MoreMenuHub } from '../../../components/layout/MoreMenuHub.js';
import { BottomNav } from '../../../components/layout/BottomNav.js';

describe('Navegação para a Central de Fila WhatsApp — MoreMenuHub (T-142)', () => {
  it('deve exibir o card de Fila de Envios WhatsApp na aba Mais e disparar transição de aba (@spec:AC-217)', () => {
    const handleSelectSection = vi.fn();
    render(<MoreMenuHub onSelectSection={handleSelectSection} patientCount={5} />);

    const card = screen.getByTestId('more-card-whatsapp');
    expect(card).toBeInTheDocument();
    expect(screen.getByText('Fila de Envios WhatsApp')).toBeInTheDocument();

    fireEvent.click(card);
    expect(handleSelectSection).toHaveBeenCalledWith('whatsapp');
  });

  it('deve acionar a aba "mais" ao clicar no botão Mais da BottomNav sem interceptação por whatsapp (@spec:AC-217)', () => {
    const handleTabChange = vi.fn();
    render(<BottomNav activeTab="agenda" onTabChange={handleTabChange} />);

    const tabMais = screen.getByTestId('nav-tab-mais');
    expect(tabMais).toBeInTheDocument();

    fireEvent.click(tabMais);
    expect(handleTabChange).toHaveBeenCalledWith('mais');
    expect(handleTabChange).not.toHaveBeenCalledWith('whatsapp');
  });
});

