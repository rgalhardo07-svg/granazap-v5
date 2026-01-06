"use client";

import { useState, useRef } from "react";
import { X, AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";

interface ReversePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cardName: string;
  invoiceMonth: string;
  totalPaid: number;
  dataPagamento: string;
  paidCount: number;
  cardId: string;
  contaId: string;
}

export function ReversePaymentModal({
  isOpen,
  onClose,
  onSuccess,
  cardName,
  invoiceMonth,
  totalPaid,
  dataPagamento,
  paidCount,
  cardId,
  contaId,
}: ReversePaymentModalProps) {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { profile } = useUser();
  const [step, setStep] = useState<'confirm' | 'processing' | 'success'>('confirm');
  const [loading, setLoading] = useState(false);
  const isProcessingRef = useRef(false);

  const handleReverse = async () => {
    if (!profile || loading || isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    setLoading(true);
    setStep('processing');

    try {
      const supabase = createClient();

      // 1. Buscar todos os lançamentos pagos do mês
      const { data: lancamentos, error: lancamentosError } = await supabase
        .from('lancamentos_futuros')
        .select('*')
        .eq('cartao_id', cardId)
        .eq('status', 'pago')
        .eq('mes_previsto', invoiceMonth);

      if (lancamentosError) {
        throw new Error(`Erro ao buscar lançamentos: ${lancamentosError.message}`);
      }

      if (!lancamentos || lancamentos.length === 0) {
        throw new Error('Nenhum lançamento pago encontrado para reverter.');
      }

      // 2. Buscar a transação de pagamento (buscar por descrição também para garantir)
      const descricaoPagamento = `Pagamento Fatura ${cardName}`;
      const { data: transacoes, error: transacaoError } = await supabase
        .from('transacoes')
        .select('*')
        .eq('cartao_id', cardId)
        .eq('conta_id', contaId)
        .eq('tipo', 'saida')
        .ilike('descricao', `${descricaoPagamento}%`)
        .order('created_at', { ascending: false });

      if (transacaoError) {
        throw new Error(`Erro ao buscar transação: ${transacaoError.message}`);
      }

      // Pegar a transação mais recente que corresponde ao mês
      const transacao = transacoes?.find(t => 
        t.data === dataPagamento || 
        t.data.startsWith(invoiceMonth)
      ) || transacoes?.[0];

      // 3. Buscar a conta bancária
      const { data: conta, error: contaError } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('id', contaId)
        .single();

      if (contaError) {
        throw new Error(`Erro ao buscar conta: ${contaError.message}`);
      }

      // 4. Reverter status dos lançamentos para pendente

      const { error: updateError } = await supabase
        .from('lancamentos_futuros')
        .update({
          status: 'pendente',
          data_efetivacao: null,
        })
        .in('id', lancamentos.map(l => l.id));

      if (updateError) {
        throw new Error(`Erro ao reverter lançamentos: ${updateError.message}`);
      }

      // 5. Deletar a transação de pagamento
      // O trigger 'atualizar_saldo_conta' automaticamente estorna o saldo ao deletar
      if (transacao) {
        const { error: deleteError } = await supabase
          .from('transacoes')
          .delete()
          .eq('id', transacao.id);

        if (deleteError) {
          throw new Error(`Erro ao deletar transação: ${deleteError.message}`);
        }
      }

      // Aguardar um momento para garantir que o banco commitou
      await new Promise(resolve => setTimeout(resolve, 500));

      // Disparar eventos para atualizar as listas (múltiplas vezes para garantir)
      const dispatchEvents = () => {
        window.dispatchEvent(new CustomEvent('creditCardsChanged'));
        window.dispatchEvent(new CustomEvent('accountsChanged'));
        window.dispatchEvent(new CustomEvent('transactionsChanged'));
        window.dispatchEvent(new CustomEvent('futureTransactionsChanged'));
      };
      
      // Disparar imediatamente
      dispatchEvents();
      
      // Disparar novamente após 200ms para garantir
      setTimeout(dispatchEvents, 200);
      
      // Disparar mais uma vez após 500ms
      setTimeout(dispatchEvents, 500);

      setStep('success');
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro desconhecido ao reverter pagamento';
      alert(`Erro ao reverter pagamento: ${errorMessage}`);
      setStep('confirm');
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  const handleClose = () => {
    if (step === 'success') {
      // Disparar eventos mais uma vez ao fechar
      window.dispatchEvent(new CustomEvent('creditCardsChanged'));
      window.dispatchEvent(new CustomEvent('accountsChanged'));
      window.dispatchEvent(new CustomEvent('transactionsChanged'));
      window.dispatchEvent(new CustomEvent('futureTransactionsChanged'));
      
      onSuccess();
    }
    setStep('confirm');
    setLoading(false);
    isProcessingRef.current = false;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0F1419] border border-white/10 rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Confirmação */}
        {step === 'confirm' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 sticky top-0 bg-[#0F1419] z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{t('future.reversePayment')}</h2>
                  <p className="text-xs text-zinc-500">Ação irreversível - Leia com atenção</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Informações do Pagamento */}
              <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-white mb-2">Detalhes do Pagamento</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Cartão:</span>
                    <span className="text-white font-medium">{cardName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Fatura:</span>
                    <span className="text-white font-medium">
                      {new Date(invoiceMonth + '-01').toLocaleDateString('pt-BR', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Pago em:</span>
                    <span className="text-white font-medium">
                      {new Date(dataPagamento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Despesas:</span>
                    <span className="text-white font-medium">{paidCount}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-white/5">
                    <span className="text-zinc-400">Valor Total:</span>
                    <span className="text-base font-bold text-red-400">{formatCurrency(totalPaid)}</span>
                  </div>
                </div>
              </div>

              {/* Aviso de Consequências */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-red-400 mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  O que vai acontecer:
                </h3>
                <ul className="space-y-1.5 text-xs text-red-300">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>
                      <strong className="text-red-200">{formatCurrency(totalPaid)}</strong> será{' '}
                      <strong className="text-red-200">devolvido</strong> para sua conta bancária
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>
                      Todas as <strong className="text-red-200">{paidCount} despesa(s)</strong> voltarão ao status{' '}
                      <strong className="text-red-200">PENDENTE</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>
                      A transação de pagamento será <strong className="text-red-200">removida</strong> do histórico
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>
                      O limite do cartão será <strong className="text-red-200">reduzido</strong> novamente
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>
                      A fatura voltará a aparecer como <strong className="text-red-200">NÃO PAGA</strong>
                    </span>
                  </li>
                </ul>
              </div>

              {/* Aviso Final */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5">
                <p className="text-xs text-yellow-300 leading-relaxed">
                  ⚠️ <strong>Atenção:</strong> Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-4 border-t border-white/5 sticky bottom-0 bg-[#0F1419]">
              <button
                onClick={handleClose}
                className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium text-sm"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleReverse}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  'Processando...'
                ) : (
                  <>
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Reverter
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Processando */}
        {step === 'processing' && (
          <div className="p-8">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <div className="text-center">
                <h3 className="text-base font-bold text-white mb-1">{t('future.reversePayment')}...</h3>
                <p className="text-xs text-zinc-400">Aguarde enquanto processamos</p>
              </div>
            </div>
          </div>
        )}

        {/* Sucesso */}
        {step === 'success' && (
          <>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white mb-1">{t('future.reversePayment')}!</h3>
                  <p className="text-xs text-zinc-400 mb-3">
                    {t('success.reversalCompleted')}
                  </p>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-left">
                    <ul className="space-y-1.5 text-xs text-green-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span>{formatCurrency(totalPaid)} devolvido para sua conta</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span>{paidCount} despesa(s) voltaram ao status pendente</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span>Transação de pagamento removida</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span>Limite do cartão atualizado</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-white/5">
              <button
                onClick={handleClose}
                className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium text-sm"
              >
                {t('common.close')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
