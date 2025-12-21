import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from './use-user';
import type { InvestmentAccessInfo } from '@/types/investments';

export function useInvestmentAccess() {
  const { profile } = useUser();
  const [accessInfo, setAccessInfo] = useState<InvestmentAccessInfo>({
    hasAccess: false,
    plan: 'free',
    maxAssets: 0,
    currentAssets: 0,
    canAddMore: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!profile?.plano_id) {
        setAccessInfo({
          hasAccess: false,
          plan: 'free',
          maxAssets: 0,
          currentAssets: 0,
          canAddMore: false,
        });
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        
        // Buscar permissões do plano
        const { data: planData, error: planError } = await supabase
          .from('planos_sistema')
          .select('nome, permite_investimentos, max_ativos_investimento')
          .eq('id', profile.plano_id)
          .single();

        if (planError) {
          console.error('❌ Erro ao buscar permissões do plano:', planError);
          setLoading(false);
          return;
        }

        // Contar ativos atuais do usuário
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { count, error: countError } = await supabase
          .from('investment_positions')
          .select('*', { count: 'exact', head: true })
          .eq('usuario_id', user.id);

        if (countError) {
          console.error('❌ Erro ao contar ativos:', countError);
        }

        const currentAssets = count || 0;
        const maxAssets = planData.max_ativos_investimento || 0;
        const hasAccess = planData.permite_investimentos === true;
        const canAddMore = hasAccess && (maxAssets === -1 || currentAssets < maxAssets);

        setAccessInfo({
          hasAccess,
          plan: planData.nome || 'free',
          maxAssets,
          currentAssets,
          canAddMore,
        });
      } catch (error) {
        console.error('❌ Erro ao verificar acesso:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [profile?.plano_id]);

  return { ...accessInfo, loading };
}
