"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { AdminUser } from "@/hooks/use-admin-users";
import { usePlans } from "@/hooks/use-plans";
import { Eye, EyeOff, Key } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SuccessModal } from "./success-modal";

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser;
  onSave: (updates: Partial<AdminUser>) => Promise<void>;
}

export function UserEditModal({
  isOpen,
  onClose,
  user,
  onSave,
}: UserEditModalProps) {
  const { plans, loading: loadingPlans } = usePlans();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    nome: user.nome,
    email: user.email,
    celular: user.celular || '',
    plano: user.plano || 'free',
    status: user.status,
    is_admin: user.is_admin,
    data_compra: user.data_compra || '',
    data_final_plano: user.data_final_plano || '',
  });
  const [saving, setSaving] = useState(false);
  const [showCreateLoginSection, setShowCreateLoginSection] = useState(false);
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nome: user.nome,
        email: user.email,
        celular: user.celular || '',
        plano: user.plano || 'free',
        status: user.status,
        is_admin: user.is_admin,
        data_compra: user.data_compra || '',
        data_final_plano: user.data_final_plano || '',
      });
    }
  }, [isOpen, user]);

  const handleCreateLogin = async () => {
    // Validar senhas
    if (!senha || senha.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (senha !== confirmarSenha) {
      alert('As senhas não coincidem');
      return;
    }

    setCreatingLogin(true);
    try {
      const { data, error } = await supabase.rpc('admin_create_auth_for_user', {
        p_user_id: user.id,
        p_senha: senha,
      });

      if (error) {
        console.error('Erro ao criar conta:', error);
        throw error;
      }
      
      console.log('Conta criada com sucesso:', data);
      setShowSuccessModal(true);
      setShowCreateLoginSection(false);
      setSenha('');
      setConfirmarSenha('');
    } catch (error: any) {
      console.error('Erro catch:', error);
      alert('Erro ao criar conta de login: ' + error.message);
    } finally {
      setCreatingLogin(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Converter plano para plano_id
      const planoId = plans.find(p => p.tipo_periodo === formData.plano)?.id;
      
      await onSave({
        ...formData,
        plano_id: planoId,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Usuário">
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
            className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#22C55E]"
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
            className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#22C55E]"
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
            className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#22C55E]"
            placeholder="(XX) XXXXX-XXXX"
          />
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

        {/* Data de Compra */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Data de Compra
          </label>
          <input
            type="date"
            value={formData.data_compra ? formData.data_compra.split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, data_compra: e.target.value })}
            className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#22C55E]"
          />
        </div>

        {/* Data Final do Plano */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Data Final do Plano
          </label>
          <input
            type="date"
            value={formData.data_final_plano ? formData.data_final_plano.split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, data_final_plano: e.target.value })}
            className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#22C55E]"
          />
        </div>

        {/* Criar Conta de Login (só aparece se não tem senha) */}
        {!user.has_password && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
            {!showCreateLoginSection ? (
              <div>
                <div className="flex items-center gap-2 text-orange-400 font-medium mb-2">
                  <Key className="w-5 h-5" />
                  Criar Conta de Login
                </div>
                <p className="text-sm text-zinc-400 mb-3">
                  Este usuário não possui conta de login. Deseja criar agora?
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateLoginSection(true)}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Criar Conta de Login
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-orange-400 font-medium">
                    <Key className="w-5 h-5" />
                    Criar Conta de Login
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateLoginSection(false);
                      setSenha('');
                      setConfirmarSenha('');
                    }}
                    className="text-zinc-400 hover:text-white text-sm"
                  >
                    Cancelar
                  </button>
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Senha *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
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
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Digite a senha novamente"
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

                {/* Botão Criar */}
                <button
                  type="button"
                  onClick={handleCreateLogin}
                  disabled={creatingLogin}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Key className="w-5 h-5" />
                  {creatingLogin ? 'Criando...' : 'Criar Conta de Login'}
                </button>
              </div>
            )}
          </div>
        )}

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
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Status *
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#22C55E]"
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
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
            {saving ? 'Salvando...' : 'Salvar Alterações'}
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
        title="Conta de Login Criada!"
        message="A conta de login foi criada com sucesso. O usuário já pode fazer login no sistema."
      />
    </Modal>
  );
}
