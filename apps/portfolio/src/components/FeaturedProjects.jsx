import React from 'react';
import { FolderGit2, ExternalLink, ArrowRight, Star } from 'lucide-react';
import { featuredProjects } from '../data/portfolioData';

export default function FeaturedProjects() {
  return (
    <section id="projetos" className="section-container">
      <div className="section-header">
        <div className="section-badge">
          <FolderGit2 size={14} />
          <span>Portfólio de Projetos</span>
        </div>
        <h2 className="section-title">Projetos em Destaque</h2>
        <p className="section-subtitle">
          Aplicações e soluções de engenharia implementadas neste próprio ecossistema monorepo,
          com foco em resiliência, segurança e entrega automatizada.
        </p>
      </div>

      <div className="projects-grid">
        {featuredProjects.map((project) => (
          <div
            key={project.id}
            className={`project-card ${project.isPrimaryApp ? 'featured' : ''}`}
          >
            {project.isPrimaryApp && (
              <div className="featured-banner">
                <Star size={14} />
                <span>Aplicação Principal ao Vivo</span>
              </div>
            )}

            <div className="project-header">
              <span className="project-subtitle">{project.subtitle}</span>
              <h3 className="project-title">{project.title}</h3>
            </div>

            <p className="project-description">{project.description}</p>

            <div className="project-tags">
              {project.tags.map((tag, idx) => (
                <span key={idx} className="project-tag">{tag}</span>
              ))}
            </div>

            <div className="project-links">
              {project.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className={`btn ${link.isPrimary ? 'btn-primary' : 'btn-outline'} btn-sm`}
                  target={link.url.startsWith('http') ? '_blank' : '_self'}
                  rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  <span>{link.label}</span>
                  {link.isPrimary ? <ArrowRight size={14} /> : <ExternalLink size={14} />}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
