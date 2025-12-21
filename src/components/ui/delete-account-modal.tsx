"use client";

import { Modal } from "./modal";
import { AlertCircle, Mail } from "lucide-react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  supportEmail: string;
}

export function DeleteAccountModal({ isOpen, onClose, supportEmail }: DeleteAccountModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center space-y-6 py-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-orange-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">
            Excluir Conta
          </h3>
          <p className="text-zinc-400 text-base">
            Para excluir sua conta, entre em contato com nosso suporte.
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-left">
          <div className="space-y-3 text-sm text-zinc-300">
            <p><strong>Por que preciso entrar em contato?</strong></p>
            <ul className="space-y-2 ml-4">
              <li>• Garantir que você realmente deseja excluir</li>
              <li>• Verificar se há pendências financeiras</li>
              <li>• Confirmar a identidade do titular</li>
              <li>• Processar o cancelamento de forma segura</li>
            </ul>
            <p className="mt-3 text-yellow-400">
              <strong>⚠️ Importante:</strong> A exclusão da conta é permanente e todos os dados serão removidos.
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 justify-center">
            <Mail className="w-5 h-5 text-blue-400" />
            <div className="text-left">
              <p className="text-xs text-zinc-500">Entre em contato:</p>
              <a 
                href={`mailto:${supportEmail}?subject=Solicita%C3%A7%C3%A3o%20de%20Exclus%C3%A3o%20de%20Conta`}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                {supportEmail}
              </a>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Entendi
        </button>
      </div>
    </Modal>
  );
}
