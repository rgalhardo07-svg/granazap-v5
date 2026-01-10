"use client";

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./use-user";
import { useAccountFilter } from "./use-account-filter";

export interface Category {
  id: number;
  descricao: string;
  tipo: 'entrada' | 'saida' | 'ambos';
  icon_key: string | null;
  usuario_id: number;
  tipo_conta: 'pessoal' | 'pj';
}

async function fetchCategories(
  userId: number, 
  accountFilter: 'pessoal' | 'pj'
): Promise<Category[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('categoria_trasacoes')
    .select('*')
    .eq('usuario_id', userId)
    .eq('tipo_conta', accountFilter)
    .order('descricao');

  if (error) throw error;

  return data || [];
}

export function useCategoriesQuery() {
  const { profile } = useUser();
  const { filter: accountFilter } = useAccountFilter();
  const queryClient = useQueryClient();

  const queryKey = ['categories', profile?.id, accountFilter];

  const query = useQuery({
    queryKey,
    queryFn: () => {
      if (!profile) throw new Error('User not authenticated');
      return fetchCategories(profile.id, accountFilter);
    },
    enabled: !!profile,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  // Listener para recarregar quando uma nova categoria for criada
  useEffect(() => {
    const handleCategoriesChanged = () => {
      invalidateAll();
    };

    window.addEventListener('categoriesChanged', handleCategoriesChanged);

    return () => {
      window.removeEventListener('categoriesChanged', handleCategoriesChanged);
    };
  }, [queryClient]);

  return {
    categories: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: invalidateAll,
    isRefetching: query.isRefetching,
  };
}
