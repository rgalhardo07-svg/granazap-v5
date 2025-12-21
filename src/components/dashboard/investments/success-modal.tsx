"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface InvestmentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export function InvestmentSuccessModal({
  isOpen,
  onClose,
  message
}: InvestmentSuccessModalProps) {
  const { t } = useLanguage();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="max-w-md"
    >
      <div className="flex flex-col items-center text-center space-y-6 py-4">
        {/* Ícone de Sucesso */}
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">
            {t('investments.modal.success')}
          </h3>
          <p className="text-zinc-400">
            {message}
          </p>
        </div>

        {/* Botão OK */}
        <Button
          onClick={onClose}
          className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-medium"
        >
          {t('investments.modal.understood')}
        </Button>
      </div>
    </Modal>
  );
}
