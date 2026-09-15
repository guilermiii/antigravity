import React from 'react';
import { Edit2, Trash2, Eye, UserX, MapPin, Phone } from 'lucide-react';
import { getInitials, formatDate, formatPhone } from '../utils/formatters';

export default function UserTable({ users, isLoading, onEdit, onDelete, onView, onNewUser }) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="state-container">
          <div className="spinner dark" />
          <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>Carregando usuários...</p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="card">
        <div className="state-container">
          <UserX className="state-icon" />
          <h3 className="state-title">Nenhum usuário encontrado</h3>
          <p className="state-desc">
            Não há registros cadastrados ou nenhum resultado correspondeu à sua busca.
          </p>
          <button className="btn btn-primary" onClick={onNewUser}>
            Cadastrar primeiro usuário
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Contato</th>
              <th>Localidade</th>
              <th className="date-col">Data de Cadastro</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const fullName = `${user.nome || ''} ${user.sobrenome || ''}`.trim() || user.name || 'Sem nome';
              const location = [user.cidade, user.estado].filter(Boolean).join(' - ') || user.pais || '-';

              return (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar">{getInitials(user.nome, user.sobrenome)}</div>
                      <div className="user-info">
                        <span className="user-name">{fullName}</span>
                        <span className="user-id">ID #{user.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                      <span className="email-cell">{user.email}</span>
                      {user.telefone && (
                        <span className="phone-cell">
                          <Phone size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          {formatPhone(user.telefone)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="location-cell">
                      {location !== '-' && (
                        <MapPin size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      )}
                      {location}
                    </span>
                  </td>
                  <td className="date-col">
                    <span className="date-cell">{formatDate(user.created_at)}</span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-icon view"
                        onClick={() => onView && onView(user)}
                        title="Ver detalhes do usuário"
                        aria-label="Ver detalhes"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn-icon edit"
                        onClick={() => onEdit(user)}
                        title="Editar usuário"
                        aria-label="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => onDelete(user)}
                        title="Excluir usuário"
                        aria-label="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
