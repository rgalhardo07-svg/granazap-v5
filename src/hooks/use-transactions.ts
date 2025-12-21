"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./use-user";
import { useAccountFilter } from "./use-account-filter";

interface Transaction {
  id: number;
  data: string;
  valor: number;
  descricao: string;
  tipo: 'entrada' | 'saida';
  categoria_id: number;
  tipo_conta: 'pessoal' | 'pj';
  mes: string;
  recebedor?: string;
  pagador?: string;
  categoria?: {
    descricao: string;
    icon_key?: string;
  };
}

interface TransactionStats {
  balance: number;
  income: number;
  incomeCount: number;
  expenses: number;
  expensesCount: number;
  savingsRate: number;
}

export function useTransactions(period: 'day' | 'week' | 'month' | 'year' | 'custom' = 'month', customRange?: { start: string; end: string } | null) {
  const { profile } = useUser();
  const { filter } = useAccountFilter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    balance: 0,
    income: 0,
    incomeCount: 0,
    expenses: 0,
    expensesCount: 0,
    savingsRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        
        // Calcular período
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();
        
        if (period === 'custom' && customRange) {
          // Usar datas customizadas
          startDate = new Date(customRange.start);
          endDate = new Date(customRange.end);
        } else {
          switch (period) {
            case 'day':
              // Apenas hoje
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);
              break;
            case 'week':
              // Últimos 7 dias
              startDate.setDate(now.getDate() - 7);
              startDate.setHours(0, 0, 0, 0);
              break;
            case 'month':
              // Mês atual
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              break;
            case 'year':
              // Ano atual
              startDate = new Date(now.getFullYear(), 0, 1);
              break;
          }
        }

        // Formatar datas para comparação (YYYY-MM-DD)
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = (period === 'day' || period === 'custom') ? endDate.toISOString().split('T')[0] : null;

        // Buscar transações com filtro
        let query = supabase
          .from('transacoes')
          .select(`
            *,
            categoria:categoria_trasacoes(descricao, icon_key)
          `)
          .eq('usuario_id', profile.id)
          .eq('tipo_conta', filter)
          .gte('data', startDateStr);

        // Para "dia" ou "custom", adicionar filtro de data máxima
        if ((period === 'day' || period === 'custom') && endDateStr) {
          query = query.lte('data', endDateStr);
        }

        const { data, error } = await query.order('data', { ascending: false });

        if (error) {
          // Erro ao buscar transações
          return;
        }

        setTransactions(data || []);

        // Calcular estatísticas
        const income = data?.filter((t: any) => t.tipo === 'entrada').reduce((sum: number, t: any) => sum + Number(t.valor), 0) || 0;
        const expenses = data?.filter((t: any) => t.tipo === 'saida').reduce((sum: number, t: any) => sum + Number(t.valor), 0) || 0;
        const incomeCount = data?.filter((t: any) => t.tipo === 'entrada').length || 0;
        const expensesCount = data?.filter((t: any) => t.tipo === 'saida').length || 0;
        const balance = income - expenses;
        const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

        setStats({
          balance,
          income,
          incomeCount,
          expenses,
          expensesCount,
          savingsRate,
        });

      } catch (error) {
        // Erro ao buscar transações
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    // Listener para mudanças no filtro de conta
    const handleFilterChange = () => {
      fetchTransactions();
    };

    // Listener para mudanças no filtro de período
    const handlePeriodChange = () => {
      fetchTransactions();
    };

    window.addEventListener('accountFilterChange', handleFilterChange);
    window.addEventListener('periodFilterChange', handlePeriodChange);

    return () => {
      window.removeEventListener('accountFilterChange', handleFilterChange);
      window.removeEventListener('periodFilterChange', handlePeriodChange);
    };
  }, [profile, filter, period, customRange]);

  const refresh = () => {
    window.dispatchEvent(new CustomEvent('accountFilterChange', { detail: filter }));
  };

  return {
    transactions,
    stats,
    loading,
    refresh,
  };
}
