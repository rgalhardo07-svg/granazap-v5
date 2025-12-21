"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { usePlans } from "@/hooks/use-plans";
import { Eye, EyeOff } from "lucide-react";
import { SuccessModal } from "./success-modal";

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: {
    nome: string;
    email: string;
    celular?: string;
    plano?: string;
    plano_id?: number;
    is_admin?: boolean;
    criar_login?: boolean;
    senha?: string;
  }) => Promise<void>;
}

export function UserCreateModal({
  isOpen,
  onClose,
  onSave,
}: UserCreateModalProps) {
  const { plans, loading: loadingPlans } = usePlans();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    celular: '',
    plano: 'free',
    is_admin: false,
    criar_login: false,
    senha: '',
    confirmar_senha: '',
  });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar senhas se criar_login estiver marcado
    if (formData.criar_login) {
      if (!formData.senha || formData.senha.length < 6) {
        alert('A senha deve ter no mínimo 6 caracteres');
        return;
      }
      if (formData.senha !== formData.confirmar_senha) {
        alert('As senhas não coincidem');
        return;
      }
    }
    
    setSaving(true);
    try {
      // Converter plano para plano_id
      const planoId = plans.find(p => p.tipo_periodo === formData.plano)?.id;
      
      await onSave({
        nome: formData.nome,
        email: formData.email,
        celular: formData.celular,
        plano: formData.plano,
        plano_id: planoId,
        is_admin: formData.is_admin,
        criar_login: formData.criar_login,
        senha: formData.criar_login ? formData.senha : undefined,
      });
      
      // Mostrar modal de sucesso
      setShowSuccessModal(true);
      
      // Reset form
      setFormData({
        nome: '',
        email: '',
        celular: '',
        plano: 'free',
        is_admin: false,
        criar_login: false,
        senha: '',
        confirmar_senha: '',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Novo Usuário">
      <p className="text-zinc-400 mb-6">Preencha os dados para criar um novo usuário</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Nome *
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#22C55E]"
            placeholder="Nome do usuário"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#22C55E]"
            placeholder="email@exemplo.com"
            required
          />
        </div>

        {/* Celular */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Celular
          </label>
          <input
            type="text"
            value={formData.celular}
            onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
            className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#22C55E]"
            placeholder="(XX) XXXXX-XXXX"
          />
          <p className="text-xs text-zinc-500 mt-1">Formato: (XX) XXXXX-XXXX • Salvo como: 55</p>
        </div>

        {/* Plano */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Plano *
          </label>
          <select
            value={formData.plano}
            onChange={(e) => setFormData({ ...formData, plano: e.target.value })}
            disabled={loadingPlans}
            className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#22C55E] disabled:opacity-50"
          >
            {loadingPlans ? (
              <option>Carregando planos...</option>
            ) : (
              plans.map((plan) => (
                <option key={plan.id} value={plan.tipo_periodo}>
                  {plan.nome} - R$ {Number(plan.valor).toFixed(2)}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Criar Conta de Autenticação */}
        <div className="bg-[#0A0F1C] border border-white/10 rounded-xl p-4">
          <label className="flex items-center justify-between cursor-pointer mb-3">
            <div>
              <div className="text-orange-400 font-medium">🔒 Criar Conta de Login</div>
              <div className="text-xs text-zinc-400 mt-1">Permitir que o usuário faça login no sistema</div>
            </div>
            <input
              type="checkbox"
              checked={formData.criar_login}
              onChange={(e) => setFormData({ ...formData, criar_login: e.target.checked })}
              className="w-5 h-5 rounded border-white/10 bg-[#0A0F1C] text-orange-500 focus:ring-orange-500"
            />
          </label>

          {/* Campos de Senha (aparecem quando checkbox marcado) */}
          {formData.criar_login && (
            <div className="space-y-4 mt-4 pt-4 border-t border-white/10">
              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Senha *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required={formData.criar_login}
                    minLength={6}
                    className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
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
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmar_senha}
                    onChange={(e) => setFormData({ ...formData, confirmar_senha: e.target.value })}
                    placeholder="Digite a senha novamente"
                    required={formData.criar_login}
                    minLength={6}
                    className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
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
            </div>
          )}
        </div>

        {/* Administrador */}
        <div className="bg-[#0A0F1C] border border-white/10 rounded-xl p-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-white font-medium">Administrador</div>
              <div className="text-sm text-zinc-400">Usuário terá acesso ao painel administrativo</div>
            </div>
            <input
              type="checkbox"
              checked={formData.is_admin}
              onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
              className="w-5 h-5 rounded border-white/10 bg-[#0A0F1C] text-[#22C55E] focus:ring-[#22C55E]"
            />
          </label>
        </div>

        {/* Status */}
        <div className="bg-[#0A0F1C] border border-white/10 rounded-xl p-4">
          <div className="text-sm text-zinc-400 mb-1">Status *</div>
          <div className="text-white font-medium">Ativo</div>
          <p className="text-xs text-zinc-500 mt-1">O usuário será criado com status ativo</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Criando...' : 'Criar Usuário'}
          </button>
        </div>
      </form>

      {/* Modal de Sucesso */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onClose();
        }}
        title="Usuário Criado!"
        message={formData.criar_login ? "Usuário criado com sucesso e conta de login ativada!" : "Usuário criado com sucesso!"}
      />
    </Modal>
  );
}
