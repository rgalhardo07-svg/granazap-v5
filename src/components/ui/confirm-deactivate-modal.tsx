"use client";

import { Modal } from "./modal";
import { AlertTriangle, Info } from "lucide-react";

interface ConfirmDeactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  isActivating?: boolean;
}

export function ConfirmDeactivateModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  memberName,
  isActivating = false
}: ConfirmDeactivateModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center space-y-6 py-4">
        {/* Ícone */}
        <div className="flex justify-center">
          <div className={`w-20 h-20 ${isActivating ? 'bg-green-500/10' : 'bg-yellow-500/10'} rounded-full flex items-center justify-center`}>
            <AlertTriangle className={`w-10 h-10 ${isActivating ? 'text-green-500' : 'text-yellow-500'}`} />
          </div>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">
            {isActivating ? 'Ativar Membro?' : 'Inativar Membro?'}
          </h3>
          <p className="text-zinc-400 text-base">
            {isActivating 
              ? `Deseja reativar o acesso de ${memberName}?`
              : `Deseja inativar o acesso de ${memberName}?`
            }
          </p>
        </div>

        {/* Informações */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-left">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm text-zinc-300">
              {isActivating ? (
                <>
                  <p><strong>O que acontece ao ativar:</strong></p>
                  <ul className="space-y-1 ml-4">
                    <li>• O membro poderá fazer login novamente</li>
                    <li>• Terá acesso aos dados compartilhados</li>
                    <li>• Poderá realizar transações conforme permissões</li>
                  </ul>
                </>
              ) : (
                <>
                  <p><strong>O que acontece ao inativar:</strong></p>
                  <ul className="space-y-1 ml-4">
                    <li>• O membro não poderá mais fazer login</li>
                    <li>• Perderá acesso aos dados compartilhados</li>
                    <li>• Não poderá realizar nenhuma transação</li>
                    <li>• Os dados históricos serão mantidos</li>
                  </ul>
                  <p className="mt-3 text-yellow-400">
                    <strong>⚠️ Importante:</strong> Você pode reativar este membro a qualquer momento.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={onConfirm}
            className={`w-full ${isActivating ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white px-6 py-3 rounded-lg font-medium transition-colors`}
          >
            {isActivating ? 'Sim, Ativar' : 'Sim, Inativar'}
          </button>
          <button
            onClick={onClose}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
