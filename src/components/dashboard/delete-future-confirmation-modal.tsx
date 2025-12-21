"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FileText, Files, AlertTriangle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";

interface DeleteFutureConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: any;
}

export function DeleteFutureConfirmationModal({
  isOpen,
  onClose,
  onSuccess,
  transaction
}: DeleteFutureConfirmationModalProps) {
  const { t } = useLanguage();
  const [deleting, setDeleting] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'all'>('single');

  if (!transaction) return null;

  const isParcelado = String(transaction.parcelamento) === 'true' || !!transaction.parcela_info;
  const isRecorrente = transaction.recorrente;
  const isRelated = isParcelado || isRecorrente;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const supabase = createClient();

      if (deleteType === 'single') {
        // Excluir apenas este registro
        const { error } = await supabase
          .from('lancamentos_futuros')
          .delete()
          .eq('id', transaction.id);

        if (error) throw error;
      } else {
        // Excluir este e futuros relacionados
        if (isParcelado) {
          // Para parcelados: excluir esta parcela e as futuras
          if (transaction.parcela_info) {
            // Parcelamento de cartão de crédito (usa parcela_info)
            const parcelaAtual = transaction.parcela_info.numero;
            const { data: relatedTransactions, error: fetchError } = await supabase
              .from('lancamentos_futuros')
              .select('id')
              .eq('usuario_id', transaction.usuario_id)
              .eq('cartao_id', transaction.cartao_id)
              .not('parcela_info', 'is', null);

            if (fetchError) throw fetchError;

            // Filtrar parcelas >= atual
            const idsToDelete = relatedTransactions
              ?.filter((t: any) => t.parcela_info?.numero >= parcelaAtual)
              .map((t: any) => t.id) || [];

            if (idsToDelete.length > 0) {
              const { error } = await supabase
                .from('lancamentos_futuros')
                .delete()
                .in('id', idsToDelete);

              if (error) throw error;
            }
          } else {
            // Parcelamento normal de agendamento (usa parcela_atual)
            const { error } = await supabase
              .from('lancamentos_futuros')
              .delete()
              .eq('usuario_id', transaction.usuario_id)
              .eq('descricao', transaction.descricao)
              .eq('parcelamento', true)
              .gte('parcela_atual', transaction.parcela_atual);

            if (error) throw error;
          }
        } else if (isRecorrente) {
          // Para recorrentes: excluir este e futuros com mesma descrição e recorrência
          const { error } = await supabase
            .from('lancamentos_futuros')
            .delete()
            .eq('usuario_id', transaction.usuario_id)
            .eq('descricao', transaction.descricao)
            .eq('recorrente', true)
            .gte('data_prevista', transaction.data_prevista);

          if (error) throw error;
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      alert(t('future.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('future.deleteMessage')}
      className="max-w-lg"
    >
      <div className="space-y-6">
        {/* Info */}
        <p className="text-sm text-zinc-400">
          {t('common.cannotUndo')}
        </p>

        {/* Transaction Info */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-red-500">
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
              <p className="text-xs text-red-500/80">
                {isParcelado && transaction.parcela_info && `💳 ${t('future.installment')} (${transaction.parcela_info.numero}/${transaction.parcela_info.total})`}
                {isParcelado && !transaction.parcela_info && transaction.parcela_atual && `💳 ${t('future.installment')} (${transaction.parcela_atual}/${transaction.numero_parcelas})`}
                {isRecorrente && `🔄 ${t('future.recurring')} (${transaction.periodicidade})`}
              </p>
            </div>
          </div>
        </div>

        {isRelated && (
          <div>
            <p className="text-sm font-medium text-white mb-3">{t('common.delete')}</p>
            <div className="space-y-2">
              {/* Apenas esta transação */}
              <label className="flex items-center gap-3 p-3 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                <input
                  type="radio"
                  name="deleteType"
                  value="single"
                  checked={deleteType === 'single'}
                  onChange={(e) => setDeleteType(e.target.value as 'single' | 'all')}
                  className="w-4 h-4 text-red-500"
                />
                <span className="text-sm text-white">{t('future.editSingle')}</span>
              </label>

              {/* Esta e futuras transações */}
              <label className="flex items-center gap-3 p-3 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                <input
                  type="radio"
                  name="deleteType"
                  value="all"
                  checked={deleteType === 'all'}
                  onChange={(e) => setDeleteType(e.target.value as 'single' | 'all')}
                  className="w-4 h-4 text-red-500"
                />
                <span className="text-sm text-white">{t('future.editFuture')}</span>
              </label>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
          <Button
            onClick={onClose}
            disabled={deleting}
            className="px-6 bg-transparent border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
          >
            {t('common.cancel')}
          </Button>
          {isRelated && (
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="px-6 bg-red-500 hover:bg-red-600 text-white font-medium"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.delete')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
