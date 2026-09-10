import React from 'react';
import {
  ShieldCheck,
  Shield,
  KeyRound,
  Users,
  ArrowRight,
  LogOut,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GitHubIcon, GoogleIcon } from './AuthButtons';

export default function LoginScreen({ onNavigateToDashboard }) {
  const {
    user,
    isAuthenticated,
    isLoading,
    authError,
    clearAuthError,
    loginWithProvider,
    logout,
  } = useAuth();

  if (isLoading) {
    return (
      <div className="login-wrapper">
        <div className="login-card login-loading-card" data-testid="login-loading-spinner">
          <RefreshCw size={36} className="spinner" style={{ color: 'var(--primary, #3b82f6)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Verificando credenciais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Banner de erro de autenticação */}
        {authError && (
          <div className="login-error-alert" role="alert">
            <div className="login-error-content">
              <AlertCircle size={18} className="login-error-icon" />
              <span>{authError}</span>
            </div>
            <button
              type="button"
              className="login-error-dismiss"
              onClick={clearAuthError}
              title="Dispensar alerta"
              aria-label="Dispensar alerta"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {isAuthenticated && user ? (
          /* Estado Autenticado: Exibe perfil e ações */
          <div className="active-session-card">
            <div className="active-session-header">
              <div className="login-icon-badge success">
                <ShieldCheck size={28} />
              </div>
              <div>
                <span className="active-session-badge">Sessão Ativa</span>
                <h1 className="login-title">Você já está conectado</h1>
                <p className="login-subtitle">
                  Sessão iniciada com sucesso na plataforma.
                </p>
              </div>
            </div>

            <div className="active-user-profile">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.nome}
                  className="active-avatar-img"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="active-avatar-placeholder">
                  {user.nome ? user.nome[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="active-user-details">
                <span className="active-user-name">{user.nome} {user.sobrenome}</span>
                <span className="active-user-email">{user.email}</span>
                {user.linked_providers && user.linked_providers.length > 0 && (
                  <div className="linked-providers-tags">
                    {user.linked_providers.map((p) => (
                      <span key={p} className="provider-tag">
                        {p === 'github' ? 'GitHub' : p === 'google' ? 'Google' : p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="active-session-actions">
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={onNavigateToDashboard}
                aria-label="Ir para o Painel"
              >
                <span>Ir para o Painel de Usuários</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={logout}
                aria-label="Encerrar sessão"
              >
                <LogOut size={16} />
                <span>Encerrar sessão</span>
              </button>
            </div>
          </div>
        ) : (
          /* Estado Não Autenticado: Tela de Login OAuth2 */
          <>
            <div className="login-header">
              <div className="login-icon-badge">
                <ShieldCheck size={32} />
              </div>
              <h1 className="login-title">Acesse sua Conta</h1>
              <p className="login-subtitle">
                Gerenciamento seguro de usuários com autenticação federada OAuth 2.0.
              </p>
            </div>

            <div className="oauth-buttons-section">
              <button
                type="button"
                className="btn-oauth-large btn-github"
                onClick={() => loginWithProvider('github')}
                title="Continuar com GitHub"
                aria-label="Continuar com GitHub"
              >
                <GitHubIcon size={20} />
                <span>Continuar com GitHub</span>
              </button>

              <button
                type="button"
                className="btn-oauth-large btn-google"
                onClick={() => loginWithProvider('google')}
                title="Continuar com Google"
                aria-label="Continuar com Google"
              >
                <GoogleIcon size={20} />
                <span>Continuar com Google</span>
              </button>
            </div>

            <div className="login-divider">
              <span>Recursos & Segurança</span>
            </div>

            <div className="security-features-grid">
              <div className="security-feature-item">
                <div className="security-feature-icon">
                  <Shield size={16} />
                </div>
                <div>
                  <strong>Proteção Anti-CSRF</strong>
                  <p>State criptográfico HMAC-SHA256.</p>
                </div>
              </div>

              <div className="security-feature-item">
                <div className="security-feature-icon">
                  <KeyRound size={16} />
                </div>
                <div>
                  <strong>Sessão JWT Assinada</strong>
                  <p>Tokens HS256 com expiração rigorosa.</p>
                </div>
              </div>

              <div className="security-feature-item">
                <div className="security-feature-icon">
                  <Users size={16} />
                </div>
                <div>
                  <strong>Vinculação Automática de Contas</strong>
                  <p>Associação inteligente pelo mesmo e-mail verificado.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
