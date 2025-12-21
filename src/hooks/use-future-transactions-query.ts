"use client";

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./use-user";
import { useAccountFilter } from "./use-account-filter";
import { useUserFilter } from "./use-user-filter";
import type { FutureTransaction } from './use-future-transactions';

// Função para buscar lançamentos futuros
async function fetchFutureTransactions(
  userId: number,
  accountFilter: 'pessoal' | 'pj',
  period: 'day' | 'week' | 'month' | 'year' | 'custom' = 'month',
  tipo?: 'entrada' | 'saida',
  userFilter?: 'todos' | 'principal' | number | null
): Promise<FutureTransaction[]> {
  const supabase = createClient();

  // NÃO aplicar filtro de data aqui - deixar o componente filtrar no client-side
  // Isso permite que o filtro personalizado de data funcione corretamente
  let query = supabase
    .from('lancamentos_futuros')
    .select(`
      *,
      categoria:categoria_trasacoes!inner(descricao, icon_key)
    `)
    .eq('usuario_id', userId)
    .eq('tipo_conta', accountFilter);

  if (tipo) {
    query = query.eq('tipo', tipo);
  }

  // Aplicar filtro de usuário
  if (userFilter === 'principal') {
    query = query.is('dependente_id', null);
  } else if (typeof userFilter === 'number' && userFilter > 0) {
    query = query.eq('dependente_id', userFilter);
  }

  const { data, error } = await query
    .order('data_prevista', { ascending: true })
    .limit(1000);

  if (error) throw error;

  return data || [];
}

export function useFutureTransactionsQuery(
  period: 'day' | 'week' | 'month' | 'year' | 'custom' = 'month',
  tipo?: 'entrada' | 'saida'
) {
  const { profile } = useUser();
  const { filter: accountFilter } = useAccountFilter();
  const { filter: userFilter } = useUserFilter();
  const queryClient = useQueryClient();

  // Query key inclui período e userFilter
  const queryKey = ['futureTransactions', profile?.id, accountFilter, period, userFilter];

  const query = useQuery({
    queryKey,
    queryFn: () => {
      if (!profile) throw new Error('User not authenticated');
      return fetchFutureTransactions(profile.id, accountFilter, period, tipo, userFilter);
    },
    enabled: !!profile, // Só executa se tiver profile
    placeholderData: (previousData) => previousData, // Mantém dados antigos enquanto busca novos
    initialData: () => {
      // Tentar pegar dados do cache
      return queryClient.getQueryData(queryKey);
    },
  });

  // Filtrar por tipo no CLIENTE (não no servidor)
  const filteredTransactions = tipo 
    ? (query.data || []).filter(t => t.tipo === tipo)
    : (query.data || []);

  // Escutar evento de atualização de lançamentos futuros
  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey });
    };

    window.addEventListener('futureTransactionsChanged', handleUpdate);
    return () => window.removeEventListener('futureTransactionsChanged', handleUpdate);
  }, [queryClient, queryKey]);

  // Função para invalidar e refetch manual (compatibilidade com código antigo)
  const refetch = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  return {
    transactions: filteredTransactions,
    loading: query.isLoading && !query.data, // Só loading se não tem dados
    error: query.error,
    refetch,
    isRefetching: query.isRefetching,
  };
}

// Hook para mutations (criar/editar/deletar)
export function useFutureTransactionMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    // Invalidar apenas queries de futureTransactions, mas manter o cache
    queryClient.invalidateQueries({ 
      queryKey: ['futureTransactions'],
      refetchType: 'active' // Só refetch queries ativas
    });
  };

  return {
    invalidateAll,
  };
}
