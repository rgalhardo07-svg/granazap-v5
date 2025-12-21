"use client";

import { useRouter } from "next/navigation";
import { Modal } from "./modal";
import { Lock, CreditCard } from "lucide-react";

interface SignupBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignupBlockedModal({ isOpen, onClose }: SignupBlockedModalProps) {
  const router = useRouter();

  const handleGoToPlans = () => {
    onClose();
    router.push("/planos");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center space-y-6 py-4">
        {/* Ícone */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">
            Cadastro Gratuito Bloqueado
          </h3>
          <p className="text-zinc-400 text-base">
            No momento, novos cadastros gratuitos estão temporariamente bloqueados.
          </p>
        </div>

        {/* Mensagem */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-white text-sm leading-relaxed">
            Mas não se preocupe! Você pode começar a usar nossa plataforma <strong>agora mesmo</strong> escolhendo um de nossos planos pagos.
          </p>
        </div>

        {/* Benefícios */}
        <div className="text-left space-y-3 bg-[#0A0F1C] rounded-xl p-4">
          <p className="text-white font-medium text-sm">Com um plano você terá:</p>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Acesso completo a todas as funcionalidades</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Controle financeiro pessoal e empresarial</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Relatórios avançados e insights</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Suporte prioritário</span>
            </li>
          </ul>
        </div>

        {/* Botões */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={handleGoToPlans}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            Ver Planos Disponíveis
          </button>
          <button
            onClick={onClose}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    </Modal>
  );
}
