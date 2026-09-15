import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactSection from './ContactSection';

describe('ContactSection Component', () => {
  it('renderiza os canais de contato e links de perfil', () => {
    render(<ContactSection />);

    expect(screen.getByText(/vamos conversar\?/i)).toBeInTheDocument();
    expect(screen.getByText('guilermiii2003@gmail.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute('href', 'https://github.com/guilermiii');
    expect(screen.getByRole('link', { name: /guilermiii\.duckdns\.org/i })).toBeInTheDocument();
  });

  it('permite copiar o email para a área de transferência', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });

    render(<ContactSection />);

    const copyBtn = screen.getByRole('button', { name: /copiar e-mail/i });
    await user.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('guilermiii2003@gmail.com');
    expect(await screen.findByText(/e-mail copiado!/i)).toBeInTheDocument();
  });
});
