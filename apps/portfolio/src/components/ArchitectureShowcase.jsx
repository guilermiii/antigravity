import React, { useState } from 'react';
import { Globe, Shield, Layout, Users, Server, Database, Activity, CheckCircle, ExternalLink, Cpu } from 'lucide-react';
import { architectureNodes } from '../data/portfolioData';

const iconMap = {
  Globe,
  Shield,
  Layout,
  Users,
  Server,
  Database,
  Activity,
};

export default function ArchitectureShowcase() {
  const [selectedNodeId, setSelectedNodeId] = useState('nginx');

  const selectedNode = architectureNodes.find((n) => n.id === selectedNodeId) || architectureNodes[1];

  return (
    <section id="arquitetura" className="section-container">
      <div className="section-header">
        <div className="section-badge">
          <Cpu size={14} />
          <span>Infraestrutura Ao Vivo na OCI</span>
        </div>
        <h2 className="section-title">Arquitetura em Produção</h2>
        <p className="section-subtitle">
          Topologia real executando na nuvem Oracle Always-Free, orquestrada via Terraform, Nginx e Docker.
          Clique em qualquer nó para inspecionar os detalhes técnicos.
        </p>
      </div>

      <div className="architecture-grid">
        {/* Interactive Topology Graph */}
        <div className="topology-canvas">
          <div className="topology-title">Fluxo de Tráfego e Redes</div>

          <div className="topology-flow">
            {architectureNodes.map((node) => {
              const IconComp = iconMap[node.icon] || Server;
              const isSelected = node.id === selectedNodeId;

              return (
                <button
                  key={node.id}
                  type="button"
                  className={`topology-node-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedNodeId(node.id)}
                  aria-pressed={isSelected}
                >
                  <div className="node-icon-wrapper">
                    <IconComp size={20} />
                  </div>
                  <div className="node-info">
                    <span className="node-name">{node.name}</span>
                    <span className="node-layer">{node.layer}</span>
                  </div>
                  <span className="node-badge">{node.badge}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Node Specs Inspector */}
        <div className="node-details-card">
          <div className="details-header">
            <div className="details-layer">{selectedNode.layer}</div>
            <h3 className="details-name">{selectedNode.name}</h3>
            <span className="details-badge">{selectedNode.badge}</span>
          </div>

          <p className="details-desc">{selectedNode.description}</p>

          <div className="details-specs">
            <div className="specs-label">Especificações Técnicas:</div>
            <div className="specs-value">{selectedNode.specs}</div>
          </div>

          <div className="details-actions">
            <a href="/health" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
              <CheckCircle size={14} />
              <span>Verificar Health Check</span>
              <ExternalLink size={12} />
            </a>
            <a href="/docs" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
              <span>OpenAPI Swagger</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
