"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useInvestments } from "@/hooks/use-investments";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { useCurrency } from "@/contexts/currency-context";
import { useLanguage } from "@/contexts/language-context";
import type { PositionDetailed } from "@/types/investments";

interface EditPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: PositionDetailed;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function EditPositionModal({
  isOpen,
  onClose,
  position,
  onSuccess,
  onError
}: EditPositionModalProps) {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { filter: accountFilter } = useAccountFilter();
  const { updatePosition } = useInvestments(accountFilter);

  const [quantidade, setQuantidade] = useState("");
  const [precoMedio, setPrecoMedio] = useState("");
  const [observacao, setObservacao] = useState("");
  const [isManualPrice, setIsManualPrice] = useState(false);
  const [manualPrice, setManualPrice] = useState("");
  const [yieldPercentage, setYieldPercentage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (position) {
      setQuantidade(position.quantidade.toString());
      setPrecoMedio(position.preco_medio.toString());
      setObservacao(position.observacao || "");
      setIsManualPrice(position.is_manual_price);
      setManualPrice(position.manual_price?.toString() || "");
      setYieldPercentage(position.yield_percentage?.toString() || "");
    }
  }, [position]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quantidade || precoMedio === "") {
      onError(t('validation.fillRequired'));
      return;
    }

    if (isManualPrice && manualPrice === "") {
      onError(t('validation.enterManualPrice'));
      return;
    }

    setLoading(true);
    try {
      await updatePosition(position.id, {
        quantidade: Number(quantidade),
        preco_medio: Number(precoMedio),
        observacao: observacao || undefined,
        is_manual_price: isManualPrice,
        manual_price: isManualPrice ? Number(manualPrice) : undefined,
        yield_percentage: yieldPercentage ? Number(yieldPercentage) : undefined,
      });

      onSuccess();
    } catch (error: any) {
      onError(error.message || t('validation.errorUpdatingPosition'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('investments.modal.editPosition')}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
          <p className="text-lg font-bold text-white">{position.ticker}</p>
          {position.asset_name && (
            <p className="text-sm text-zinc-400">{position.asset_name}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('investments.modal.quantity')}
            </label>
            <input
              type="number"
              step="0.00000001"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              required
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('investments.modal.avgPrice')}
            </label>
            <input
              type="number"
              step="0.01"
              value={precoMedio}
              onChange={(e) => setPrecoMedio(e.target.value)}
              required
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="border-t border-zinc-700 pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isManualPrice}
              onChange={(e) => setIsManualPrice(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-zinc-300">
              {t('investments.modal.useManualPrice')}
            </span>
          </label>
        </div>

        {isManualPrice && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('investments.modal.manualPrice')}
            </label>
            <input
              type="number"
              step="0.01"
              value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value)}
              required={isManualPrice}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-zinc-500 mt-1">
              {t('investments.modal.manualPriceNote')}
            </p>
          </div>
        )}

        {/* Yield Percentage for Renda Fixa */}
        {position.asset_type === "renda_fixa" && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('investments.modal.yieldPercentage')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={yieldPercentage}
                onChange={(e) => setYieldPercentage(e.target.value)}
                placeholder={t('investments.modal.yieldPlaceholder')}
                className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-zinc-400 text-sm">{t('investments.modal.cdiSuffix')}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {t('investments.modal.yieldNote')}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            {t('investments.modal.observation')}
          </label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder={t('investments.modal.observationPlaceholder')}
          />
        </div>

        {quantidade && precoMedio && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-zinc-400 mb-1">{t('investments.modal.totalInvested')}</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(Number(quantidade) * Number(precoMedio))}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? t('investments.modal.saving') : t('investments.modal.saveChanges')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
