import React from 'react';
import { Terminal, Heart, ShieldCheck } from 'lucide-react';
import { personalInfo } from '../data/portfolioData';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-container" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <Terminal size={18} />
            <span>{personalInfo.name}</span>
          </div>
          <p className="footer-tagline">
            Projetado com arquitetura limpa, React 18, Design Tokens puros e 100% testado via Vitest.
          </p>
        </div>

        <div className="footer-meta">
          <div className="footer-status-pill">
            <ShieldCheck size={14} />
            <span>Infraestrutura OCI &amp; SSL Ativos</span>
          </div>
          <p className="footer-copyright">
            &copy; {currentYear} {personalInfo.name} ({personalInfo.domain}). Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
