"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./use-user";
import { useAccountFilter } from "./use-account-filter";
import { useUserFilter } from "./use-user-filter";

interface Transaction {
  id: number;
  data: string;
  valor: number;
  descricao: string;
  tipo: 'entrada' | 'saida';
  categoria_id: number;
  tipo_conta: 'pessoal' | 'pj';
  mes: string;
  conta_id?: string;
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

async function fetchTransactions(
  userId: number,
  accountFilter: 'pessoal' | 'pj',
  period: 'day' | 'week' | 'month' | 'year' | 'custom',
  customRange?: { start: string; end: string } | null,
  userFilter?: 'todos' | 'principal' | number | null
): Promise<{ transactions: Transaction[]; stats: TransactionStats }> {
  const supabase = createClient();
  
  // Calcular período
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();
  
  if (period === 'custom' && customRange) {
    startDate = new Date(customRange.start);
    endDate = new Date(customRange.end);
  } else {
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        // Início da semana (domingo)
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        // Fim da semana (sábado)
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
    }
  }

  // Formatar datas localmente sem timezone
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const startDateStr = formatLocalDate(startDate);
  const endDateStr = formatLocalDate(endDate);

  console.log('🔍 Buscando transações:', { userId, accountFilter, startDateStr, endDateStr, userFilter });

  let query = supabase
    .from('transacoes')
    .select(`
      *,
      categoria:categoria_trasacoes!inner(descricao, icon_key)
    `)
    .eq('usuario_id', userId)
    .eq('tipo_conta', accountFilter)
    .gte('data', `${startDateStr}T00:00:00`)
    .lte('data', `${endDateStr}T23:59:59`)
    .or('is_transferencia.is.null,is_transferencia.eq.false'); // Excluir transferências

  // Aplicar filtro de usuário se necessário
  if (userFilter === 'principal') {
    query = query.is('dependente_id', null);
  } else if (typeof userFilter === 'number' && userFilter > 0) {
    query = query.eq('dependente_id', userFilter);
  }
  // Se userFilter === 'todos' ou null, não filtra

  const { data, error } = await query
    .order('data', { ascending: false })
    .limit(1000); // Limitar a 1000 transações

  console.log('📊 Resultado transações:', { total: data?.length || 0, error });

  if (error) throw error;

  const transactions = data || [];

  // Calcular estatísticas
  const income = transactions
    .filter(t => t.tipo === 'entrada')
    .reduce((sum, t) => sum + Number(t.valor), 0);
  
  const expenses = transactions
    .filter(t => t.tipo === 'saida')
    .reduce((sum, t) => sum + Number(t.valor), 0);

  const stats: TransactionStats = {
    balance: income - expenses,
    income,
    incomeCount: transactions.filter(t => t.tipo === 'entrada').length,
    expenses,
    expensesCount: transactions.filter(t => t.tipo === 'saida').length,
    savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
  };

  return { transactions, stats };
}

export function useTransactionsQuery(
  period: 'day' | 'week' | 'month' | 'year' | 'custom' = 'month',
  customRange?: { start: string; end: string } | null
) {
  const { profile } = useUser();
  const { filter: accountFilter } = useAccountFilter();
  const { filter: userFilter } = useUserFilter();
  const queryClient = useQueryClient();

  // Query key incluindo userFilter
  const queryKey = ['transactions', profile?.id, accountFilter, period, userFilter];

  const query = useQuery({
    queryKey,
    queryFn: () => {
      if (!profile) throw new Error('User not authenticated');
      return fetchTransactions(profile.id, accountFilter, period, customRange, userFilter);
    },
    enabled: !!profile,
    placeholderData: (previousData) => previousData, // Mantém dados antigos enquanto busca novos
    initialData: () => {
      // Tentar pegar dados do cache
      return queryClient.getQueryData(queryKey);
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  return {
    transactions: query.data?.transactions || [],
    stats: query.data?.stats || {
      balance: 0,
      income: 0,
      incomeCount: 0,
      expenses: 0,
      expensesCount: 0,
      savingsRate: 0,
    },
    loading: query.isLoading && !query.data, // Só loading se não tem dados
    error: query.error,
    refetch: invalidateAll,
    isRefetching: query.isRefetching,
  };
}
