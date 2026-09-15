import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SkillsMatrix from './SkillsMatrix';

describe('SkillsMatrix Component', () => {
  it('renderiza as categorias de competências e tecnologias fundamentais', () => {
    render(<SkillsMatrix />);

    expect(screen.getByText(/matriz de competências técnicas/i)).toBeInTheDocument();
    expect(screen.getByText('Terraform')).toBeInTheDocument();
    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText('GitHub Actions')).toBeInTheDocument();
    expect(screen.getByText('Prometheus')).toBeInTheDocument();
    expect(screen.getByText('Nginx')).toBeInTheDocument();
  });

  it('filtra tecnologias por categoria através dos botões de filtro', async () => {
    const user = userEvent.setup();
    render(<SkillsMatrix />);

    const filterBtn = screen.getByRole('button', { name: /ci\/cd & automação/i });
    await user.click(filterBtn);

    expect(screen.getByText('GitHub Actions')).toBeInTheDocument();
    expect(screen.getByText('Bash & Shell Script')).toBeInTheDocument();
  });
});
