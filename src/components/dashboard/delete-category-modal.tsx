"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  category: {
    descricao: string;
    tipo: 'entrada' | 'saida';
  } | null;
  isDeleting: boolean;
}

export function DeleteCategoryModal({
  isOpen,
  onClose,
  onConfirm,
  category,
  isDeleting,
}: DeleteCategoryModalProps) {
  const { t } = useLanguage();
  
  if (!category) return null;

  const isIncome = category.tipo === 'entrada';

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

        {/* Category Details */}
        <div className="bg-[#0A0F1C] rounded-lg p-4 space-y-3 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t('categories.modal.categoryName')}:</span>
            <span className="text-sm font-medium text-white">{category.descricao}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t('form.type')}:</span>
            <span className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
              isIncome
                ? "bg-[#22C55E]/10 text-[#22C55E]"
                : "bg-red-500/10 text-red-500"
            )}>
              {isIncome ? t('categories.modal.typeIncome') : t('categories.modal.typeExpense')}
            </span>
          </div>
        </div>

        {/* Warning Box */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
          <div className="flex gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">
              {t('categories.modal.warningTransactions')}
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
