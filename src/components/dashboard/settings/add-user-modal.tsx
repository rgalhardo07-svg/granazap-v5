"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2, UserPlus } from "lucide-react";
import { useBranding } from "@/contexts/branding-context";
import { SuccessModal } from "./success-modal";
import { ErrorModal } from "./error-modal";

import { inviteMember } from "@/actions/team-actions";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const { settings } = useBranding();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "+55 "
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await inviteMember(formData);

      if (result.success) {
        onClose(); // Fecha o modal de adicionar
        setShowSuccessModal(true); // Abre o modal de sucesso
        onSuccess();
      } else {
        setErrorMessage(result.error || "Erro ao adicionar membro");
        setShowErrorModal(true);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || "Erro inesperado ao adicionar usuário");
      setShowErrorModal(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setFormData({ nome: "", email: "", telefone: "+55 " });
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Adicionar Pessoa"
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-sm text-zinc-400 -mt-4">
            O número adicionado não deve ter conta cadastrada
          </p>

          {/* Foto Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-dashed border-zinc-700 hover:border-zinc-500 transition-colors cursor-pointer group">
              <Camera className="w-8 h-8 text-zinc-500 group-hover:text-zinc-400" />
            </div>
            <button type="button" className="text-sm px-3 py-1 rounded-full border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
              Adicionar foto
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Nome</label>
              <Input
                required
                placeholder="Nome"
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
                className="bg-[#0A0F1C] border-zinc-800 text-white placeholder:text-zinc-500 h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">E-mail</label>
              <Input
                required
                type="email"
                placeholder="E-mail"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="bg-[#0A0F1C] border-zinc-800 text-white placeholder:text-zinc-500 h-11"
              />
              <p className="text-xs text-zinc-500">
                E-mail é usado para a pessoa fazer login e acessar a plataforma.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Telefone</label>
              <div className="flex gap-2">
                <div className="w-20 h-11 bg-[#0A0F1C] border border-zinc-800 rounded-lg flex items-center justify-center gap-1">
                  <span className="text-lg">🇧🇷</span>
                </div>
                <Input
                  required
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={e => setFormData({...formData, telefone: e.target.value})}
                  className="bg-[#0A0F1C] border-zinc-800 text-white placeholder:text-zinc-500 h-11 flex-1"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button 
              type="submit" 
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Adicionar
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
              className="w-full h-11 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white bg-transparent"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Sucesso - Fora do Modal principal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        memberName={formData.nome}
        memberEmail={formData.email}
        appName={settings.appName}
      />

      {/* Modal de Erro */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={handleErrorClose}
        message={errorMessage}
      />
    </>
  );
}
