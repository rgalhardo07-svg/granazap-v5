"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/currency-context";
import { useLanguage } from "@/contexts/language-context";
import { createClient } from "@/lib/supabase/client";
import type { PositionDetailed, DividendType } from "@/types/investments";

interface AddDividendModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: PositionDetailed;
  onSuccess: () => void;
  onError: (message: string) => void;
}

const useDividendTypes = () => {
  const { t } = useLanguage();
  return [
    { value: "dividendo" as DividendType, label: t('investments.modal.dividend') },
    { value: "jcp" as DividendType, label: t('investments.modal.jcp') },
    { value: "rendimento" as DividendType, label: t('investments.modal.yield') },
    { value: "amortizacao" as DividendType, label: t('investments.modal.amortization') },
  ];
};

export function AddDividendModal({
  isOpen,
  onClose,
  position,
  onSuccess,
  onError
}: AddDividendModalProps) {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const DIVIDEND_TYPES = useDividendTypes();

  const [tipo, setTipo] = useState<DividendType>("dividendo");
  const [valorPorAtivo, setValorPorAtivo] = useState("");
  const [dataCom, setDataCom] = useState("");
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split("T")[0]);
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!valorPorAtivo || !dataPagamento) {
      onError(t('validation.fillRequired'));
      return;
    }

    if (dataCom && dataPagamento && dataCom > dataPagamento) {
      onError(t('validation.comDateBeforePayment'));
      return;
    }

    setLoading(true);
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("investment_dividends")
        .insert({
          position_id: position.id,
          tipo,
          valor_por_ativo: Number(valorPorAtivo),
          data_com: dataCom || null,
          data_pagamento: dataPagamento,
          observacao: observacao || null,
        });

      if (error) throw error;

      handleClose();
      onSuccess();
    } catch (error: any) {
      onError(error.message || t('validation.errorAddingDividend'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTipo("dividendo");
    setValorPorAtivo("");
    setDataCom("");
    setDataPagamento(new Date().toISOString().split("T")[0]);
    setObservacao("");
    onClose();
  };

  const totalValue = valorPorAtivo ? Number(valorPorAtivo) * Number(position.quantidade) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('investments.modal.addDividend')}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-white">{position.ticker}</p>
              {position.asset_name && (
                <p className="text-sm text-zinc-400">{position.asset_name}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-400">{t('investments.modal.quantityInfo')}</p>
              <p className="text-lg font-bold text-white">
                {Number(position.quantidade).toLocaleString('pt-BR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 8
                })}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            {t('investments.modal.dividendType')}
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as DividendType)}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DIVIDEND_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            {t('investments.modal.valuePerAsset')}
          </label>
          <input
            type="number"
            step="0.01"
            value={valorPorAtivo}
            onChange={(e) => setValorPorAtivo(e.target.value)}
            required
            placeholder="0.00"
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-zinc-500 mt-1">
            {t('investments.modal.valuePerAssetNote')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('investments.modal.comDate')}
            </label>
            <input
              type="date"
              value={dataCom}
              onChange={(e) => setDataCom(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-zinc-500 mt-1">
              {t('investments.modal.comDateNote')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('investments.modal.paymentDate')}
            </label>
            <input
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              required
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            {t('investments.modal.observation')}
          </label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder={t('investments.modal.observationPlaceholder')}
          />
        </div>

        {totalValue > 0 && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-sm text-zinc-400 mb-1">{t('investments.modal.totalReceived')}</p>
            <p className="text-2xl font-bold text-green-500">
              {formatCurrency(totalValue)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {Number(valorPorAtivo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} × {Number(position.quantidade).toLocaleString('pt-BR')} {t('investments.modal.assets')}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={handleClose}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? t('investments.modal.addingDividend') : t('investments.modal.addDividendButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
