"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./use-user";
import { useAccountFilter } from "./use-account-filter";

export interface CreditCard {
  id: string;
  usuario_id: string;
  nome: string;
  bandeira: string | null;
  ultimos_digitos: string | null;
  limite_total: number;
  dia_fechamento: number;
  dia_vencimento: number;
  tipo_conta: 'pessoal' | 'pj';
  cor_cartao: string;
  conta_vinculada_id: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

async function fetchCreditCards(
  accountFilter: 'pessoal' | 'pj',
  showInactive: boolean = false
): Promise<CreditCard[]> {
  const supabase = createClient();

  let query = supabase
    .from('cartoes_credito')
    .select('*')
    .eq('tipo_conta', accountFilter);

  // Se não mostrar inativos, filtrar apenas ativos
  if (!showInactive) {
    query = query.eq('ativo', true);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}

export function useCreditCards(showInactive: boolean = false) {
  const { user } = useUser();
  const { filter: accountFilter } = useAccountFilter();
  const queryClient = useQueryClient();

  const queryKey = ['credit-cards', accountFilter, showInactive];

  const query = useQuery({
    queryKey,
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return fetchCreditCards(accountFilter, showInactive);
    },
    enabled: !!user,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
  };

  // Listener para recarregar quando um cartão for criado/atualizado
  useEffect(() => {
    const handleCardsChanged = () => {
      invalidateAll();
    };

    window.addEventListener('creditCardsChanged', handleCardsChanged);

    return () => {
      window.removeEventListener('creditCardsChanged', handleCardsChanged);
    };
  }, [queryClient]);

  return {
    cards: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: invalidateAll,
    isRefetching: query.isRefetching,
  };
}
