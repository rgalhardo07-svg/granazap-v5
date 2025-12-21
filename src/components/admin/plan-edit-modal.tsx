"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { AdminPlan } from "@/hooks/use-admin-plans";
import { Plus, X } from "lucide-react";

interface PlanEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: AdminPlan;
  onSave: (updates: Partial<AdminPlan>) => Promise<void>;
}

export function PlanEditModal({ isOpen, onClose, plan, onSave }: PlanEditModalProps) {
  const [formData, setFormData] = useState({
    nome: plan.nome,
    tipo_periodo: plan.tipo_periodo,
    valor: plan.valor.toString(),
    link_checkout: plan.link_checkout,
    descricao: plan.descricao,
    ativo: plan.ativo,
    ordem_exibicao: plan.ordem_exibicao,
    permite_compartilhamento: plan.permite_compartilhamento,
    max_usuarios_dependentes: plan.max_usuarios_dependentes,
    destaque: plan.destaque || false,
    permite_modo_pj: plan.permite_modo_pj !== false, // Default true
  });
  const [recursos, setRecursos] = useState<string[]>(plan.recursos || []);
  const [newRecurso, setNewRecurso] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nome: plan.nome,
        tipo_periodo: plan.tipo_periodo,
        valor: plan.valor.toString(),
        link_checkout: plan.link_checkout,
        descricao: plan.descricao,
        ativo: plan.ativo,
        ordem_exibicao: plan.ordem_exibicao,
        permite_compartilhamento: plan.permite_compartilhamento,
        max_usuarios_dependentes: plan.max_usuarios_dependentes,
        destaque: plan.destaque || false,
        permite_modo_pj: plan.permite_modo_pj !== false, // Default true
      });
      setRecursos(plan.recursos || []);
    }
  }, [isOpen, plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...formData,
        valor: parseFloat(formData.valor),
        recursos,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Plano">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Nome *</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Período *</label>
            <select
              value={formData.tipo_periodo}
              onChange={(e) => setFormData({ ...formData, tipo_periodo: e.target.value })}
              className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-2 text-white"
            >
              <option value="free">Gratuito</option>
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
              <option value="vitalicio">Vitalício</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Valor (R$) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Ordem *</label>
            <input
              type="number"
              value={formData.ordem_exibicao}
              onChange={(e) => setFormData({ ...formData, ordem_exibicao: parseInt(e.target.value) })}
              className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Link Checkout</label>
          <input
            type="url"
            value={formData.link_checkout}
            onChange={(e) => setFormData({ ...formData, link_checkout: e.target.value })}
            className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Descrição</label>
          <textarea
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-2 text-white"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Recursos</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newRecurso}
              onChange={(e) => setNewRecurso(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), setRecursos([...recursos, newRecurso.trim()]), setNewRecurso(''))}
              className="flex-1 bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-2 text-white"
              placeholder="Digite um recurso..."
            />
            <button
              type="button"
              onClick={() => { setRecursos([...recursos, newRecurso.trim()]); setNewRecurso(''); }}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-4 py-2 rounded-lg"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {recursos.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-[#0A0F1C] border border-white/10 rounded px-3 py-2">
                <span className="text-sm text-white">{r}</span>
                <button type="button" onClick={() => setRecursos(recursos.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#0A0F1C] border border-white/10 rounded-xl p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="text-white font-medium">Plano Ativo</div>
              <input
                type="checkbox"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="w-5 h-5 rounded"
              />
            </label>
          </div>
          <div className="bg-[#0A0F1C] border border-white/10 rounded-xl p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="text-white font-medium">Plano Destaque</div>
              <input
                type="checkbox"
                checked={formData.destaque}
                onChange={(e) => setFormData({ ...formData, destaque: e.target.checked })}
                className="w-5 h-5 rounded"
              />
            </label>
          </div>
          <div className="bg-[#0A0F1C] border border-white/10 rounded-xl p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="text-white font-medium">Compartilhamento</div>
              <input
                type="checkbox"
                checked={formData.permite_compartilhamento}
                onChange={(e) => setFormData({ ...formData, permite_compartilhamento: e.target.checked })}
                className="w-5 h-5 rounded"
              />
            </label>
          </div>
          <div className="bg-[#0A0F1C] border border-white/10 rounded-xl p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="text-white font-medium">Modo PJ (Pessoa Jurídica)</div>
              <input
                type="checkbox"
                checked={formData.permite_modo_pj}
                onChange={(e) => setFormData({ ...formData, permite_modo_pj: e.target.checked })}
                className="w-5 h-5 rounded"
              />
            </label>
          </div>
        </div>

        {formData.permite_compartilhamento && (
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Máx. Dependentes (-1 = ilimitado)</label>
            <input
              type="number"
              value={formData.max_usuarios_dependentes || 0}
              onChange={(e) => setFormData({ ...formData, max_usuarios_dependentes: parseInt(e.target.value) || 0 })}
              className="w-full bg-[#0A0F1C] border border-white/10 rounded px-3 py-2 text-white"
            />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg font-medium">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
