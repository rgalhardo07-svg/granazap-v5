"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./use-user";
import { useAccountFilter } from "./use-account-filter";

export interface Goal {
  id: number;
  nome: string;
  tipo_meta: 'categoria' | 'geral' | 'geral_entrada' | 'geral_saida';
  valor_limite: number;
  categoria_id?: number;
  data_inicio: string;
  data_fim: string;
  tipo_conta?: 'pessoal' | 'pj';
  categoria?: {
    descricao: string;
    icon_key?: string;
    tipo?: 'entrada' | 'saida';
  };
  // Campos calculados
  currentAmount: number;
  progress: number;
  status: 'active' | 'completed' | 'failed';
  isIncomeGoal: boolean; // Novo campo para facilitar a UI
}

export function useGoals() {
  const { profile } = useUser();
  const { filter: accountFilter } = useAccountFilter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchGoals = async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        // 1. Buscar metas com informações da categoria
        const { data: metasData, error: metasError } = await supabase
          .from('metas_orcamento')
          .select(`
            *,
            categoria:categoria_trasacoes(descricao, icon_key, tipo)
          `)
          .eq('usuario_id', profile.id)
          .eq('tipo_conta', accountFilter) // Agora a coluna existe!
          .order('created_at', { ascending: false });

        if (metasError) throw metasError;

        if (!metasData || metasData.length === 0) {
          setGoals([]);
          return;
        }

        // 2. Para cada meta, calcular o progresso
        const metasWithProgress = await Promise.all(metasData.map(async (meta) => {
          // Determinar se é meta de receita
          // Se tiver categoria, olha o tipo da categoria. Se for geral, olha o tipo_meta.
          // Fallback: se for 'geral' antigo, assume 'saida' (gasto).
          let isIncomeGoal = false;
          
          if (meta.categoria?.tipo === 'entrada') {
            isIncomeGoal = true;
          } else if (meta.tipo_meta === 'geral_entrada') {
            isIncomeGoal = true;
          }

          let query = supabase
            .from('transacoes')
            .select('valor')
            .eq('usuario_id', profile.id)
            .eq('tipo_conta', accountFilter) // CRÍTICO: Filtrar transações pela conta atual
            .gte('data', meta.data_inicio)
            .lte('data', meta.data_fim);

          // Filtros da query
          if (meta.categoria_id) {
            // Se tem categoria, filtra por ela (o tipo já vem da categoria)
            query = query.eq('categoria_id', meta.categoria_id);
          } else {
            // Meta Geral
            if (isIncomeGoal) {
              query = query.eq('tipo', 'entrada');
            } else {
              query = query.eq('tipo', 'saida');
            }
          }

          const { data: transacoes, error: transError } = await query;
          
          if (transError) {
            return { ...meta, currentAmount: 0, progress: 0, status: 'active', isIncomeGoal };
          }

          const currentAmount = transacoes?.reduce((sum, t) => sum + Number(t.valor), 0) || 0;
          const progress = (currentAmount / meta.valor_limite) * 100;
          
          // Status e Lógica de Sucesso
          let status: 'active' | 'completed' | 'failed' = 'active';
          
          // Verifica se o prazo já acabou para definir sucesso/fracasso final
          // Mas também podemos dar feedback imediato
          const isExpired = new Date(meta.data_fim) < new Date();

          if (isIncomeGoal) {
            // Meta de Receita: Sucesso é TER MAIS que o limite (alvo)
            if (currentAmount >= meta.valor_limite) {
              status = 'completed'; // Atingiu a meta!
            } else if (isExpired) {
              status = 'failed'; // Não atingiu a meta no prazo
            }
          } else {
            // Meta de Despesa: Sucesso é TER MENOS que o limite (teto)
            if (currentAmount > meta.valor_limite) {
              status = 'failed'; // Estourou o teto
            } else if (isExpired) {
              status = 'completed'; // Terminou o prazo dentro do orçamento!
            }
          }

          return {
            ...meta,
            currentAmount,
            progress,
            status,
            isIncomeGoal
          };
        }));

        setGoals(metasWithProgress as Goal[]);

      } catch (error) {
        // Erro ao buscar metas
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [profile, accountFilter]);

  return {
    goals,
    loading,
    refresh: () => { /* Implementar refresh se precisar */ }
  };
}
