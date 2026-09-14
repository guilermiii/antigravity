import React from 'react';
import { GitBranch, Shield, Zap, RefreshCw, Layers } from 'lucide-react';

const pillars = [
  {
    icon: GitBranch,
    title: 'Infraestrutura como Código (IaC)',
    description: 'Gestão declarativa de recursos na Oracle Cloud (OCI) utilizando Terraform com módulos reutilizáveis, controle estrito de estado e automação de redes virtuais.',
  },
  {
    icon: Zap,
    title: 'Entrega Contínua & Zero-Downtime',
    description: 'Pipelines no GitHub Actions com auto-merge validado por gates rigorosos de qualidade, deploy automatizado com rsync e reconstrução sem queda de serviço.',
  },
  {
    icon: Shield,
    title: 'Segurança Defensiva em Camadas',
    description: 'Blindagem completa contra vulnerabilidades comuns: HSTS, TLS 1.3, mitigação de SQL Injection via SQLAlchemy parametrizado e proteção anti-CSRF em OAuth 2.0.',
  },
  {
    icon: RefreshCw,
    title: 'Cultura TDD & Confiabilidade',
    description: 'Testes escritos antes da implementação com 100% de cobertura nos fluxos críticos do ecossistema, incluindo verificações de integração e segurança de ponta a ponta.',
  },
];

export default function ExperienceTimeline() {
  return (
    <section className="section-container">
      <div className="section-header">
        <div className="section-badge">
          <Layers size={14} />
          <span>Princípios de Engenharia</span>
        </div>
        <h2 className="section-title">Pilares Técnicos &amp; Metodologia</h2>
        <p className="section-subtitle">
          Práticas adotadas na concepção, implantação e operação contínua de plataformas resilientes.
        </p>
      </div>

      <div className="pillars-grid">
        {pillars.map((pillar, idx) => {
          const IconComp = pillar.icon;
          return (
            <div key={idx} className="pillar-card">
              <div className="pillar-icon-box">
                <IconComp size={22} />
              </div>
              <h3 className="pillar-title">{pillar.title}</h3>
              <p className="pillar-desc">{pillar.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
