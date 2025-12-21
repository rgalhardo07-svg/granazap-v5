"use client";

import { CheckCircle2, CreditCard, Calendar } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/currency-context";
import { useLanguage } from "@/contexts/language-context";

interface CreditCardSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  installmentData: {
    description: string;
    totalValue: number;
    installments: number;
    installmentValue: number;
    cardName: string;
    firstDueDate: Date;
  } | null;
}

export function CreditCardSuccessModal({
  isOpen,
  onClose,
  installmentData
}: CreditCardSuccessModalProps) {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  if (!installmentData) return null;

  const { description, totalValue, installments, installmentValue, cardName, firstDueDate } = installmentData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="max-w-md"
    >
      <div className="space-y-6">
        {/* Success Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {t('success.transactionSaved')}
          </h3>
          <p className="text-sm text-zinc-400">
            {t('success.installmentsCreated')}
          </p>
        </div>

        {/* Transaction Details */}
        <div className="bg-[#0A0F1C] border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-sm text-zinc-400">Descrição</span>
            <span className="text-sm text-white font-medium text-right">{description}</span>
          </div>

          <div className="flex items-start justify-between">
            <span className="text-sm text-zinc-400">Valor Total</span>
            <span className="text-lg text-white font-bold">{formatCurrency(totalValue)}</span>
          </div>

          <div className="border-t border-white/5 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-zinc-400">Cartão</span>
              </div>
              <span className="text-sm text-white font-medium">{cardName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Parcelamento</span>
              <span className="text-sm text-white font-medium">
                {installments}x de {formatCurrency(installmentValue)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-zinc-400">Primeira Parcela</span>
              </div>
              <span className="text-sm text-white font-medium">
                {firstDueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Info Message */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-blue-300 leading-relaxed">
            💡 As parcelas foram criadas como <strong>lançamentos futuros</strong> e aparecerão na fatura do cartão nos meses correspondentes.
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={onClose}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          Entendi
        </Button>
      </div>
    </Modal>
  );
}
