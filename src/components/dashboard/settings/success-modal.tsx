"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, Mail } from "lucide-react";
import { useState } from "react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberEmail: string;
  appName: string;
}

export function SuccessModal({ 
  isOpen, 
  onClose, 
  memberName, 
  memberEmail,
  appName 
}: SuccessModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(memberEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            Membro Adicionado!
          </h3>
          <p className="text-zinc-400">
            {memberName} foi adicionado à sua equipe
          </p>
        </div>

        {/* Card com Instruções */}
        <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-4">
          <div className="flex items-start gap-3 text-left">
            <Mail className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium text-white">
                Próximo Passo
              </p>
              <p className="text-sm text-zinc-400">
                Peça para <span className="text-white font-medium">{memberName}</span> criar uma conta no {appName} usando o e-mail:
              </p>
            </div>
          </div>

          {/* E-mail com botão de copiar */}
          <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
            <span className="text-sm text-white font-mono flex-1 truncate">
              {memberEmail}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleCopyEmail}
              className="h-8 px-3 hover:bg-zinc-700"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-zinc-400" />
              )}
            </Button>
          </div>

          <div className="flex items-start gap-2 text-left">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
            <p className="text-xs text-zinc-500">
              O acesso será liberado automaticamente quando a conta for criada com este e-mail
            </p>
          </div>
        </div>

        {/* Botão OK */}
        <Button
          onClick={onClose}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          Entendi
        </Button>
      </div>
    </Modal>
  );
}
