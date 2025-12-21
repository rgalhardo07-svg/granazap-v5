"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useInvestments } from "@/hooks/use-investments";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { useLanguage } from "@/contexts/language-context";
import type { PositionDetailed } from "@/types/investments";

interface DeletePositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: PositionDetailed;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function DeletePositionModal({
  isOpen,
  onClose,
  position,
  onSuccess,
  onError
}: DeletePositionModalProps) {
  const { t } = useLanguage();
  const { filter: accountFilter } = useAccountFilter();
  const { deletePosition } = useInvestments(accountFilter);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deletePosition(position.id);
      onSuccess();
    } catch (error: any) {
      onError(error.message || t('validation.errorDeletingPosition'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="max-w-md"
    >
      <div className="flex flex-col items-center text-center space-y-6 py-4">
        {/* Ícone de Aviso */}
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">
            {t('investments.modal.deletePosition')}
          </h3>
          <p className="text-zinc-400">
            {t('investments.modal.deleteConfirm')} <span className="font-semibold text-white">{position.ticker}</span>?
          </p>
        </div>

        {/* Informações da Posição */}
        <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-2 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">{t('investments.modal.quantityInfo')}</span>
            <span className="text-white font-medium">
              {Number(position.quantidade).toLocaleString('pt-BR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 8
              })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">{t('investments.modal.investedValue')}</span>
            <span className="text-white font-medium">
              R$ {position.valor_investido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Aviso */}
        <div className="w-full bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-sm text-red-400">
            {t('investments.modal.deleteWarning')}
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-3 w-full">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            disabled={loading}
          >
            {loading ? t('investments.modal.deleting') : t('investments.modal.yesDelete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
