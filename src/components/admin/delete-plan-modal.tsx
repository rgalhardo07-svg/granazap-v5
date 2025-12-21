"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { AlertTriangle } from "lucide-react";

interface DeletePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  onConfirm: () => Promise<void>;
}

export function DeletePlanModal({
  isOpen,
  onClose,
  planName,
  onConfirm,
}: DeletePlanModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Excluir Plano">
      <div className="space-y-6">
        {/* Ícone de Aviso */}
        <div className="mx-auto w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-12 h-12 text-red-400" />
        </div>

        {/* Mensagem */}
        <div className="text-center">
          <p className="text-lg text-white mb-2">
            Tem certeza que deseja excluir o plano:
          </p>
          <p className="text-xl font-bold text-red-400 mb-4">
            {planName}
          </p>
          <p className="text-sm text-zinc-400">
            ⚠️ Esta ação não pode ser desfeita!
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {deleting ? 'Excluindo...' : 'Excluir Plano'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
