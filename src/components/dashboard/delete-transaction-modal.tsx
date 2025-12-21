"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";

interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transaction: {
    descricao: string;
    valor: number;
    tipo: 'entrada' | 'saida';
    tipo_conta: 'pessoal' | 'pj';
  } | null;
  isDeleting: boolean;
}

export function DeleteTransactionModal({
  isOpen,
  onClose,
  onConfirm,
  transaction,
  isDeleting,
}: DeleteTransactionModalProps) {
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrency();
  
  if (!transaction) return null;

  const isPessoal = transaction.tipo_conta === 'pessoal';
  const isReceita = transaction.tipo === 'entrada';

  const locales = {
    pt: 'pt-BR',
    en: 'en-US',
    es: 'es-ES'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('modal.deleteTitle')}
      className="max-w-md"
    >
      <div className="space-y-6">
        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-white">
            {t('modal.deleteMessage')}
          </h3>
          <p className="text-sm text-zinc-400">
            {t('modal.deleteWarning')}
          </p>
        </div>

        {/* Transaction Details */}
        <div className="bg-[#0A0F1C] rounded-lg p-4 space-y-3 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t('form.description')}:</span>
            <span className="text-sm font-medium text-white">{transaction.descricao}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t('form.value')}:</span>
            <span className={cn(
              "text-sm font-semibold",
              isReceita ? "text-green-400" : "text-red-400"
            )}>
              {isReceita ? '+' : '-'} {formatCurrency(transaction.valor)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t('form.type')}:</span>
            <span className="text-sm font-medium text-white">
              {isReceita ? t('transactions.income') : t('transactions.expenses')}
            </span>
          </div>

          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{t('form.account')}:</span>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5",
                isPessoal
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              )}>
                <span>{isPessoal ? '👤' : '🏢'}</span>
                <span>{isPessoal ? t('sidebar.personal').toUpperCase() : t('sidebar.pj').toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Box */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
          <div className="flex gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">
              {t('modal.deleteImpact')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 bg-transparent border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                {t('common.deleting')}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                {t('common.confirmDelete')}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
