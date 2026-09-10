import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Search, RefreshCw } from 'lucide-react';
import { api } from './services/api';
import Navbar from './components/Navbar';
import UserTable from './components/UserTable';
import UserFormModal from './components/UserFormModal';
import UserDetailModal from './components/UserDetailModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import Toast from './components/Toast';
import LoginScreen from './components/LoginScreen';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const [users, setUsers] = useState([]);
  const { authError, clearAuthError } = useAuth() || {};

  const [currentView, setCurrentView] = useState(() => {
    return typeof window !== 'undefined' && window.location.hash === '#login'
      ? 'login'
      : 'dashboard';
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

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

  useEffect(() => {
    if (authError) {
      addToast(authError, 'error');
      if (typeof clearAuthError === 'function') {
        clearAuthError();
      }
    }
  }, [authError, clearAuthError]);

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

  // Filtragem de busca em múltiplos campos
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter((u) => {
      const nome = (u.nome || u.name || '').toLowerCase();
      const sobrenome = (u.sobrenome || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const cpf = (u.cpf || '').replace(/\D/g, '');
      const cidade = (u.cidade || '').toLowerCase();
      const termClean = term.replace(/\D/g, '');

      return (
        nome.includes(term) ||
        sobrenome.includes(term) ||
        email.includes(term) ||
        cidade.includes(term) ||
        (termClean.length > 0 && cpf.includes(termClean))
      );
    });
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

  const handleOpenDetail = (user) => {
    setDetailUser(user);
    setIsDetailOpen(true);
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
        setUsers((prev) => [created, ...prev]);
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

  // Sincronização da rota por Hash (#login)
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        if (window.location.hash === '#login') {
          setCurrentView('login');
        } else if (
          !window.location.hash ||
          window.location.hash === '#' ||
          window.location.hash === '#dashboard'
        ) {
          setCurrentView('dashboard');
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToLogin = () => {
    setCurrentView('login');
    if (typeof window !== 'undefined') {
      window.location.hash = 'login';
    }
  };

  const navigateToDashboard = () => {
    setCurrentView('dashboard');
    if (typeof window !== 'undefined' && window.location.hash === '#login') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  return (
    <>
      <Navbar
        totalUsers={users.length}
        isOnline={isOnline}
        onNavigateToLogin={navigateToLogin}
        onNavigateToDashboard={navigateToDashboard}
        currentView={currentView}
      />

      {currentView === 'login' ? (
        <LoginScreen onNavigateToDashboard={navigateToDashboard} />
      ) : (
        <main className="container">
          <div className="actions-bar">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Buscar por nome, e-mail, CPF ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="actions-buttons">
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
            onView={handleOpenDetail}
            onNewUser={handleOpenCreate}
          />
        </main>
      )}

      {/* Modal de Formulário (Criar / Editar) */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveUser}
        initialData={selectedUser}
        isSubmitting={isSubmitting}
      />

      {/* Modal de Ficha Cadastral Completa */}
      <UserDetailModal
        isOpen={isDetailOpen}
        user={detailUser}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailUser(null);
        }}
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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

