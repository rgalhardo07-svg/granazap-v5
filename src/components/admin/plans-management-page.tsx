"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, CreditCard, Eye, Star } from "lucide-react";
import { useAdminPlans, type AdminPlan } from "@/hooks/use-admin-plans";
import { PlanEditModal } from "./plan-edit-modal";
import { PlanCreateModal } from "./plan-create-modal";
import { DeletePlanModal } from "./delete-plan-modal";
import { SuccessModal } from "./success-modal";

export function PlansManagementPage() {
  const [selectedPlan, setSelectedPlan] = useState<AdminPlan | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { plans, loading, updatePlan, createPlan, deletePlan, refreshPlans } = useAdminPlans();

  const handleEdit = (plan: AdminPlan) => {
    setSelectedPlan(plan);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updates: Partial<AdminPlan>) => {
    if (!selectedPlan) return;
    const result = await updatePlan(selectedPlan.id, updates);
    if (result.success) {
      setIsEditModalOpen(false);
      setSelectedPlan(null);
      setSuccessMessage("Plano atualizado com sucesso!");
      setShowSuccessModal(true);
    } else {
      alert('Erro ao atualizar plano: ' + result.error);
    }
  };

  const handleCreatePlan = async (planData: any) => {
    const result = await createPlan(planData);
    if (result.success) {
      setIsCreateModalOpen(false);
      setSuccessMessage("Plano criado com sucesso!");
      setShowSuccessModal(true);
    } else {
      alert('Erro ao criar plano: ' + result.error);
    }
  };

  const handleDelete = (plan: AdminPlan) => {
    setSelectedPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPlan) return;
    const result = await deletePlan(selectedPlan.id);
    if (result.success) {
      setIsDeleteModalOpen(false);
      setSelectedPlan(null);
      setSuccessMessage("Plano excluído com sucesso!");
      setShowSuccessModal(true);
    } else {
      alert('Erro ao excluir plano: ' + result.error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPeriodLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      free: 'Gratuito',
      mensal: 'Mensal',
      trimestral: 'Trimestral',
      semestral: 'Semestral',
      anual: 'Anual',
      vitalicio: 'Vitalício',
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-[#22C55E]" />
            <h1 className="text-3xl font-bold text-white">Gestão de Planos</h1>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Plano
          </button>
        </div>
        <p className="text-zinc-400">Gerencie os planos disponíveis na plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <div className="text-sm text-zinc-400 mb-1">Total de Planos</div>
          <div className="text-3xl font-bold text-white">{plans.length}</div>
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <div className="text-sm text-zinc-400 mb-1">Planos Ativos</div>
          <div className="text-3xl font-bold text-green-400">{plans.filter(p => p.ativo).length}</div>
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <div className="text-sm text-zinc-400 mb-1">Planos Inativos</div>
          <div className="text-3xl font-bold text-red-400">{plans.filter(p => !p.ativo).length}</div>
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <div className="text-sm text-zinc-400 mb-1">Planos Pagos</div>
          <div className="text-3xl font-bold text-blue-400">{plans.filter(p => p.valor > 0).length}</div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-zinc-400">Carregando...</div>
        ) : plans.length === 0 ? (
          <div className="col-span-full text-center py-12 text-zinc-400">Nenhum plano encontrado</div>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-[#111827] border ${plan.ativo ? 'border-[#22C55E]/20' : 'border-white/5'} rounded-xl p-6 hover:border-[#22C55E]/40 transition-colors`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-white">{plan.nome}</h3>
                    {plan.destaque && (
                      <div className="bg-yellow-500/20 p-1 rounded-full" title="Plano Destaque">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      plan.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {plan.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                      {getPeriodLabel(plan.tipo_periodo)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#22C55E]">
                    {plan.valor === 0 ? 'Grátis' : formatCurrency(plan.valor)}
                  </div>
                  <div className="text-xs text-zinc-500">Ordem: {plan.ordem_exibicao}</div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{plan.descricao}</p>

              {/* Resources */}
              <div className="mb-4">
                <div className="text-xs text-zinc-500 mb-2">Recursos ({plan.recursos?.length || 0}):</div>
                <div className="space-y-1">
                  {plan.recursos?.slice(0, 3).map((recurso, idx) => (
                    <div key={idx} className="text-xs text-zinc-400 flex items-center gap-2">
                      <span className="text-[#22C55E]">✓</span>
                      <span className="line-clamp-1">{recurso}</span>
                    </div>
                  ))}
                  {plan.recursos?.length > 3 && (
                    <div className="text-xs text-zinc-500">+{plan.recursos.length - 3} mais...</div>
                  )}
                </div>
              </div>

              {/* Sharing Info */}
              {plan.permite_compartilhamento && (
                <div className="mb-4 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
                  👥 Permite {plan.max_usuarios_dependentes === -1 ? 'ilimitados' : plan.max_usuarios_dependentes} dependentes
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-white/5">
                <button
                  onClick={() => handleEdit(plan)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(plan)}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <PlanCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreatePlan}
      />

      {selectedPlan && (
        <PlanEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPlan(null);
          }}
          plan={selectedPlan}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Modal */}
      {selectedPlan && (
        <DeletePlanModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedPlan(null);
          }}
          planName={selectedPlan.nome}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Sucesso!"
        message={successMessage}
      />
    </div>
  );
}
