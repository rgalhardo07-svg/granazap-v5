"use client";

import { useState } from "react";
import { Search, Plus, Edit, Eye, Shield, Trash2 } from "lucide-react";
import { useAdminUsers, type AdminUser } from "@/hooks/use-admin-users";
import { UserDetailsModal } from "./user-details-modal";
import { UserEditModal } from "./user-edit-modal";
import { UserCreateModal } from "./user-create-modal";
import { UserDeleteModal } from "./user-delete-modal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function UsersManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { users, stats, loading, updateUser, createUser, deleteUser, refreshUsers } = useAdminUsers(
    searchTerm,
    currentPage,
    itemsPerPage
  );

  const getInitials = (nome: string) => {
    const parts = nome.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleViewDetails = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updates: Partial<AdminUser>) => {
    if (!selectedUser) return;
    const result = await updateUser(selectedUser.id, updates);
    if (result.success) {
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } else {
      alert('Erro ao atualizar usuário: ' + result.error);
    }
  };

  const handleCreateUser = async (userData: any) => {
    const result = await createUser(userData);
    if (result.success) {
      setIsCreateModalOpen(false);
      alert('Usuário criado com sucesso!');
    } else {
      alert('Erro ao criar usuário: ' + result.error);
    }
  };

  const handleDelete = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (deleteAuth: boolean, deleteTransactions: boolean) => {
    if (!selectedUser) return;
    const result = await deleteUser(selectedUser.id, deleteAuth, deleteTransactions);
    if (result.success) {
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      alert('Usuário excluído com sucesso!');
    } else {
      alert('Erro ao excluir usuário: ' + result.error);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-[#22C55E]" />
          <h1 className="text-3xl font-bold text-white">Gestão de Usuários</h1>
        </div>
        <p className="text-zinc-400">Visualize e gerencie todos os usuários da plataforma</p>
      </div>

      {/* Stats Cards - Melhorados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-5 hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-blue-400">TOTAL</div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.total_usuarios || 0}</div>
          <div className="text-xs text-zinc-500 mt-1">Usuários</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-5 hover:border-green-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-green-400">ATIVOS</div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.usuarios_ativos || 0}</div>
          <div className="text-xs text-zinc-500 mt-1">Online</div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-5 hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-red-400">INATIVOS</div>
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.usuarios_inativos || 0}</div>
          <div className="text-xs text-zinc-500 mt-1">Offline</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-5 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-purple-400">ADMINS</div>
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.administradores || 0}</div>
          <div className="text-xs text-zinc-500 mt-1">Gestores</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-5 hover:border-yellow-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-yellow-400">PREMIUM</div>
            <div className="text-xs bg-yellow-500/20 px-2 py-1 rounded text-yellow-400">PRO</div>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.usuarios_premium || 0}</div>
          <div className="text-xs text-zinc-500 mt-1">Pagantes</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-5 hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-orange-400">NOVOS</div>
            <div className="text-xs bg-orange-500/20 px-2 py-1 rounded text-orange-400">30d</div>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.novos_30_dias || 0}</div>
          <div className="text-xs text-zinc-500 mt-1">Este mês</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#22C55E]"
            />
          </div>
          <div className="text-sm text-zinc-400">
            Total: <span className="text-white font-semibold">{users.length} usuários</span>
          </div>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#22C55E]"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-zinc-400">por página</span>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Adicionar Usuário
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white">Lista de Usuários</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Página {currentPage} de {Math.ceil((stats?.total_usuarios || 0) / itemsPerPage)} ({stats?.total_usuarios || 0} total)
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-400">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">Nenhum usuário encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0A0F1C] border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Plano</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Admin</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => {
                  const daysRemaining = getDaysRemaining(user.data_final_plano);
                  
                  return (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                            {getInitials(user.nome)}
                          </div>
                          <div>
                            <div className="text-white font-medium">{user.nome}</div>
                            <div className="text-xs text-zinc-400">ID: #{user.id} • {formatDate(user.created_at)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">{user.email}</div>
                        {user.celular && (
                          <div className="text-xs text-zinc-400">{user.celular}</div>
                        )}
                        <div className="mt-1">
                          {user.has_password ? (
                            <span className="text-xs text-green-400">✓ Conta ativa</span>
                          ) : (
                            <span className="text-xs text-orange-400">🔒 Sem conta de login</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          user.plano === 'free' || !user.plano
                            ? 'bg-zinc-500/20 text-zinc-300'
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {user.plano || 'Free'}
                        </div>
                        {daysRemaining !== null && (
                          <div className="text-xs text-zinc-400 mt-1">
                            Válido: {daysRemaining} dias
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.is_admin ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300">
                            Usuário
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-zinc-500/20 text-zinc-400">
                            Usuário
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          user.status === 'ativo'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-blue-400"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-green-400"
                            title="Detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-red-400"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateUser}
      />

      {selectedUser && (
        <>
          <UserDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onEdit={() => {
              setIsDetailsModalOpen(false);
              setIsEditModalOpen(true);
            }}
            onRefresh={refreshUsers}
          />
          <UserEditModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onSave={handleSaveEdit}
          />
          <UserDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onConfirm={handleConfirmDelete}
          />
        </>
      )}
    </div>
  );
}
