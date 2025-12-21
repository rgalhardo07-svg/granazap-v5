import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { InvestmentAsset, CreateAssetInput, AssetType } from '@/types/investments';

export function useInvestmentAssets(type?: AssetType) {
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      console.log('📊 Buscando ativos:', { type });

      let query = supabase
        .from('investment_assets')
        .select('*')
        .eq('is_active', true)
        .order('ticker', { ascending: true });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      console.log('📊 Resultado ativos:', { total: data?.length || 0, error });

      if (error) throw error;

      setAssets(data || []);
    } catch (error) {
      console.error('❌ Erro ao buscar ativos:', error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const searchAsset = async (ticker: string): Promise<InvestmentAsset | null> => {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('investment_assets')
      .select('*')
      .eq('ticker', ticker.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error) {
      console.log('ℹ️ Ativo não encontrado:', ticker);
      return null;
    }

    return data;
  };

  const createAsset = async (input: CreateAssetInput): Promise<InvestmentAsset> => {
    const supabase = createClient();

    // Verificar se já existe
    const existing = await searchAsset(input.ticker);
    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from('investment_assets')
      .insert({
        ticker: input.ticker.toUpperCase(),
        name: input.name || null,
        type: input.type,
        source: input.source,
        current_price: input.current_price || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    await fetchAssets();
    return data;
  };

  return {
    assets,
    loading,
    fetchAssets,
    searchAsset,
    searchAssets: searchAsset,
    createAsset,
  };
}
