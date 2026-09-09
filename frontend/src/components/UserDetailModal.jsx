import React from 'react';
import { X, User, Mail, Phone, Calendar, MapPin, GraduationCap, FileText, Globe } from 'lucide-react';
import { getInitials, formatDate, formatCPF, formatPhone, formatCEP } from '../utils/formatters';

export default function UserDetailModal({ isOpen, user, onClose }) {
  if (!isOpen || !user) return null;

  const addressLine = [user.rua, user.numero].filter(Boolean).join(', ');
  const cityState = [user.cidade, user.estado].filter(Boolean).join(' - ');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-detail" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="detail-header-info">
            <div className="avatar large">{getInitials(user.nome, user.sobrenome)}</div>
            <div>
              <h2 className="modal-title">Detalhes do Usuário</h2>
              <span className="user-id-badge">ID #{user.id}</span>
            </div>
          </div>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body detail-body">
          <div className="detail-section">
            <h3 className="section-title">Dados Principais</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label"><User size={14} /> Nome Completo</span>
                <span className="detail-value">{user.nome} {user.sobrenome}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><Mail size={14} /> E-mail</span>
                <span className="detail-value">{user.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><Phone size={14} /> Telefone</span>
                <span className="detail-value">{formatPhone(user.telefone)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><FileText size={14} /> CPF</span>
                <span className="detail-value">{formatCPF(user.cpf)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><Calendar size={14} /> Idade</span>
                <span className="detail-value">{user.idade ? `${user.idade} anos` : '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><User size={14} /> Gênero</span>
                <span className="detail-value">{user.genero || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><GraduationCap size={14} /> Escolaridade</span>
                <span className="detail-value">{user.escolaridade || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><Calendar size={14} /> Data de Cadastro</span>
                <span className="detail-value">{formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="section-title"><MapPin size={16} /> Endereço</h3>
            <div className="detail-grid">
              <div className="detail-item full-width">
                <span className="detail-label">Logradouro e Número</span>
                <span className="detail-value">{addressLine || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Cidade / Estado</span>
                <span className="detail-value">{cityState || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">CEP</span>
                <span className="detail-value">{formatCEP(user.cep)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><Globe size={14} /> País</span>
                <span className="detail-value">{user.pais || 'Brasil'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
