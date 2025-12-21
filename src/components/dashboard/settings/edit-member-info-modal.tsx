"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone } from "lucide-react";
import type { TeamMember } from "@/hooks/use-team-members";

interface EditMemberInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
  onSave: (memberId: number, data: { nome: string; email: string; telefone: string }) => Promise<void>;
}

export function EditMemberInfoModal({ isOpen, onClose, member, onSave }: EditMemberInfoModalProps) {
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  // Atualizar dados quando o membro mudar
  useEffect(() => {
    if (member) {
      setNome(member.nome || '');
      setEmail(member.email || '');
      setTelefone(member.telefone || '');
    }
    setLoading(false);
  }, [member]);

  // Resetar loading quando modal fecha
  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!member) return;
    
    // Validações
    if (!nome.trim()) {
      alert('Nome é obrigatório');
      return;
    }
    if (!email.trim()) {
      alert('Email é obrigatório');
      return;
    }
    if (!telefone.trim()) {
      alert('Telefone é obrigatório');
      return;
    }
    
    setLoading(true);
    try {
      await onSave(member.id, { nome, email, telefone });
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      alert("Erro ao salvar: " + (error as Error).message);
      setLoading(false);
    }
  };

  if (!member) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Cadastro - ${member.nome}`}
      className="max-w-md"
    >
      <div className="space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Nome Completo
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            placeholder="Nome completo"
            disabled={loading}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            placeholder="email@exemplo.com"
            disabled={loading}
          />
          <p className="text-xs text-zinc-500 mt-1">
            ⚠️ Alterar o email pode afetar o login do usuário
          </p>
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            <Phone className="w-4 h-4 inline mr-2" />
            Telefone
          </label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            placeholder="+55 11 99999-9999"
            disabled={loading}
          />
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
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
