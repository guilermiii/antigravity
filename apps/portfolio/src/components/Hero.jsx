import React from 'react';
import { Cloud, ArrowRight, ShieldCheck, Cpu, Code2, Server } from 'lucide-react';
import { personalInfo, quickMetrics } from '../data/portfolioData';

export default function Hero() {
  return (
    <section id="sobre" className="hero-section">
      <div className="hero-container">
        {/* Availability Badge */}
        <div className="hero-badge">
          <span className="hero-badge-dot"></span>
          <span>Disponível para novas oportunidades</span>
        </div>

        {/* Headline */}
        <h1 className="hero-title">
          Engenharia de Plataforma &amp; Infraestrutura Resiliente
        </h1>

        {/* Subtitle / Bio */}
        <p className="hero-subtitle">
          Olá, sou <strong>{personalInfo.name}</strong>. {personalInfo.bio}
        </p>

        {/* Action Buttons */}
        <div className="hero-actions">
          <a href="#projetos" className="btn btn-primary">
            <span>Ver Projetos</span>
            <ArrowRight size={18} />
          </a>
          <a href="#arquitetura" className="btn btn-secondary">
            <Cloud size={18} />
            <span>Arquitetura Cloud</span>
          </a>
          <a href="#contato" className="btn btn-outline">
            <span>Falar Comigo</span>
          </a>
        </div>

        {/* Metric Cards */}
        <div className="hero-metrics-grid">
          {quickMetrics.map((metric, idx) => (
            <div key={idx} className="metric-card">
              <div className="metric-value">{metric.value}</div>
              <div className="metric-label">{metric.label}</div>
              <div className="metric-detail">{metric.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
