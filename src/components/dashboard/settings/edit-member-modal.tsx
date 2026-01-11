"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Shield, Eye, EyeOff, Edit, Trash, FileText, CreditCard, Wallet, UserPlus, Building2, User } from "lucide-react";
import type { TeamMember } from "@/hooks/use-team-members";

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
  onSave: (memberId: number, permissoes: any) => Promise<void>;
}

interface Permissoes {
  pode_ver_dados_admin: boolean;
  pode_ver_outros_membros: boolean;
  pode_criar_transacoes: boolean;
  pode_editar_transacoes: boolean;
  pode_deletar_transacoes: boolean;
  pode_ver_relatorios: boolean;
  pode_gerenciar_contas: boolean;
  pode_gerenciar_cartoes: boolean;
  pode_convidar_membros: boolean;
  nivel_acesso: 'basico' | 'intermediario' | 'avancado';
  tipos_conta_permitidos: string[];
}

const permissoesDefault: Permissoes = {
  pode_ver_dados_admin: true,
  pode_ver_outros_membros: false,
  pode_criar_transacoes: true,
  pode_editar_transacoes: true,
  pode_deletar_transacoes: false,
  pode_ver_relatorios: true,
  pode_gerenciar_contas: false,
  pode_gerenciar_cartoes: false,
  pode_convidar_membros: false,
  nivel_acesso: 'basico',
  tipos_conta_permitidos: ['pessoal', 'pj']
};

export function EditMemberModal({ isOpen, onClose, member, onSave }: EditMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [permissoes, setPermissoes] = useState<Permissoes>(permissoesDefault);

  // Atualizar permissões quando o membro mudar
  useEffect(() => {
    if (member?.permissoes) {
      setPermissoes({
        ...member.permissoes,
        tipos_conta_permitidos: member.permissoes.tipos_conta_permitidos || ['pessoal', 'pj']
      });
    } else {
      setPermissoes(permissoesDefault);
    }
    // Resetar loading quando modal abre
    setLoading(false);
  }, [member]);

  // Resetar loading quando modal fecha
  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!member) {
      return;
    }
    
    
    setLoading(true);
    try {
      await onSave(member.id, permissoes);
      // Não fechar imediatamente, esperar um pouco para garantir que salvou
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      alert("Erro ao salvar permissões: " + (error as Error).message);
      setLoading(false);
    }
  };

  const togglePermissao = (key: keyof Permissoes) => {
    if (key === 'nivel_acesso' || key === 'tipos_conta_permitidos') return; // Não toggle, usa select
    setPermissoes(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleTipoConta = (tipo: 'pessoal' | 'pj') => {
    setPermissoes(prev => {
      const tipos = prev.tipos_conta_permitidos || ['pessoal', 'pj'];
      const hasType = tipos.includes(tipo);
      
      // Não permitir desmarcar ambos
      if (hasType && tipos.length === 1) {
        return prev;
      }
      
      return {
        ...prev,
        tipos_conta_permitidos: hasType
          ? tipos.filter(t => t !== tipo)
          : [...tipos, tipo]
      };
    });
  };

  const setNivelAcesso = (nivel: 'basico' | 'intermediario' | 'avancado') => {
    // Presets de permissões por nível
    const presets = {
      basico: {
        ...permissoesDefault,
        nivel_acesso: 'basico' as const,
        tipos_conta_permitidos: ['pessoal', 'pj']
      },
      intermediario: {
        pode_ver_dados_admin: true,
        pode_ver_outros_membros: true,
        pode_criar_transacoes: true,
        pode_editar_transacoes: true,
        pode_deletar_transacoes: true,
        pode_ver_relatorios: true,
        pode_gerenciar_contas: false,
        pode_gerenciar_cartoes: false,
        pode_convidar_membros: false,
        nivel_acesso: 'intermediario' as const,
        tipos_conta_permitidos: ['pessoal', 'pj']
      },
      avancado: {
        pode_ver_dados_admin: true,
        pode_ver_outros_membros: true,
        pode_criar_transacoes: true,
        pode_editar_transacoes: true,
        pode_deletar_transacoes: true,
        pode_ver_relatorios: true,
        pode_gerenciar_contas: true,
        pode_gerenciar_cartoes: true,
        pode_convidar_membros: false, // Sempre bloqueado
        nivel_acesso: 'avancado' as const,
        tipos_conta_permitidos: ['pessoal', 'pj']
      }
    };
    setPermissoes(presets[nivel]);
  };

  if (!member) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Permissões - ${member.nome}`}
      className="max-w-2xl"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Tipos de Conta Permitidos */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Acesso às Contas
          </label>
          <div className="text-xs text-zinc-400 mb-3">
            Defina quais tipos de conta este membro pode acessar
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => toggleTipoConta('pessoal')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                (permissoes.tipos_conta_permitidos || []).includes('pessoal')
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium text-white">Conta Pessoal</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => toggleTipoConta('pj')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                (permissoes.tipos_conta_permitidos || []).includes('pj')
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <Building2 className="w-4 h-4" />
                <span className="text-sm font-medium text-white">Conta PJ</span>
              </div>
            </button>
          </div>
        </div>

        {/* Nível de Acesso Rápido */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Nível de Acesso Rápido
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['basico', 'intermediario', 'avancado'] as const).map((nivel) => (
              <button
                key={nivel}
                onClick={() => setNivelAcesso(nivel)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  permissoes.nivel_acesso === nivel
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="text-sm font-medium text-white capitalize">
                  {nivel}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permissões Detalhadas */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Permissões Detalhadas
          </label>
          <div className="space-y-2">
            {/* Ver Dados do Admin */}
            <PermissionToggle
              icon={<Eye className="w-4 h-4" />}
              label="Ver dados do administrador"
              description="Pode visualizar transações e dados criados pelo admin"
              checked={permissoes.pode_ver_dados_admin}
              onChange={() => togglePermissao('pode_ver_dados_admin')}
            />

            {/* Ver Outros Membros */}
            <PermissionToggle
              icon={<Eye className="w-4 h-4" />}
              label="Ver dados de outros membros"
              description="Pode visualizar transações de outros membros da equipe"
              checked={permissoes.pode_ver_outros_membros}
              onChange={() => togglePermissao('pode_ver_outros_membros')}
            />

            {/* Criar Transações */}
            <PermissionToggle
              icon={<Edit className="w-4 h-4" />}
              label="Criar transações"
              description="Pode adicionar novas receitas e despesas"
              checked={permissoes.pode_criar_transacoes}
              onChange={() => togglePermissao('pode_criar_transacoes')}
            />

            {/* Editar Transações */}
            <PermissionToggle
              icon={<Edit className="w-4 h-4" />}
              label="Editar transações"
              description="Pode modificar transações existentes"
              checked={permissoes.pode_editar_transacoes}
              onChange={() => togglePermissao('pode_editar_transacoes')}
            />

            {/* Deletar Transações */}
            <PermissionToggle
              icon={<Trash className="w-4 h-4" />}
              label="Deletar transações"
              description="Pode remover transações (cuidado!)"
              checked={permissoes.pode_deletar_transacoes}
              onChange={() => togglePermissao('pode_deletar_transacoes')}
            />

            {/* Ver Relatórios */}
            <PermissionToggle
              icon={<FileText className="w-4 h-4" />}
              label="Ver relatórios"
              description="Pode acessar relatórios e análises"
              checked={permissoes.pode_ver_relatorios}
              onChange={() => togglePermissao('pode_ver_relatorios')}
            />

            {/* Gerenciar Contas */}
            <PermissionToggle
              icon={<Wallet className="w-4 h-4" />}
              label="Gerenciar contas bancárias"
              description="Pode criar, editar e deletar contas"
              checked={permissoes.pode_gerenciar_contas}
              onChange={() => togglePermissao('pode_gerenciar_contas')}
            />

            {/* Gerenciar Cartões */}
            <PermissionToggle
              icon={<CreditCard className="w-4 h-4" />}
              label="Gerenciar cartões de crédito"
              description="Pode criar, editar e deletar cartões"
              checked={permissoes.pode_gerenciar_cartoes}
              onChange={() => togglePermissao('pode_gerenciar_cartoes')}
            />

            {/* Convidar Membros - SEMPRE BLOQUEADO */}
            <PermissionToggle
              icon={<UserPlus className="w-4 h-4" />}
              label="Convidar novos membros"
              description="Bloqueado - Apenas o admin pode convidar"
              checked={false}
              onChange={() => {}}
              disabled={true}
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar Permissões"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Componente auxiliar para toggle de permissão
function PermissionToggle({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled = false
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        disabled
          ? 'border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed'
          : checked
          ? 'border-blue-500/50 bg-blue-500/5'
          : 'border-zinc-800 hover:border-zinc-700 cursor-pointer'
      }`}
      onClick={disabled ? undefined : onChange}
    >
      <div className={`mt-0.5 ${checked ? 'text-blue-500' : 'text-zinc-500'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-zinc-500 mt-0.5">{description}</div>
      </div>
      <div
        className={`w-10 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-zinc-700'
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white mt-1 transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </div>
    </div>
  );
}
