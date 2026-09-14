import React from 'react';
import { Users, LogOut, ShieldCheck, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthButtons from './AuthButtons';

export default function Navbar({
  totalUsers = 0,
  isOnline = true,
  onNavigateToLogin,
  onNavigateToDashboard,
  currentView = 'dashboard',
}) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div
          className="brand"
          onClick={onNavigateToDashboard}
          style={onNavigateToDashboard ? { cursor: 'pointer' } : undefined}
          role={onNavigateToDashboard ? 'button' : undefined}
          tabIndex={onNavigateToDashboard ? 0 : undefined}
          onKeyDown={
            onNavigateToDashboard
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') onNavigateToDashboard();
                }
              : undefined
          }
        >
          <div className="brand-icon">
            <Users size={20} />
          </div>
          <div>
            <h1 className="brand-title">Gestão de Usuários</h1>
            <p className="brand-subtitle">CRUD com FastAPI, PostgreSQL & React</p>
          </div>
        </div>

        <div className="navbar-controls">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong>{totalUsers}</strong> {totalUsers === 1 ? 'usuário' : 'usuários'}
          </span>

          <div className="env-badge dev" title="Ambiente de Desenvolvimento & Homologação">
            <span className="env-dot" />
            <span>Ambiente: DEV</span>
          </div>

          <div className={`api-badge ${isOnline ? '' : 'offline'}`}>
            <span className="status-dot" />
            <span>{isOnline ? 'API Conectada' : 'API Desconectada'}</span>
          </div>

          {isAuthenticated && user ? (
            <div className="user-profile-badge">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.nome}
                  className="user-avatar-img"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="user-avatar-placeholder">
                  {user.nome ? user.nome[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="user-info-text">
                <span className="user-profile-name">{user.nome}</span>
                <span className="user-profile-email">{user.email}</span>
              </div>
              <button
                type="button"
                className="btn-logout"
                onClick={logout}
                title="Encerrar sessão"
                aria-label="Encerrar sessão"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="auth-nav-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {currentView !== 'login' && onNavigateToLogin && (
                <button
                  type="button"
                  className="btn-nav-login"
                  onClick={onNavigateToLogin}
                  title="Acessar tela de login"
                  aria-label="Fazer Login"
                >
                  <LogIn size={15} />
                  <span>Fazer Login</span>
                </button>
              )}
              {currentView === 'login' && onNavigateToDashboard && (
                <button
                  type="button"
                  className="btn-nav-login"
                  onClick={onNavigateToDashboard}
                  title="Ir para o Painel"
                  aria-label="Ir para o Painel"
                >
                  <Users size={15} />
                  <span>Ir para o Painel</span>
                </button>
              )}
              <AuthButtons compact />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
