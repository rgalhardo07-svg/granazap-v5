"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";

interface CancelPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: any;
}

export function CancelPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  transaction
}: CancelPaymentModalProps) {
  const { t } = useLanguage();
  const { getCurrencySymbol } = useCurrency();
  const [canceling, setCanceling] = useState(false);

  if (!transaction) return null;

  const isIncome = transaction.tipo === 'entrada';

  const handleCancel = async () => {
    setCanceling(true);
    try {
      const supabase = createClient();

      // 1. Excluir a transação da tabela transacoes
      if (transaction.transacao_id) {
        const { error: deleteError } = await supabase
          .from('transacoes')
          .delete()
          .eq('id', transaction.transacao_id);

        if (deleteError) throw deleteError;
      }

      // 2. Atualizar o lançamento futuro para status pendente
      const { error: updateError } = await supabase
        .from('lancamentos_futuros')
        .update({
          status: 'pendente',
          data_efetivacao: null,
          transacao_id: null,
        })
        .eq('id', transaction.id);

      if (updateError) throw updateError;

      // Atualizar listas através do callback
      onSuccess();
      onClose();
    } catch (error) {
      alert(t('validation.errorCancelingPayment'));
    } finally {
      setCanceling(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('future.cancelPayment')}
      className="max-w-md"
    >
      <div className="space-y-6">
        {/* Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-500">
                Atenção! Esta ação irá:
              </p>
              <ul className="text-xs text-yellow-500/80 mt-2 space-y-1 list-disc list-inside">
                <li>Remover a transação da tabela de transações</li>
                <li>Voltar o lançamento para status "Pendente"</li>
                <li>Permitir que você efetive novamente no futuro</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className={cn(
          "border rounded-lg p-4",
          isIncome 
            ? "bg-[#22C55E]/10 border-[#22C55E]/30" 
            : "bg-red-500/10 border-red-500/30"
        )}>
          <div className="flex items-start gap-3">
            <XCircle className={cn(
              "w-5 h-5 flex-shrink-0 mt-0.5",
              isIncome ? "text-[#22C55E]" : "text-red-500"
            )} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className={cn(
                  "text-sm font-medium",
                  isIncome ? "text-[#22C55E]" : "text-red-500"
                )}>
                  {transaction.descricao}
                </p>
                {transaction.tipo_conta === 'pj' ? (
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/30 font-medium">
                    💼 PJ
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/30 font-medium">
                    👤 Pessoal
                  </span>
                )}
              </div>
              <p className={cn(
                "text-xs",
                isIncome ? "text-[#22C55E]/80" : "text-red-500/80"
              )}>
                Valor: {getCurrencySymbol()} {Number(transaction.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                <br />
                Efetivado em: {transaction.data_efetivacao ? new Date(transaction.data_efetivacao).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
          <Button
            onClick={onClose}
            disabled={canceling}
            className="px-6 bg-transparent border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
          >
            Voltar
          </Button>
          <Button
            onClick={handleCancel}
            disabled={canceling}
            className="px-6 bg-yellow-500 hover:bg-yellow-600 text-white font-medium"
          >
            {canceling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('future.cancelPayment')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
