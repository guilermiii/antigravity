import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, FileText, MapPin, Globe, GraduationCap } from 'lucide-react';
import { formatCPF, formatPhone, formatCEP } from '../utils/formatters';

function isValidCPF(cpf) {
  if (!cpf) return true;
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i], 10) * (10 - i);
  let rest = sum % 11;
  let d1 = rest < 2 ? 0 : 11 - rest;
  if (parseInt(digits[9], 10) !== d1) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i], 10) * (11 - i);
  rest = sum % 11;
  let d2 = rest < 2 ? 0 : 11 - rest;
  return parseInt(digits[10], 10) === d2;
}

export default function UserFormModal({ isOpen, onClose, onSave, initialData, isSubmitting }) {
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    idade: '',
    genero: '',
    cpf: '',
    rua: '',
    numero: '',
    cidade: '',
    estado: '',
    cep: '',
    pais: 'Brasil',
    escolaridade: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        sobrenome: initialData.sobrenome || '',
        email: initialData.email || '',
        telefone: initialData.telefone ? formatPhone(initialData.telefone) : '',
        idade: initialData.idade != null ? String(initialData.idade) : '',
        genero: initialData.genero || '',
        cpf: initialData.cpf ? formatCPF(initialData.cpf) : '',
        rua: initialData.rua || '',
        numero: initialData.numero || '',
        cidade: initialData.cidade || '',
        estado: initialData.estado || '',
        cep: initialData.cep ? formatCEP(initialData.cep) : '',
        pais: initialData.pais || 'Brasil',
        escolaridade: initialData.escolaridade || '',
      });
    } else {
      setFormData({
        nome: '',
        sobrenome: '',
        email: '',
        telefone: '',
        idade: '',
        genero: '',
        cpf: '',
        rua: '',
        numero: '',
        cidade: '',
        estado: '',
        cep: '',
        pais: 'Brasil',
        escolaridade: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    let formatted = value;
    if (field === 'cpf') {
      const clean = value.replace(/\D/g, '').slice(0, 11);
      if (clean.length > 9) {
        formatted = clean.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
      } else if (clean.length > 6) {
        formatted = clean.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
      } else if (clean.length > 3) {
        formatted = clean.replace(/(\d{3})(\d{1,3})/, '$1.$2');
      } else {
        formatted = clean;
      }
    } else if (field === 'telefone') {
      const clean = value.replace(/\D/g, '').slice(0, 11);
      if (clean.length > 10) {
        formatted = clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (clean.length > 6) {
        formatted = clean.replace(/(\d{2})(\d{4})(\d{1,4})/, '($1) $2-$3');
      } else if (clean.length > 2) {
        formatted = clean.replace(/(\d{2})(\d{1,5})/, '($1) $2');
      } else if (clean.length > 0) {
        formatted = `(${clean}`;
      } else {
        formatted = clean;
      }
    } else if (field === 'cep') {
      const clean = value.replace(/\D/g, '').slice(0, 8);
      if (clean.length > 5) {
        formatted = clean.replace(/(\d{5})(\d{1,3})/, '$1-$2');
      } else {
        formatted = clean;
      }
    }

    setFormData((prev) => ({ ...prev, [field]: formatted }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // 1. Obrigatórios
    if (!formData.nome.trim()) {
      newErrors.nome = 'O nome é obrigatório.';
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'O nome deve conter pelo menos 2 caracteres.';
    }

    if (!formData.sobrenome.trim()) {
      newErrors.sobrenome = 'O sobrenome é obrigatório.';
    } else if (formData.sobrenome.trim().length < 2) {
      newErrors.sobrenome = 'O sobrenome deve conter pelo menos 2 caracteres.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'O e-mail é obrigatório.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Insira um formato de e-mail válido.';
    }

    // 2. Opcionais com validação de formato
    if (formData.cpf && formData.cpf.trim()) {
      if (!isValidCPF(formData.cpf)) {
        newErrors.cpf = 'CPF inválido.';
      }
    }

    if (formData.idade !== '' && formData.idade != null) {
      const parsedAge = parseInt(formData.idade, 10);
      if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150) {
        newErrors.idade = 'A idade deve estar entre 0 e 150 anos.';
      }
    }

    if (formData.cep && formData.cep.trim()) {
      const cleanCep = formData.cep.replace(/\D/g, '');
      if (cleanCep.length !== 8) {
        newErrors.cep = 'CEP inválido. Deve conter 8 dígitos.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      nome: formData.nome.trim(),
      sobrenome: formData.sobrenome.trim(),
      email: formData.email.trim(),
      telefone: formData.telefone.trim() || null,
      idade: formData.idade !== '' ? parseInt(formData.idade, 10) : null,
      genero: formData.genero.trim() || null,
      cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : null,
      rua: formData.rua.trim() || null,
      numero: formData.numero.trim() || null,
      cidade: formData.cidade.trim() || null,
      estado: formData.estado.trim() || null,
      cep: formData.cep.trim() || null,
      pais: formData.pais.trim() || 'Brasil',
      escolaridade: formData.escolaridade.trim() || null,
    };

    onSave(payload);
  };

  const isEditing = Boolean(initialData && initialData.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-form-large" onClick={(e) => e.stopPropagation()}>
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
          <div className="modal-body form-body-scroll">
            {/* Seção 1: Dados Obrigatórios */}
            <div className="form-section">
              <h3 className="section-title">Dados Obrigatórios</h3>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="userNome">Nome *</label>
                  <div className="input-container">
                    <User size={16} className="input-icon" />
                    <input
                      id="userNome"
                      type="text"
                      className={`form-input ${errors.nome ? 'input-error' : ''}`}
                      placeholder="Ex: Carlos"
                      value={formData.nome}
                      onChange={(e) => handleChange('nome', e.target.value)}
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>
                  {errors.nome && <p className="form-error">{errors.nome}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="userSobrenome">Sobrenome *</label>
                  <div className="input-container">
                    <User size={16} className="input-icon" />
                    <input
                      id="userSobrenome"
                      type="text"
                      className={`form-input ${errors.sobrenome ? 'input-error' : ''}`}
                      placeholder="Ex: Eduardo da Silva"
                      value={formData.sobrenome}
                      onChange={(e) => handleChange('sobrenome', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.sobrenome && <p className="form-error">{errors.sobrenome}</p>}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="userEmail">Endereço de E-mail *</label>
                  <div className="input-container">
                    <Mail size={16} className="input-icon" />
                    <input
                      id="userEmail"
                      type="email"
                      className={`form-input ${errors.email ? 'input-error' : ''}`}
                      placeholder="Ex: carlos@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.email && <p className="form-error">{errors.email}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="userTelefone">Telefone</label>
                  <div className="input-container">
                    <Phone size={16} className="input-icon" />
                    <input
                      id="userTelefone"
                      type="tel"
                      className="form-input"
                      placeholder="Ex: (11) 98765-4321"
                      value={formData.telefone}
                      onChange={(e) => handleChange('telefone', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Dados Pessoais Complementares */}
            <div className="form-section">
              <h3 className="section-title">Informações Pessoais (Opcionais)</h3>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label" htmlFor="userCpf">CPF</label>
                  <div className="input-container">
                    <FileText size={16} className="input-icon" />
                    <input
                      id="userCpf"
                      type="text"
                      className={`form-input ${errors.cpf ? 'input-error' : ''}`}
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => handleChange('cpf', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.cpf && <p className="form-error">{errors.cpf}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="userIdade">Idade</label>
                  <div className="input-container">
                    <Calendar size={16} className="input-icon" />
                    <input
                      id="userIdade"
                      type="number"
                      min="0"
                      max="150"
                      className={`form-input ${errors.idade ? 'input-error' : ''}`}
                      placeholder="Ex: 30"
                      value={formData.idade}
                      onChange={(e) => handleChange('idade', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.idade && <p className="form-error">{errors.idade}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="userGenero">Gênero</label>
                  <div className="input-container">
                    <User size={16} className="input-icon" />
                    <select
                      id="userGenero"
                      className="form-input select-input"
                      value={formData.genero}
                      onChange={(e) => handleChange('genero', e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="">Selecione...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Não-binário">Não-binário</option>
                      <option value="Outro">Outro</option>
                      <option value="Prefiro não informar">Prefiro não informar</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="userEscolaridade">Escolaridade</label>
                  <div className="input-container">
                    <GraduationCap size={16} className="input-icon" />
                    <select
                      id="userEscolaridade"
                      className="form-input select-input"
                      value={formData.escolaridade}
                      onChange={(e) => handleChange('escolaridade', e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="">Selecione...</option>
                      <option value="Ensino Fundamental">Ensino Fundamental</option>
                      <option value="Ensino Médio">Ensino Médio</option>
                      <option value="Ensino Superior Incompleto">Ensino Superior Incompleto</option>
                      <option value="Ensino Superior Completo">Ensino Superior Completo</option>
                      <option value="Pós-Graduação / Especialização">Pós-Graduação / Especialização</option>
                      <option value="Mestrado">Mestrado</option>
                      <option value="Doutorado">Doutorado</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="userPais">País</label>
                  <div className="input-container">
                    <Globe size={16} className="input-icon" />
                    <input
                      id="userPais"
                      type="text"
                      className="form-input"
                      placeholder="Ex: Brasil"
                      value={formData.pais}
                      onChange={(e) => handleChange('pais', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 3: Endereço */}
            <div className="form-section">
              <h3 className="section-title"><MapPin size={16} /> Endereço (Opcional)</h3>
              <div className="form-grid-3">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" htmlFor="userRua">Rua / Logradouro</label>
                  <input
                    id="userRua"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Rua das Palmeiras"
                    value={formData.rua}
                    onChange={(e) => handleChange('rua', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="userNumero">Número</label>
                  <input
                    id="userNumero"
                    type="text"
                    className="form-input"
                    placeholder="Ex: 123"
                    value={formData.numero}
                    onChange={(e) => handleChange('numero', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label" htmlFor="userCep">CEP</label>
                  <input
                    id="userCep"
                    type="text"
                    className={`form-input ${errors.cep ? 'input-error' : ''}`}
                    placeholder="Ex: 01310-100"
                    value={formData.cep}
                    onChange={(e) => handleChange('cep', e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.cep && <p className="form-error">{errors.cep}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="userCidade">Cidade</label>
                  <input
                    id="userCidade"
                    type="text"
                    className="form-input"
                    placeholder="Ex: São Paulo"
                    value={formData.cidade}
                    onChange={(e) => handleChange('cidade', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="userEstado">Estado / UF</label>
                  <input
                    id="userEstado"
                    type="text"
                    className="form-input"
                    placeholder="Ex: SP"
                    value={formData.estado}
                    onChange={(e) => handleChange('estado', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
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
