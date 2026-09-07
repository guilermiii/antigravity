import React, { useState, useEffect } from 'react';
import { X, User, Mail } from 'lucide-react';

export default function UserFormModal({ isOpen, onClose, onSave, initialData, isSubmitting }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setEmail(initialData.email || '');
    } else {
      setName('');
      setEmail('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'O nome é obrigatório.';
    }
    if (!email.trim()) {
      newErrors.email = 'O e-mail é obrigatório.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Insira um formato de e-mail válido.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ name: name.trim(), email: email.trim() });
  };

  const isEditing = Boolean(initialData && initialData.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Fechar"
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="userName">Nome Completo</label>
              <div className="input-container">
                <User size={16} className="input-icon" />
                <input
                  id="userName"
                  type="text"
                  className="form-input"
                  placeholder="Ex: João da Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="userEmail">Endereço de E-mail</label>
              <div className="input-container">
                <Mail size={16} className="input-icon" />
                <input
                  id="userEmail"
                  type="email"
                  className="form-input"
                  placeholder="Ex: joao.silva@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Usuário'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
