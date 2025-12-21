import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { 
  InvestmentPosition, 
  PositionDetailed,
  CreatePositionInput,
  UpdatePositionInput,
  TipoConta 
} from '@/types/investments';

export function useInvestments(tipoConta: TipoConta) {
  const [positions, setPositions] = useState<PositionDetailed[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('📈 Buscando posições de investimento:', { userId: user.id, tipoConta });

      // Usar a view que já tem todos os cálculos
      const { data, error } = await supabase
        .from('v_positions_detailed')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('tipo_conta', tipoConta)
        .order('created_at', { ascending: false });

      console.log('📈 Resultado posições:', { total: data?.length || 0, error });

      if (error) throw error;

      setPositions(data || []);
    } catch (error) {
      console.error('❌ Erro ao buscar posições:', error);
    } finally {
      setLoading(false);
    }
  }, [tipoConta]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const createPosition = async (input: CreatePositionInput) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('investment_positions')
      .insert({
        ...input,
        usuario_id: user.id,
        tipo_conta: tipoConta,
      });

    if (error) throw error;

    await fetchPositions();
    return true;
  };

  const updatePosition = async (id: string, input: UpdatePositionInput) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('investment_positions')
      .update(input)
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;

    await fetchPositions();
    return true;
  };

  const deletePosition = async (id: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('investment_positions')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;

    await fetchPositions();
    return true;
  };

  return {
    positions,
    loading,
    fetchPositions,
    refetch: fetchPositions,
    createPosition,
    updatePosition,
    deletePosition,
  };
}
