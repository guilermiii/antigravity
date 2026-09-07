import React from 'react';
import { Users } from 'lucide-react';

export default function Navbar({ totalUsers, isOnline }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          <div className="brand-icon">
            <Users size={20} />
          </div>
          <div>
            <h1 className="brand-title">Gestão de Usuários</h1>
            <p className="brand-subtitle">CRUD com FastAPI, PostgreSQL & React</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong>{totalUsers}</strong> {totalUsers === 1 ? 'usuário' : 'usuários'}
          </span>
          <div className={`api-badge ${isOnline ? '' : 'offline'}`}>
            <span className="status-dot" />
            <span>{isOnline ? 'API Conectada' : 'API Desconectada'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
