import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface UserProfile {
  id: number;
  created_at?: string;
  nome: string;
  email: string;
  celular?: string;
  auth_user: string;
  plano?: string;
  plano_id?: number;
  status?: string;
  idioma?: 'pt' | 'es' | 'en';
  moeda?: 'BRL' | 'USD' | 'EUR' | 'PYG' | 'ARS';
  data_fim_plano?: string;
  is_dependente?: boolean; // Indica se é usuário dependente
  usuario_principal_id?: number; // ID do usuário principal (se for dependente)
  dependente_id?: number; // ID na tabela usuarios_dependentes (se for dependente)
  max_usuarios_dependentes?: number; // Limite de dependentes do plano
  permite_compartilhamento?: boolean; // Se o plano permite compartilhamento
  [key: string]: any; // Permitir outras colunas do banco
}

export function useUser() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      // 1. Buscar usuário da autenticação
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authUser) return { user: null, profile: null };

      // 2. Tentar buscar como usuário principal
      const { data: profileData, error: profileError } = await supabase
        .from('usuarios')
        .select(`
          *,
          planos_sistema!plano_id (
            max_usuarios_dependentes,
            permite_compartilhamento
          )
        `)
        .eq('auth_user', authUser.id)
        .single();

      // Se encontrou como usuário principal, retornar
      if (profileData) {
        const finalProfile = {
          user: authUser,
          profile: {
            ...profileData,
            is_dependente: false,
            max_usuarios_dependentes: (profileData.planos_sistema as any)?.[0]?.max_usuarios_dependentes || 0,
            permite_compartilhamento: (profileData.planos_sistema as any)?.[0]?.permite_compartilhamento || false
          } as UserProfile
        };

        // Salvar no localStorage para evitar flash no refresh
        try {
          localStorage.setItem('user_profile_cache', JSON.stringify(finalProfile));
        } catch (e) {
        }

        return finalProfile;
      }

      // 3. Se não encontrou, verificar se é usuário dependente
      const { data: dependenteData, error: dependenteError } = await supabase
        .from('usuarios_dependentes')
        .select('id, nome, email, telefone, usuario_principal_id, status')
        .eq('auth_user_id', authUser.id)
        .eq('status', 'ativo')
        .single();

      if (dependenteData) {
        // Buscar dados do usuário principal para herdar configurações
        const { data: principalData } = await supabase
          .from('usuarios')
          .select(`
            idioma, 
            moeda, 
            plano,
            planos_sistema!plano_id (
              max_usuarios_dependentes,
              permite_compartilhamento
            )
          `)
          .eq('id', dependenteData.usuario_principal_id)
          .single();

        const finalProfile = {
          user: authUser,
          profile: {
            id: dependenteData.usuario_principal_id, // Usar ID do principal para queries
            nome: dependenteData.nome,
            email: dependenteData.email,
            celular: dependenteData.telefone,
            auth_user: authUser.id,
            idioma: principalData?.idioma || 'pt',
            moeda: principalData?.moeda || 'BRL',
            plano: principalData?.plano,
            is_dependente: true,
            usuario_principal_id: dependenteData.usuario_principal_id,
            dependente_id: dependenteData.id,
            max_usuarios_dependentes: (principalData?.planos_sistema as any)?.[0]?.max_usuarios_dependentes || 0,
            permite_compartilhamento: (principalData?.planos_sistema as any)?.[0]?.permite_compartilhamento || false
          } as UserProfile
        };


        // Salvar no localStorage para evitar flash no refresh
        try {
          localStorage.setItem('user_profile_cache', JSON.stringify(finalProfile));
        } catch (e) {
        }

        return finalProfile;
      }

      // Se não encontrou nem como principal nem como dependente
      return { user: authUser, profile: null };
    },
    initialData: () => {
      // Tentar restaurar do localStorage antes de buscar do Supabase
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('user_profile_cache');
          if (cached) {
            return JSON.parse(cached);
          }
        } catch (e) {
        }
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 60, // 1 hora de cache (perfil muda pouco)
    gcTime: 1000 * 60 * 60 * 24, // 24 horas em cache
    retry: 1,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!data?.user) throw new Error('Usuário não logado');

      const { error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('auth_user', data.user.id);

      if (error) throw error;
      return updates;
    },
    onSuccess: (updates) => {
      // Atualizar cache otimisticamente
      queryClient.setQueryData(['user-profile'], (old: any) => ({
        ...old,
        profile: { ...old.profile, ...updates }
      }));
    }
  });

  return {
    user: data?.user ?? null,
    profile: data?.profile ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    updateProfile: async (updates: Partial<UserProfile>) => {
      try {
        await updateProfileMutation.mutateAsync(updates);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    refresh: () => queryClient.invalidateQueries({ queryKey: ['user-profile'] })
  };
}
