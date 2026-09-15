import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeaturedProjects from './FeaturedProjects';

describe('FeaturedProjects Component', () => {
  it('renderiza os 4 projetos em destaque com tags de tecnologias e links de acesso', () => {
    render(<FeaturedProjects />);

    expect(screen.getByText(/projetos em destaque/i)).toBeInTheDocument();
    expect(screen.getByText(/infraestrutura oci com terraform/i)).toBeInTheDocument();
    expect(screen.getByText(/sistema fullstack oauth2 crud/i)).toBeInTheDocument();
    expect(screen.getByText(/pipeline ci\/cd zero-downtime/i)).toBeInTheDocument();
    expect(screen.getByText(/suite de observabilidade prometheus/i)).toBeInTheDocument();

    const crudLink = screen.getByRole('link', { name: /acessar aplicação crud/i });
    expect(crudLink).toHaveAttribute('href', '/crud');
  });
});
