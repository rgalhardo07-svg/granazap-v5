"use client";

import { CheckCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
}: SuccessModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center py-8">
        {/* Ícone de Sucesso */}
        <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>

        {/* Mensagem */}
        <p className="text-lg text-white mb-8">{message}</p>

        {/* Botão */}
        <button
          onClick={onClose}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          OK
        </button>
      </div>
    </Modal>
  );
}
