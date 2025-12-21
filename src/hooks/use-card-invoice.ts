"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./use-user";

export interface InvoiceItem {
  id: number;
  descricao: string;
  valor: number;
  data_prevista: string;
  categoria_id: number;
  status: 'pendente' | 'pago' | 'cancelado';
  data_efetivacao?: string | null;
  parcela_info: {
    numero: number;
    total: number;
    valor_original: number;
  } | null;
}

export interface InvoiceSummary {
  total: number;
  items: InvoiceItem[];
  limite_usado: number;
  limite_disponivel: number;
  isPaid: boolean;
  totalPaid: number;
  dataPagamento: string | null;
  pendingCount: number;
  paidCount: number;
}

async function fetchCardInvoice(
  userId: number,
  cardId: string,
  month: string // formato: YYYY-MM
): Promise<InvoiceSummary> {
  const supabase = createClient();

  // Buscar informações do cartão
  const { data: card, error: cardError } = await supabase
    .from('cartoes_credito')
    .select('limite_total')
    .eq('id', cardId)
    .single();

  if (cardError) throw cardError;

  // Buscar lançamentos futuros do mês (pendentes E pagos para histórico)
  // Adicionar timestamp para evitar cache
  const { data: items, error: itemsError } = await supabase
    .from('lancamentos_futuros')
    .select('*')
    .eq('usuario_id', userId)
    .eq('cartao_id', cardId)
    .in('status', ['pendente', 'pago'])
    .eq('mes_previsto', month)
    .order('data_prevista', { ascending: true });

  if (itemsError) throw itemsError;

  // Total apenas dos pendentes (para o valor da fatura)
  const total = items?.filter(item => item.status === 'pendente')
    .reduce((sum, item) => sum + Number(item.valor), 0) || 0;

  // Buscar total usado (todas as parcelas pendentes)
  const { data: allPending, error: pendingError } = await supabase
    .from('lancamentos_futuros')
    .select('valor')
    .eq('usuario_id', userId)
    .eq('cartao_id', cardId)
    .eq('status', 'pendente');

  if (pendingError) throw pendingError;

  const limite_usado = allPending?.reduce((sum, item) => sum + Number(item.valor), 0) || 0;
  const limite_disponivel = Number(card.limite_total) - limite_usado;

  // Verificar se a fatura foi paga
  const paidItems = items?.filter(item => item.status === 'pago') || [];
  const isPaid = paidItems.length > 0 && items?.every(item => item.status === 'pago');
  const totalPaid = paidItems.reduce((sum, item) => sum + Number(item.valor), 0);
  const dataPagamento = paidItems[0]?.data_efetivacao || null;

  return {
    total,
    items: items || [],
    limite_usado,
    limite_disponivel,
    isPaid,
    totalPaid,
    dataPagamento,
    pendingCount: items?.filter(item => item.status === 'pendente').length || 0,
    paidCount: paidItems.length,
  };
}

export function useCardInvoice(cardId: string, month: string) {
  const { profile } = useUser();
  const queryClient = useQueryClient();

  const queryKey = ['card-invoice', profile?.id, cardId, month];

  const query = useQuery({
    queryKey,
    queryFn: () => {
      if (!profile) throw new Error('User not authenticated');
      return fetchCardInvoice(profile.id, cardId, month);
    },
    enabled: !!profile && !!cardId && !!month,
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 0, // Não manter cache
    refetchOnMount: 'always', // Sempre refetch ao montar
    refetchOnWindowFocus: true, // Refetch ao focar na janela
  });

  // Escutar eventos de atualização
  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['card-invoice'] });
      queryClient.refetchQueries({ queryKey: ['card-invoice'] });
    };

    window.addEventListener('creditCardsChanged', handleUpdate);
    window.addEventListener('futureTransactionsChanged', handleUpdate);
    
    return () => {
      window.removeEventListener('creditCardsChanged', handleUpdate);
      window.removeEventListener('futureTransactionsChanged', handleUpdate);
    };
  }, [queryClient]);

  return {
    invoice: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
