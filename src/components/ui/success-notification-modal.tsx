"use client";

import { Modal } from "./modal";
import { CheckCircle2 } from "lucide-react";

interface SuccessNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function SuccessNotificationModal({ 
  isOpen, 
  onClose, 
  title = "Salvo com sucesso!",
  message = "Suas configurações foram atualizadas."
}: SuccessNotificationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center space-y-6 py-4">
        {/* Ícone de Sucesso */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">
            {title}
          </h3>
          <p className="text-zinc-400 text-base">
            {message}
          </p>
        </div>

        {/* Botão OK */}
        <button
          onClick={onClose}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          OK
        </button>
      </div>
    </Modal>
  );
}
