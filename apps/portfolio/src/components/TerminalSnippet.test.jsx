import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TerminalSnippet from './TerminalSnippet';

describe('TerminalSnippet Component', () => {
  it('renderiza o terminal com cabeçalho e aba inicial de Terraform', () => {
    render(<TerminalSnippet />);

    expect(screen.getByText(/guilherme@cloud-primary/i)).toBeInTheDocument();
    expect(screen.getByText(/terraform apply/i)).toBeInTheDocument();
    expect(screen.getByText(/Apply complete! Resources: 4 added, 0 changed, 0 destroyed/i)).toBeInTheDocument();
  });

  it('permite alternar entre abas de comando (Docker Compose e CI/CD)', async () => {
    const user = userEvent.setup();
    render(<TerminalSnippet />);

    const dockerTab = screen.getByRole('button', { name: /docker compose/i });
    await user.click(dockerTab);

    expect(screen.getByText(/docker compose up -d --build/i)).toBeInTheDocument();
    expect(screen.getByText(/Running 6\/6/i)).toBeInTheDocument();

    const ciTab = screen.getByRole('button', { name: /github actions/i });
    await user.click(ciTab);

    expect(screen.getByText(/gh workflow run/i)).toBeInTheDocument();
    expect(screen.getByText(/All 3 workflows completed successfully/i)).toBeInTheDocument();
  });
});
