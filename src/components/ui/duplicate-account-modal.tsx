"use client";

import { useRouter } from "next/navigation";
import { Modal } from "./modal";
import { AlertCircle, Mail, Phone, ArrowRight } from "lucide-react";

interface DuplicateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'email' | 'phone';
  value: string;
}

export function DuplicateAccountModal({ isOpen, onClose, type, value }: DuplicateAccountModalProps) {
  const router = useRouter();

  const handleGoToLogin = () => {
    onClose();
    router.push("/");
  };

  const handleGoToRecovery = () => {
    onClose();
    router.push("/?recovery=true");
  };

  const isEmail = type === 'email';
  const Icon = isEmail ? Mail : Phone;
  const fieldName = isEmail ? 'E-mail' : 'Celular';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center space-y-6 py-4">
        {/* Ícone */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-orange-500" />
          </div>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">
            {fieldName} Já Cadastrado
          </h3>
          <p className="text-zinc-400 text-base">
            O {fieldName.toLowerCase()} <strong className="text-white">{value}</strong> já está sendo usado por outra conta.
          </p>
        </div>

        {/* Mensagem */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Icon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-white text-sm leading-relaxed text-left">
              Se esta conta é sua, faça login para acessar. Caso tenha esquecido sua senha, você pode recuperá-la.
            </p>
          </div>
        </div>

        {/* Dicas */}
        <div className="text-left space-y-3 bg-[#0A0F1C] rounded-xl p-4">
          <p className="text-white font-medium text-sm">O que você pode fazer:</p>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">→</span>
              <span>Fazer login com suas credenciais existentes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">→</span>
              <span>Recuperar sua senha se esqueceu</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">→</span>
              <span>Usar outro {fieldName.toLowerCase()} para criar nova conta</span>
            </li>
          </ul>
        </div>

        {/* Botões */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={handleGoToLogin}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            Ir para Login
          </button>
          <button
            onClick={handleGoToRecovery}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Recuperar Senha
          </button>
          <button
            onClick={onClose}
            className="w-full text-zinc-400 hover:text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Voltar ao Cadastro
          </button>
        </div>
      </div>
    </Modal>
  );
}
