import React, { useState } from 'react';
import { Terminal, Github, Menu, X, ExternalLink } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { personalInfo } from '../data/portfolioData';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="navbar-container">
      <nav className="navbar" role="navigation">
        <div className="navbar-brand">
          <a href="#sobre" className="brand-link" onClick={closeMobileMenu}>
            <div className="brand-logo-icon">
              <Terminal size={20} />
            </div>
            <div className="brand-text">
              <span className="brand-name">{personalInfo.name}</span>
              <span className="brand-role">DevOps Engineer</span>
            </div>
          </a>

          <div className="status-badge" title={personalInfo.statusDescription}>
            <span className="status-dot"></span>
            <span className="status-label">{personalInfo.status}</span>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="navbar-nav desktop-nav">
          <a href="#sobre" className="nav-link">Sobre</a>
          <a href="#skills" className="nav-link">Skills</a>
          <a href="#projetos" className="nav-link">Projetos</a>
          <a href="#arquitetura" className="nav-link">Arquitetura</a>
          <a href="#contato" className="nav-link">Contato</a>
        </div>

        {/* Action Controls */}
        <div className="navbar-actions">
          <a
            href={personalInfo.github}
            target="_blank"
            rel="noopener noreferrer"
            className="action-icon-link"
            aria-label="GitHub de Guilherme"
            title="GitHub de Guilherme"
          >
            <Github size={18} />
          </a>

          <ThemeToggle />

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-nav" data-testid="mobile-nav">
          <a href="#sobre" className="mobile-nav-link" onClick={closeMobileMenu}>Sobre</a>
          <a href="#skills" className="mobile-nav-link" onClick={closeMobileMenu}>Skills</a>
          <a href="#projetos" className="mobile-nav-link" onClick={closeMobileMenu}>Projetos</a>
          <a href="#arquitetura" className="mobile-nav-link" onClick={closeMobileMenu}>Arquitetura</a>
          <a href="#contato" className="mobile-nav-link" onClick={closeMobileMenu}>Contato</a>
          <a
            href={personalInfo.github}
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-nav-link external"
            onClick={closeMobileMenu}
          >
            <span>GitHub Profile</span>
            <ExternalLink size={16} />
          </a>
        </div>
      )}
    </header>
  );
}
