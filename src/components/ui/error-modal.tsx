"use client";

import { XCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export function ErrorModal({
  isOpen,
  onClose,
  title,
  message,
}: ErrorModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center py-8">
        {/* Ícone de Erro */}
        <div className="mx-auto w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
          <XCircle className="w-12 h-12 text-red-400" />
        </div>

        {/* Mensagem */}
        <p className="text-lg text-white mb-8">{message}</p>

        {/* Botão */}
        <button
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          OK
        </button>
      </div>
    </Modal>
  );
}
