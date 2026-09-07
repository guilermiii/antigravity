import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Search, RefreshCw } from 'lucide-react';
import { api } from './services/api';
import Navbar from './components/Navbar';
import UserTable from './components/UserTable';
import UserFormModal from './components/UserFormModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import Toast from './components/Toast';

export default function App() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Carregar usuários
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
      setIsOnline(true);
    } catch (err) {
      setIsOnline(false);
      addToast(err.message || 'Erro ao conectar à API.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtragem de busca
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // Ações de criação / edição
  const handleOpenCreate = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleSaveUser = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedUser && selectedUser.id) {
        // Atualizar
        const updated = await api.updateUser(selectedUser.id, formData);
        setUsers((prev) =>
          prev.map((u) => (u.id === updated.id ? updated : u))
        );
        addToast('Usuário atualizado com sucesso!', 'success');
      } else {
        // Criar
        const created = await api.createUser(formData);
        setUsers((prev) => [...prev, created]);
        addToast('Usuário cadastrado com sucesso!', 'success');
      }
      setIsFormOpen(false);
      setSelectedUser(null);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ações de exclusão
  const handleOpenDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async (id) => {
    setIsDeleting(true);
    try {
      await api.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      addToast('Usuário removido com sucesso!', 'success');
      setIsDeleteOpen(false);
      setUserToDelete(null);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Navbar totalUsers={users.length} isOnline={isOnline} />

      <main className="container">
        <div className="actions-bar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              onClick={fetchUsers}
              disabled={isLoading}
              title="Atualizar dados"
            >
              <RefreshCw size={16} className={isLoading ? 'spinner' : ''} />
              <span>Recarregar</span>
            </button>
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <UserPlus size={16} />
              <span>Novo Usuário</span>
            </button>
          </div>
        </div>

        <UserTable
          users={filteredUsers}
          isLoading={isLoading}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onNewUser={handleOpenCreate}
        />
      </main>

      {/* Modal de Formulário (Criar / Editar) */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveUser}
        initialData={selectedUser}
        isSubmitting={isSubmitting}
      />

      {/* Modal de Confirmação de Exclusão */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        user={userToDelete}
        isDeleting={isDeleting}
      />

      {/* Notificações Toast */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </>
  );
}
