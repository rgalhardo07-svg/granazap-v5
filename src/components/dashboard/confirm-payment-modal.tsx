"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";

interface ConfirmPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: any;
}

export function ConfirmPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  transaction
}: ConfirmPaymentModalProps) {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const [dataEfetivacao, setDataEfetivacao] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [confirming, setConfirming] = useState(false);

  if (!transaction) return null;

  const isIncome = transaction.tipo === 'entrada';

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const supabase = createClient();

      // 1. Criar transação efetivada
      const { data: newTransaction, error: transactionError } = await supabase
        .from('transacoes')
        .insert([{
          usuario_id: transaction.usuario_id,
          tipo: transaction.tipo,
          valor: transaction.valor,
          descricao: transaction.descricao,
          categoria_id: transaction.categoria_id,
          data: dataEfetivacao,
          mes: format(new Date(dataEfetivacao), 'MMMM'),
          pagador: transaction.tipo === 'saida' ? transaction.pagador_recebedor : null,
          recebedor: transaction.tipo === 'entrada' ? transaction.pagador_recebedor : null,
          tipo_conta: transaction.tipo_conta,
          lancamento_futuro_id: transaction.id,
          conta_id: transaction.conta_id || null,
        }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // 2. Atualizar lançamento futuro
      const { error: updateError } = await supabase
        .from('lancamentos_futuros')
        .update({
          status: 'pago',
          data_efetivacao: dataEfetivacao,
          transacao_id: newTransaction.id,
        })
        .eq('id', transaction.id);

      if (updateError) throw updateError;

      // 3. Atualizar listas através do callback
      onSuccess();
      onClose();
    } catch (error) {
      alert(t('future.confirmError'));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('future.confirmPayment')}
      className="max-w-md"
    >
      <div className="space-y-6">
        {/* Info */}
        <div className={cn(
          "border rounded-lg p-4",
          isIncome 
            ? "bg-[#22C55E]/10 border-[#22C55E]/30" 
            : "bg-red-500/10 border-red-500/30"
        )}>
          <div className="flex items-start gap-3">
            <CheckCircle2 className={cn(
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
                    👤 {t('future.personal')}
                  </span>
                )}
              </div>
              <p className={cn(
                "text-xs",
                isIncome ? "text-[#22C55E]/80" : "text-red-500/80"
              )}>
                {t('future.value')}: {formatCurrency(Number(transaction.valor))}
                <br />
                {t('future.tableDueDate')}: {format(new Date(transaction.data_prevista), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
        </div>

        <p className="text-zinc-400 text-sm">
          {t('future.confirmMessage')}
        </p>

        {/* Data de Efetivação */}
        <div>
          <label className="text-sm font-medium text-white flex items-center gap-2">
            📅 {t('future.effectiveDate')} <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={dataEfetivacao}
            onChange={(e) => setDataEfetivacao(e.target.value)}
            className="mt-1 w-full h-10 px-3 bg-[#0A0F1C] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#22C55E] [color-scheme:dark]"
            style={{ colorScheme: 'dark' }}
          />
          <p className="text-xs text-zinc-500 mt-1">
            {t('future.effectiveDateDesc')}
          </p>
        </div>

        {/* Badges */}
        {(transaction.recorrente || String(transaction.parcelamento) === 'true') && (
          <div className="flex flex-wrap gap-2">
            {transaction.recorrente && (
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/30">
                🔄 Recorrente ({transaction.periodicidade})
              </span>
            )}
            {String(transaction.parcelamento) === 'true' && (
              <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-full border border-purple-500/30">
                💳 Parcela {transaction.parcela_atual}/{transaction.numero_parcelas}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
          <Button
            onClick={onClose}
            disabled={confirming}
            className="px-6 bg-transparent border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={confirming || !dataEfetivacao}
            className={cn(
              "px-6 text-white font-medium",
              isIncome ? "bg-[#22C55E] hover:bg-[#16A34A]" : "bg-red-500 hover:bg-red-600"
            )}
          >
            {confirming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('future.confirmPayment')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
