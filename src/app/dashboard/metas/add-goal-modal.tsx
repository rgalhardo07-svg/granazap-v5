"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { Loader2, Target, DollarSign, Calendar, LayoutGrid, Type, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    nome: string;
    tipo_meta: string;
    valor_limite: string;
    categoria_id: string;
    data_inicio: string;
    data_fim: string;
  } | null;
}

export function AddGoalModal({ isOpen, onClose, onSuccess, initialData }: AddGoalModalProps) {
  const { t } = useLanguage();
  const { getCurrencySymbol } = useCurrency();
  const { profile } = useUser();
  const { filter: accountFilter } = useAccountFilter();
  const { categories } = useCategories();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    tipo_meta: "categoria",
    valor_limite: "",
    categoria_id: "",
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: "",
  });

  // Reset feedback ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
    }
  }, [isOpen]);

  // Efeito para carregar dados iniciais (Duplicação)
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData);
    } else if (isOpen && !initialData) {
      // Reset se abrir limpo
      setFormData({
        nome: "",
        tipo_meta: "categoria",
        valor_limite: "",
        categoria_id: "",
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: "",
      });
    }
  }, [isOpen, initialData]);

  const selectedCategory = categories.find(c => String(c.id) === formData.categoria_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    setFeedback(null);

    try {
      const supabase = createClient();
      
      const payload: any = {
        usuario_id: profile.id,
        nome: formData.nome,
        valor_limite: parseFloat(formData.valor_limite.replace(getCurrencySymbol(), '').replace(/\./g, '').replace(',', '.')),
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim,
        tipo_periodo: 'mensal', // Campo obrigatório descoberto via log de erro
        tipo_conta: accountFilter, // Coluna criada e ativa
      };

      // Lógica de Tipo
      if (formData.tipo_meta === 'categoria' && formData.categoria_id) {
        payload.tipo_meta = 'categoria';
        payload.categoria_id = parseInt(formData.categoria_id);
      } else {
        // Banco agora aceita geral_entrada/geral_saida
        payload.tipo_meta = formData.tipo_meta;
        payload.categoria_id = null;
      }

      const { error } = await supabase.from('metas_orcamento').insert(payload);

      if (error) {
        throw error;
      }
      
      setFeedback({ type: 'success', message: t('goals.createSuccess') });
      
      // Delay para fechar
      setTimeout(() => {
        onSuccess();
        onClose();
        setFeedback(null);
      }, 1500);

    } catch (error: any) {
      let msg = t('goals.errorCreate');
      
      // Tentar extrair mensagem do Supabase
      if (error?.message) msg = error.message;
      if (error?.details) msg += ` (${error.details})`;
      
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  // Renderização do Feedback
  if (feedback) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={feedback.type === 'success' ? t('common.save') : 'Erro'}
        className="max-w-sm w-full p-6 bg-[#111827] border border-white/10"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          {feedback.type === 'success' ? (
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">
              {feedback.type === 'success' ? t('goals.createSuccess') : 'Ops, algo deu errado'}
            </h3>
            <p className="text-sm text-zinc-400">
              {feedback.message}
            </p>
          </div>

          {feedback.type === 'error' && (
            <Button 
              onClick={() => setFeedback(null)} 
              className="w-full bg-white/10 hover:bg-white/20 text-white"
            >
              {t('common.cancel')}
            </Button>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('goals.newGoal')}
      className="max-w-md w-full p-0 overflow-hidden bg-[#111827] border border-white/10"
    >
      <div className="p-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
        
        {/* Indicador de Conta */}
        <div className="mb-6 bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-200">
              Adicionando para <span className="font-semibold text-blue-400 uppercase">{accountFilter === 'pessoal' ? t('sidebar.personal') : t('sidebar.pj')}</span>
            </p>
            <p className="text-xs text-blue-500/60 mt-0.5">
              Esta meta será visível e contabilizada apenas neste contexto.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">{t('goals.goalName')}</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors">
                <Type className="w-4 h-4" />
              </div>
              <input
                required
                type="text"
                placeholder={t('goals.namePlaceholder')}
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-3 h-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tipo */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">{t('goals.goalType')}</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors">
                  <Target className="w-4 h-4" />
                </div>
                <select 
                  value={formData.tipo_meta} 
                  onChange={e => setFormData({...formData, tipo_meta: e.target.value})}
                  className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-8 h-10 text-sm text-white appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                >
                  <option value="categoria">{t('goals.byCategory')}</option>
                  <option value="geral_saida">{t('goals.generalExpense')}</option>
                  <option value="geral_entrada">{t('goals.generalIncome')}</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* Valor Limite */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">{t('goals.valueLimit')}</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-green-500 transition-colors">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.valor_limite}
                  onChange={e => setFormData({...formData, valor_limite: e.target.value})}
                  className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-3 h-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Categoria (Se tipo = categoria) */}
          <div className={`space-y-1.5 transition-all duration-300 overflow-hidden ${formData.tipo_meta === 'categoria' ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
            <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">{t('goals.category')}</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <select 
                value={formData.categoria_id} 
                onChange={e => setFormData({...formData, categoria_id: e.target.value})}
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-8 h-10 text-sm text-white appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-ellipsis"
              >
                <option value="">{t('goals.selectCategory')}</option>
                <optgroup label={t('transactions.expenses')}>
                  {categories.filter(c => c.tipo === 'saida').map(cat => (
                    <option key={cat.id} value={String(cat.id)}>🔴 {cat.descricao}</option>
                  ))}
                </optgroup>
                <optgroup label={t('transactions.income')}>
                  {categories.filter(c => c.tipo === 'entrada').map(cat => (
                    <option key={cat.id} value={String(cat.id)}>🟢 {cat.descricao}</option>
                  ))}
                </optgroup>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            {selectedCategory && (
              <p className={`text-xs ml-1 ${selectedCategory.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                {selectedCategory.tipo === 'entrada' ? t('goals.generalIncome') : t('goals.generalExpense')}
              </p>
            )}
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">{t('goals.startDate')}</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  required
                  type="date"
                  value={formData.data_inicio}
                  onChange={e => setFormData({...formData, data_inicio: e.target.value})}
                  className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-3 h-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">{t('goals.endDate')}</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  required
                  type="date"
                  value={formData.data_fim}
                  onChange={e => setFormData({...formData, data_fim: e.target.value})}
                  className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-3 h-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5 mt-4">
            <Button 
              type="button" 
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-zinc-400 hover:text-white hover:bg-white/5 h-10 rounded-lg transition-colors text-sm"
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] text-sm"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t('goals.newGoal')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
