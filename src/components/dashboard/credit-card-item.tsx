"use client";

import { useEffect, useState } from "react";
import { CreditCard as CreditCardIcon, Pencil, Trash2, ArrowRight, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { CreditCard } from "@/hooks/use-credit-cards";
import { useLanguage } from "@/contexts/language-context";

interface CreditCardItemProps {
  card: CreditCard;
  onEdit: (card: CreditCard) => void;
  onDelete: (card: CreditCard) => void;
  onReactivate?: (card: CreditCard) => void;
  formatCurrency: (value: number) => string;
}

export function CreditCardItem({ card, onEdit, onDelete, onReactivate, formatCurrency }: CreditCardItemProps) {
  const { t } = useLanguage();
  const { profile } = useUser();
  const [limiteUsado, setLimiteUsado] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLimiteUsado();

    // Escutar eventos de atualização
    const handleUpdate = () => {
      fetchLimiteUsado();
    };

    window.addEventListener('creditCardsChanged', handleUpdate);
    window.addEventListener('futureTransactionsChanged', handleUpdate);

    return () => {
      window.removeEventListener('creditCardsChanged', handleUpdate);
      window.removeEventListener('futureTransactionsChanged', handleUpdate);
    };
  }, [card.id, profile]);

  const fetchLimiteUsado = async () => {
    if (!profile) return;

    try {
      const supabase = createClient();
      
      // Buscar todas as parcelas pendentes deste cartão
      const { data, error } = await supabase
        .from('lancamentos_futuros')
        .select('valor')
        .eq('usuario_id', profile.id)
        .eq('cartao_id', card.id)
        .eq('status', 'pendente');

      if (error) throw error;

      const total = data?.reduce((sum, item) => sum + Number(item.valor), 0) || 0;
      setLimiteUsado(total);
    } catch (error) {
      setLimiteUsado(0);
    } finally {
      setLoading(false);
    }
  };

  const limiteDisponivel = card.limite_total - limiteUsado;
  const percentualUsado = card.limite_total > 0 ? (limiteUsado / card.limite_total) * 100 : 0;

  return (
    <div className={cn(
      "bg-[#111827] border rounded-xl overflow-hidden hover:border-white/10 transition-all group",
      card.ativo ? "border-white/5" : "border-red-500/30 opacity-75"
    )}>
      {/* Card Visual */}
      <div
        className="h-48 p-6 relative overflow-hidden"
        style={{
          background: card.ativo 
            ? `linear-gradient(135deg, ${card.cor_cartao} 0%, ${card.cor_cartao}dd 100%)`
            : `linear-gradient(135deg, #4B5563 0%, #374151 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="relative h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 text-xs font-medium mb-1">{card.bandeira}</p>
              <p className="text-white text-lg font-bold">{card.nome}</p>
              {!card.ativo && (
                <span className="inline-block mt-2 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400 font-semibold">
                  INATIVO
                </span>
              )}
            </div>
            <CreditCardIcon className="w-8 h-8 text-white/40" />
          </div>
          <div>
            {card.ultimos_digitos && (
              <p className="text-white text-sm font-mono">
                •••• •••• •••• {card.ultimos_digitos}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-6 space-y-4">
        {/* Limite */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">{t('cards.limitUsed')}</span>
            <span className="text-xs text-zinc-400">
              {loading ? '...' : `${percentualUsado.toFixed(1)}%`}
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
              style={{ width: `${percentualUsado}%` }}
            />
          </div>
        </div>

        {/* Valores */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-zinc-400 mb-1">{t('cards.used')}</p>
            <p className="text-sm font-semibold text-red-400">
              {loading ? '...' : formatCurrency(limiteUsado)}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">{t('cards.available')}</p>
            <p className="text-sm font-semibold text-green-400">
              {loading ? '...' : formatCurrency(limiteDisponivel)}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">{t('cards.total')}</p>
            <p className="text-sm font-semibold text-white">
              {formatCurrency(card.limite_total)}
            </p>
          </div>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
          <div>
            <p className="text-xs text-zinc-400 mb-1">📅 {t('cards.closingDate')}</p>
            <p className="text-sm text-white font-medium">{t('cards.everyDay')} {card.dia_fechamento}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">📅 {t('cards.dueDate')}</p>
            <p className="text-sm text-white font-medium">{t('cards.everyDay')} {card.dia_vencimento}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          {card.ativo ? (
            <>
              <Link
                href={`/dashboard/cartoes/${card.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                {t('cards.invoiceDetails')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => onEdit(card)}
                className="p-2 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-colors"
                title={t('cards.editCard')}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(card)}
                className="p-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                title="Excluir ou Inativar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onReactivate?.(card)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Reativar Cartão
              </button>
              <button
                onClick={() => onDelete(card)}
                className="p-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
