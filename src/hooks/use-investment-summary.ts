import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PortfolioSummary, TipoConta, PortfolioStats, AssetType } from '@/types/investments';

export function useInvestmentSummary(tipoConta: TipoConta) {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('💰 Buscando resumo de investimentos:', { userId: user.id, tipoConta });

      // Buscar resumo da view
      const { data: summaryData, error: summaryError } = await supabase
        .from('v_portfolio_summary')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('tipo_conta', tipoConta)
        .single();

      if (summaryError && summaryError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (não é erro)
        throw summaryError;
      }

      setSummary(summaryData || null);

      // Buscar detalhes por tipo de ativo
      const { data: positionsData, error: positionsError } = await supabase
        .from('v_positions_detailed')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('tipo_conta', tipoConta);

      if (positionsError) throw positionsError;

      // Calcular stats por tipo
      const byType: PortfolioStats['byType'] = [];
      const typeMap = new Map<AssetType, { count: number; invested: number; currentValue: number }>();

      positionsData?.forEach(pos => {
        const current = typeMap.get(pos.asset_type) || { count: 0, invested: 0, currentValue: 0 };
        typeMap.set(pos.asset_type, {
          count: current.count + 1,
          invested: current.invested + pos.valor_investido,
          currentValue: current.currentValue + pos.valor_atual,
        });
      });

      const totalValue = summaryData?.valor_atual || 0;

      typeMap.forEach((value, type) => {
        byType.push({
          type,
          count: value.count,
          invested: value.invested,
          currentValue: value.currentValue,
          percentage: totalValue > 0 ? (value.currentValue / totalValue) * 100 : 0,
        });
      });

      // Buscar total de dividendos
      const { data: dividendsData, error: dividendsError } = await supabase
        .from('v_dividends_summary')
        .select('valor_total_proventos')
        .eq('usuario_id', user.id)
        .eq('tipo_conta', tipoConta);

      if (dividendsError) {
        console.error('⚠️ Erro ao buscar dividendos:', dividendsError);
      }

      const totalDividends = dividendsData?.reduce((sum, d) => sum + (d.valor_total_proventos || 0), 0) || 0;

      setStats({
        totalAssets: summaryData?.total_ativos || 0,
        totalInvested: summaryData?.valor_investido || 0,
        currentValue: summaryData?.valor_atual || 0,
        profitLoss: summaryData?.lucro_prejuizo || 0,
        profitLossPercentage: summaryData?.rentabilidade_percentual || 0,
        totalDividends,
        byType: byType.sort((a, b) => b.currentValue - a.currentValue),
      });

      console.log('💰 Resumo carregado:', { 
        totalAssets: summaryData?.total_ativos || 0,
        totalValue: summaryData?.valor_atual || 0 
      });

    } catch (error) {
      console.error('❌ Erro ao buscar resumo:', error);
    } finally {
      setLoading(false);
    }
  }, [tipoConta]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    stats,
    byType: stats?.byType || [],
    totalDividends: stats?.totalDividends || 0,
    loading,
    fetchSummary,
  };
}
