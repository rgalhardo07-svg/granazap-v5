"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, Trash2, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import type { CreditCard } from "@/hooks/use-credit-cards";

interface DeleteCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  card: CreditCard | null;
}

export function DeleteCardModal({ isOpen, onClose, onSuccess, card }: DeleteCardModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLinkedData, setHasLinkedData] = useState(false);
  const [linkedDataInfo, setLinkedDataInfo] = useState({ transactions: 0, futurePayments: 0 });
  const [checkingData, setCheckingData] = useState(false);

  const checkLinkedData = async () => {
    if (!card) return;
    
    setCheckingData(true);
    try {
      const supabase = createClient();

      // Verificar transações
      const { count: transactionsCount } = await supabase
        .from('transacoes')
        .select('*', { count: 'exact', head: true })
        .eq('cartao_id', card.id);

      // Verificar lançamentos futuros
      const { count: futurePaymentsCount } = await supabase
        .from('lancamentos_futuros')
        .select('*', { count: 'exact', head: true })
        .eq('cartao_id', card.id);

      const totalLinked = (transactionsCount || 0) + (futurePaymentsCount || 0);
      setHasLinkedData(totalLinked > 0);
      setLinkedDataInfo({
        transactions: transactionsCount || 0,
        futurePayments: futurePaymentsCount || 0
      });
    } catch (err) {
      console.error('Error checking linked data:', err);
    } finally {
      setCheckingData(false);
    }
  };

  // Verificar dados vinculados ao abrir modal
  useEffect(() => {
    if (isOpen && card) {
      checkLinkedData();
    }
  }, [isOpen, card]);

  if (!isOpen || !card) return null;

  const handleDeactivate = async () => {
    if (!card) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('cartoes_credito')
        .update({ ativo: false })
        .eq('id', card.id);

      if (updateError) throw updateError;

      // Disparar evento para atualizar lista
      window.dispatchEvent(new Event('creditCardsChanged'));
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao inativar cartão');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!card || hasLinkedData) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from('cartoes_credito')
        .delete()
        .eq('id', card.id);

      if (deleteError) throw deleteError;

      // Disparar evento para atualizar lista
      window.dispatchEvent(new Event('creditCardsChanged'));
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir cartão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A0F1C] border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              {hasLinkedData ? 'Inativar Cartão' : 'Excluir ou Inativar Cartão'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Card Info */}
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-zinc-400 mb-1">Cartão</p>
            <p className="text-white font-semibold">{card.nome}</p>
            {card.ultimos_digitos && (
              <p className="text-sm text-zinc-400 font-mono mt-1">
                •••• {card.ultimos_digitos}
              </p>
            )}
          </div>

          {/* Linked Data Warning */}
          {checkingData ? (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-400">Verificando dados vinculados...</p>
            </div>
          ) : hasLinkedData ? (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-500 mb-2">
                    Este cartão possui dados vinculados
                  </p>
                  <ul className="text-sm text-yellow-400/80 space-y-1">
                    {linkedDataInfo.transactions > 0 && (
                      <li>• {linkedDataInfo.transactions} transação(ões) registrada(s)</li>
                    )}
                    {linkedDataInfo.futurePayments > 0 && (
                      <li>• {linkedDataInfo.futurePayments} lançamento(s) futuro(s)</li>
                    )}
                  </ul>
                  <p className="text-sm text-yellow-400/80 mt-3">
                    <strong>Não é possível excluir</strong> este cartão. Você pode apenas inativá-lo.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400">
                ✓ Este cartão não possui dados vinculados e pode ser excluído com segurança.
              </p>
            </div>
          )}

          {/* Options Explanation */}
          <div className="space-y-3">
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-start gap-2">
                <EyeOff className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white mb-1">Inativar</p>
                  <p className="text-xs text-zinc-400">
                    O cartão ficará oculto mas seus dados históricos serão preservados. Você pode reativá-lo depois.
                  </p>
                </div>
              </div>
            </div>

            {!hasLinkedData && (
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start gap-2">
                  <Trash2 className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">Excluir</p>
                    <p className="text-xs text-zinc-400">
                      Remove permanentemente o cartão. Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleDeactivate}
            disabled={loading || checkingData}
            className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Inativando...
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                Inativar
              </>
            )}
          </button>

          {!hasLinkedData && (
            <button
              onClick={handleDelete}
              disabled={loading || checkingData}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
