"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock } from "lucide-react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export function ErrorModal({ 
  isOpen, 
  onClose, 
  title = "Atenção",
  message 
}: ErrorModalProps) {
  // Detectar se é mensagem de rate limit do Supabase
  const isRateLimit = message.includes("For security purposes") || 
                      message.includes("you can only request this after");
  
  // Extrair tempo de espera se houver
  const timeMatch = message.match(/(\d+)\s*seconds?/);
  const waitTime = timeMatch ? parseInt(timeMatch[1]) : null;

  // Melhorar mensagem de rate limit
  const improvedMessage = isRateLimit 
    ? `Por questões de segurança, aguarde ${waitTime || 60} segundos antes de tentar novamente.`
    : message;

  const improvedTitle = isRateLimit 
    ? "Aguarde um momento" 
    : title;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="max-w-md"
    >
      <div className="flex flex-col items-center text-center space-y-6 py-4">
        {/* Ícone */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
          isRateLimit ? 'bg-yellow-500/10' : 'bg-red-500/10'
        }`}>
          {isRateLimit ? (
            <Clock className="w-12 h-12 text-yellow-500" />
          ) : (
            <AlertCircle className="w-12 h-12 text-red-500" />
          )}
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">
            {improvedTitle}
          </h3>
          <p className="text-zinc-400">
            {improvedMessage}
          </p>
        </div>

        {/* Informação adicional para rate limit */}
        {isRateLimit && waitTime && (
          <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3 text-left">
              <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-white">
                  Proteção de Segurança
                </p>
                <p className="text-xs text-zinc-400">
                  Esta é uma medida de segurança automática para proteger sua conta contra acessos não autorizados.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botão OK */}
        <Button
          onClick={onClose}
          className={`w-full h-11 font-medium ${
            isRateLimit 
              ? 'bg-yellow-600 hover:bg-yellow-700' 
              : 'bg-red-600 hover:bg-red-700'
          } text-white`}
        >
          Entendi
        </Button>
      </div>
    </Modal>
  );
}
