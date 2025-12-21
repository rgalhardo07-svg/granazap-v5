"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Key, Eye, EyeOff } from "lucide-react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onReset: (newPassword: string) => Promise<boolean>;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  userName,
  onReset,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validações
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setResetting(true);
    setError("");
    
    try {
      await onReset(password);
      // Se chegou aqui, deu certo
      setPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err: any) {
      // Extrair mensagem de erro mais clara
      let errorMessage = "Erro ao resetar senha. Tente novamente.";
      
      if (err.message) {
        if (err.message.includes('gen_salt')) {
          errorMessage = "Erro de configuração do servidor. Contate o administrador.";
        } else if (err.message.includes('Acesso negado')) {
          errorMessage = "Você não tem permissão para esta ação.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setResetting(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setConfirmPassword("");
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Resetar Senha do Usuário">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info do Usuário */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-zinc-400">Resetando senha para:</div>
              <div className="text-white font-semibold">{userName}</div>
            </div>
          </div>
        </div>

        {/* Nova Senha */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Nova Senha *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#22C55E]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Confirmar Senha */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Confirmar Nova Senha *
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite a senha novamente"
              required
              minLength={6}
              className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#22C55E]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        )}

        {/* Aviso */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <div className="text-orange-400 text-sm">
            ⚠️ Esta ação irá alterar a senha de login do usuário imediatamente.
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={resetting}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={resetting || !password || !confirmPassword}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Key className="w-5 h-5" />
            {resetting ? 'Resetando...' : 'Resetar Senha'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
