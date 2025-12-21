"use client";

import { useState } from "react";
import { Modal } from "./modal";
import { AlertTriangle, Trash2 } from "lucide-react";

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function ClearDataModal({ isOpen, onClose, onConfirm, isDeleting }: ClearDataModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmed = confirmText === "DELETAR";

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="">
      <div className="text-center space-y-6 py-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center animate-pulse">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-red-500">
            ⚠️ ATENÇÃO: AÇÃO IRREVERSÍVEL!
          </h3>
          <p className="text-zinc-300 text-base font-medium">
            Você está prestes a DELETAR TODOS os seus dados financeiros!
          </p>
        </div>

        <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4 text-left">
          <div className="space-y-3 text-sm text-zinc-200">
            <p className="font-bold text-red-400 text-base">O QUE SERÁ DELETADO:</p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <Trash2 className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span><strong>TODAS</strong> as suas transações (receitas e despesas)</span>
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span><strong>TODOS</strong> os lançamentos futuros</span>
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span><strong>TODO</strong> o histórico financeiro</span>
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Contas pessoais <strong>E</strong> empresariais (PJ)</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="font-bold text-yellow-400 text-center">
                ⚠️ ESTA AÇÃO NÃO PODE SER DESFEITA! ⚠️
              </p>
              <p className="text-center text-xs text-zinc-400 mt-1">
                Recomendamos exportar seus dados antes de continuar
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-left">
            <label className="block text-sm font-medium text-white mb-2">
              Digite <strong className="text-red-500">DELETAR</strong> para confirmar:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Digite DELETAR"
              disabled={isDeleting}
              className="w-full px-4 py-3 bg-zinc-900 border-2 border-red-500/30 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 disabled:opacity-50 text-center font-bold"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleConfirm}
              disabled={!isConfirmed || isDeleting}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  SIM, DELETAR TUDO
                </>
              )}
            </button>
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="w-full bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar (Recomendado)
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
