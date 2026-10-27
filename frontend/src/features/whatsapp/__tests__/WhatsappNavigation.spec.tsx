/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MoreMenuHub } from '../../../components/layout/MoreMenuHub.js';

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
});

