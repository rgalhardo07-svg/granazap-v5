import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useUser } from './use-user';

export interface TeamMember {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  status: string;
  convite_status: 'pendente' | 'aceito' | 'recusado' | 'cancelado';
  avatar_url?: string;
  usuario_principal_id: number;
  permissoes?: {
    pode_ver_dados_admin: boolean;
    pode_ver_outros_membros: boolean;
    pode_criar_transacoes: boolean;
    pode_editar_transacoes: boolean;
    pode_deletar_transacoes: boolean;
    pode_ver_relatorios: boolean;
    pode_gerenciar_contas: boolean;
    pode_gerenciar_cartoes: boolean;
    pode_convidar_membros: boolean;
    nivel_acesso: 'basico' | 'intermediario' | 'avancado';
    tipos_conta_permitidos?: string[];
  };
}

export function useTeamMembers() {
  const supabase = createClient();
  const { profile } = useUser();

  return useQuery({
    queryKey: ['team-members', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('usuarios_dependentes')
        .select('*')
        .eq('usuario_principal_id', profile.id)
        .order('id', { ascending: true });

      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!profile?.id,
  });
}
