"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./use-user";
import { useAccountFilter } from "./use-account-filter";

export interface FutureTransaction {
  id: number;
  created_at: string;
  usuario_id: number;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  categoria_id: number;
  data_prevista: string;
  data_efetivacao: string | null;
  recorrente: boolean;
  periodicidade: string | null;
  status: 'pendente' | 'pago' | 'cancelado';
  pagador_recebedor: string | null;
  ultima_atualizacao: string;
  mes_previsto: string;
  parcelamento: string | boolean; // TEXT no banco ('true'/'false')
  numero_parcelas: number | null;
  parcela_atual: number | null;
  transacao_id: number | null;
  data_final: string | null;
  confirmed_dates: any;
  dependente_id: number | null;
  tipo_conta: 'pessoal' | 'pj';
  conta_id: string | null;
  cartao_id: string | null;
  parcela_info: {
    numero: number;
    total: number;
    valor_original: number;
  } | null;
  categoria?: {
    descricao: string;
    icon_key: string | null;
  };
}

export function useFutureTransactions(tipo?: 'entrada' | 'saida') {
  const { profile } = useUser();
  const { filter: accountFilter } = useAccountFilter();
  const [transactions, setTransactions] = useState<FutureTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!profile) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();

      let query = supabase
        .from('lancamentos_futuros')
        .select(`
          *,
          categoria:categoria_trasacoes(descricao, icon_key)
        `)
        .eq('usuario_id', profile.id)
        .order('data_prevista', { ascending: true });

      // Filtrar por tipo se especificado
      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      // Filtrar por tipo de conta (pessoal/PJ)
      query = query.eq('tipo_conta', accountFilter);

      const { data, error } = await query;

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      // Erro ao buscar lançamentos futuros
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Listener para mudanças no filtro de conta
    const handleAccountFilterChange = () => {
      fetchTransactions();
    };

    // Listener para mudanças nos lançamentos futuros
    const handleFutureTransactionsChange = () => {
      fetchTransactions();
    };

    window.addEventListener('accountFilterChange', handleAccountFilterChange);
    window.addEventListener('futureTransactionsChanged', handleFutureTransactionsChange);

    return () => {
      window.removeEventListener('accountFilterChange', handleAccountFilterChange);
      window.removeEventListener('futureTransactionsChanged', handleFutureTransactionsChange);
    };
  }, [profile, accountFilter, tipo]);

  return { transactions, loading, refetch: fetchTransactions };
}
