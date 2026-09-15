import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, user, isDeleting }) {
  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
            <AlertTriangle size={20} />
            Excluir Usuário
          </h2>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Fechar"
            disabled={isDeleting}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            Tem certeza que deseja excluir o usuário <strong>{user.name}</strong>?
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            E-mail: <code>{user.email}</code>
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--danger)', marginTop: '0.75rem' }}>
            Esta ação não poderá ser desfeita.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onConfirm(user.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="spinner" />
                <span>Excluindo...</span>
              </>
            ) : (
              <span>Confirmar Exclusão</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
