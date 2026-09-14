import React, { useState } from 'react';
import { Wrench, CheckCircle2 } from 'lucide-react';
import { skillsCategories, skillsList } from '../data/portfolioData';

export default function SkillsMatrix() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredSkills = activeCategory === 'all'
    ? skillsList
    : skillsList.filter((s) => s.category === activeCategory);

  return (
    <section id="skills" className="section-container">
      <div className="section-header">
        <div className="section-badge">
          <Wrench size={14} />
          <span>Tech Stack &amp; Ferramentas</span>
        </div>
        <h2 className="section-title">Matriz de Competências Técnicas</h2>
        <p className="section-subtitle">
          Domínio prático comprovado em infraestrutura em nuvem, esteiras de entrega contínua,
          segurança defensiva, observabilidade e desenvolvimento backend.
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className="skills-filter-tabs">
        {skillsCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`skills-filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      <div className="skills-grid">
        {filteredSkills.map((skill, idx) => (
          <div key={idx} className="skill-card">
            <div className="skill-header">
              <span className="skill-name">{skill.name}</span>
              <span className={`skill-level ${skill.level.toLowerCase()}`}>{skill.level}</span>
            </div>
            <p className="skill-highlight">{skill.highlight}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
