import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface AdminUser {
  id: number;
  nome: string;
  email: string;
  celular: string | null;
  plano: string | null;
  plano_id: number | null;
  status: string;
  is_admin: boolean;
  data_compra: string | null;
  data_final_plano: string | null;
  data_ultimo_acesso: string | null;
  has_password: boolean;
  created_at: string;
}

export interface UserStats {
  total_usuarios: number;
  usuarios_ativos: number;
  usuarios_inativos: number;
  administradores: number;
  novos_30_dias: number;
  usuarios_free: number;
  usuarios_premium: number;
}

export function useAdminUsers(searchTerm: string, page: number, limit: number) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_user_stats');
      if (error) {
        console.error('Erro ao buscar stats:', error.message);
        return;
      }
      setStats(data);
    } catch (error: any) {
      console.error('Erro stats:', error.message);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_list_users', {
        p_search: searchTerm,
        p_limit: limit,
        p_offset: (page - 1) * limit,
      });
      
      if (error) {
        console.error('Erro ao buscar usuários:', error.message);
        return;
      }
      
      setUsers(data || []);
    } catch (error: any) {
      console.error('Erro:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: number, updates: Partial<AdminUser>) => {
    try {
      console.log('🔄 Atualizando usuário:', userId);
      console.log('📝 Dados enviados:', updates);
      
      // Converter plano_id se vier como string
      const planoId = updates.plano_id ? Number(updates.plano_id) : undefined;
      
      const { error } = await supabase.rpc('admin_update_user', {
        p_user_id: userId,
        p_nome: updates.nome,
        p_email: updates.email,
        p_celular: updates.celular,
        p_plano_id: planoId,
        p_status: updates.status,
        p_is_admin: updates.is_admin,
        p_data_compra: updates.data_compra,
        p_data_final_plano: updates.data_final_plano,
      });
      
      if (error) {
        console.error('❌ Erro ao atualizar:', error);
        throw error;
      }
      
      console.log('✅ Usuário atualizado com sucesso!');
      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      console.error('❌ Erro final:', error.message);
      return { success: false, error: error.message };
    }
  };

  const createUser = async (userData: {
    nome: string;
    email: string;
    celular?: string;
    plano?: string;
    plano_id?: number;
    is_admin?: boolean;
    criar_login?: boolean;
    senha?: string;
  }) => {
    try {
      let data, error;
      
      // Se criar_login estiver marcado, usar função com autenticação
      if (userData.criar_login && userData.senha) {
        const result = await supabase.rpc('admin_create_user_with_auth', {
          p_nome: userData.nome,
          p_email: userData.email,
          p_senha: userData.senha,
          p_celular: userData.celular || null,
          p_plano_id: userData.plano_id || null,
          p_is_admin: userData.is_admin || false,
        });
        data = result.data;
        error = result.error;
      } else {
        // Criar usuário sem autenticação (função antiga)
        const result = await supabase.rpc('admin_create_user', {
          p_nome: userData.nome,
          p_email: userData.email,
          p_celular: userData.celular || null,
          p_plano: userData.plano || 'free',
          p_is_admin: userData.is_admin || false,
        });
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      await fetchUsers();
      await fetchStats();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (
    userId: number,
    deleteAuth: boolean = false,
    deleteTransactions: boolean = false
  ) => {
    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        p_user_id: userId,
        p_delete_auth: deleteAuth,
        p_delete_transactions: deleteTransactions,
      });
      
      if (error) throw error;
      await fetchUsers();
      await fetchStats();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const clearChatHistory = async (userId: number) => {
    try {
      const { error } = await supabase.rpc('admin_clear_chat_history', {
        p_user_id: userId,
      });

      if (error) throw error;
      alert('Histórico de chat limpo com sucesso!');
      await fetchUsers();
    } catch (error: any) {
      alert(`Erro ao limpar histórico: ${error.message}`);
    }
  };

  const resetPassword = async (userId: number, newPassword: string) => {
    try {
      const { data, error } = await supabase.rpc('admin_reset_user_password', {
        p_user_id: userId,
        p_new_password: newPassword,
      });

      if (error) throw error;
      alert('Senha resetada com sucesso!');
      await fetchUsers();
      return true;
    } catch (error: any) {
      alert(`Erro ao resetar senha: ${error.message}`);
      return false;
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, page, limit]);

  return {
    users,
    stats,
    loading,
    updateUser,
    createUser,
    deleteUser,
    clearChatHistory,
    resetPassword,
    refreshUsers: fetchUsers,
  };
}
