import React, { useState } from 'react';
import { Mail, Github, Globe, Copy, Check, MessageSquare, ExternalLink } from 'lucide-react';
import { personalInfo } from '../data/portfolioData';

export default function ContactSection() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(personalInfo.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <section id="contato" className="section-container">
      <div className="section-header">
        <div className="section-badge">
          <MessageSquare size={14} />
          <span>Canais de Conexão</span>
        </div>
        <h2 className="section-title">Vamos conversar?</h2>
        <p className="section-subtitle">
          Interessado em soluções de infraestrutura cloud, automação de CI/CD ou quer trocar uma ideia sobre DevOps?
          Fique à vontade para entrar em contato.
        </p>
      </div>

      <div className="contact-cards-grid">
        {/* Email Card */}
        <div className="contact-card">
          <div className="contact-icon-wrapper">
            <Mail size={22} />
          </div>
          <div className="contact-card-content">
            <span className="contact-label">E-mail Profissional</span>
            <span className="contact-value">{personalInfo.email}</span>
          </div>
          <div className="contact-card-actions">
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={handleCopyEmail}
              aria-label="Copiar E-mail"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'E-mail copiado!' : 'Copiar E-mail'}</span>
            </button>
            <a href={`mailto:${personalInfo.email}`} className="btn btn-sm btn-primary">
              <span>Enviar Mensagem</span>
            </a>
          </div>
        </div>

        {/* GitHub Card */}
        <div className="contact-card">
          <div className="contact-icon-wrapper">
            <Github size={22} />
          </div>
          <div className="contact-card-content">
            <span className="contact-label">Repositório &amp; Código</span>
            <span className="contact-value">github.com/{personalInfo.handle}</span>
          </div>
          <div className="contact-card-actions">
            <a
              href={personalInfo.github}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline"
              aria-label="GitHub"
            >
              <span>Acessar GitHub</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* DuckDNS Domain Card */}
        <div className="contact-card">
          <div className="contact-icon-wrapper">
            <Globe size={22} />
          </div>
          <div className="contact-card-content">
            <span className="contact-label">Domínio &amp; Host na Nuvem</span>
            <span className="contact-value">{personalInfo.domain}</span>
          </div>
          <div className="contact-card-actions">
            <a
              href={`https://${personalInfo.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline"
              aria-label={personalInfo.domain}
            >
              <span>Visitar Host</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
