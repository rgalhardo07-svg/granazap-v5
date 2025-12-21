"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface InvestmentErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

export function InvestmentErrorModal({
  isOpen,
  onClose,
  message,
  title = "Erro"
}: InvestmentErrorModalProps) {
  const { t } = useLanguage();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="max-w-md"
    >
      <div className="flex flex-col items-center text-center space-y-6 py-4">
        {/* Ícone de Erro */}
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">
            {title || t('investments.modal.error')}
          </h3>
          <p className="text-zinc-400">
            {message}
          </p>
        </div>

        {/* Botão OK */}
        <Button
          onClick={onClose}
          className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium"
        >
          {t('investments.modal.understood')}
        </Button>
      </div>
    </Modal>
  );
}
