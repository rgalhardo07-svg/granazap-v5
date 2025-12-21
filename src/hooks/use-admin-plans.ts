import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface AdminPlan {
  id: number;
  nome: string;
  tipo_periodo: string;
  valor: number;
  link_checkout: string;
  ativo: boolean;
  ordem_exibicao: number;
  descricao: string;
  recursos: string[]; // Será convertido de JSONB
  created_at: string;
  updated_at: string;
  permite_compartilhamento: boolean;
  max_usuarios_dependentes: number;
  destaque: boolean;
  permite_modo_pj: boolean;
}

export function useAdminPlans() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchPlans = async () => {
    setLoading(true);
    try {
      console.log('🔍 Chamando admin_list_plans...');
      
      const { data, error } = await supabase.rpc('admin_list_plans');
      
      if (error) {
        console.error('❌ Erro:', error.message);
        alert(`Erro ao buscar planos: ${error.message}`);
        return;
      }
      
      console.log('✅ Planos recebidos:', data?.length || 0, 'planos');
      
      // Converter recursos de JSONB para array
      const plansFormatted = (data || []).map((plan: any) => ({
        ...plan,
        recursos: Array.isArray(plan.recursos) ? plan.recursos : [],
        destaque: plan.destaque || false,
      }));
      
      setPlans(plansFormatted);
    } catch (error: any) {
      console.error('❌ Erro catch:', error.message || error);
      alert(`Erro: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (planData: {
    nome: string;
    tipo_periodo: string;
    valor: number;
    link_checkout?: string;
    descricao?: string;
    recursos?: string[];
    permite_compartilhamento?: boolean;
    max_usuarios_dependentes?: number;
    destaque?: boolean;
    permite_modo_pj?: boolean;
  }) => {
    try {
      const { data, error } = await supabase.rpc('admin_create_plan', {
        p_nome: planData.nome,
        p_tipo_periodo: planData.tipo_periodo,
        p_valor: planData.valor,
        p_link_checkout: planData.link_checkout || '',
        p_descricao: planData.descricao || '',
        p_recursos: JSON.stringify(planData.recursos || []),
        p_permite_compartilhamento: planData.permite_compartilhamento || false,
        p_max_usuarios_dependentes: planData.max_usuarios_dependentes || 0,
        p_destaque: planData.destaque || false,
        p_permite_modo_pj: planData.permite_modo_pj !== false, // Default true
      });
      
      if (error) throw error;
      await fetchPlans();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updatePlan = async (planId: number, updates: Partial<AdminPlan>) => {
    try {
      const { error } = await supabase.rpc('admin_update_plan', {
        p_plan_id: planId,
        p_nome: updates.nome,
        p_tipo_periodo: updates.tipo_periodo,
        p_valor: updates.valor,
        p_link_checkout: updates.link_checkout,
        p_descricao: updates.descricao,
        p_recursos: updates.recursos ? JSON.stringify(updates.recursos) : null,
        p_ativo: updates.ativo,
        p_ordem_exibicao: updates.ordem_exibicao,
        p_permite_compartilhamento: updates.permite_compartilhamento,
        p_max_usuarios_dependentes: updates.max_usuarios_dependentes,
        p_destaque: updates.destaque,
        p_permite_modo_pj: updates.permite_modo_pj,
      });
      
      if (error) throw error;
      await fetchPlans();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deletePlan = async (planId: number) => {
    try {
      const { error } = await supabase.rpc('admin_delete_plan', {
        p_plan_id: planId,
      });
      
      if (error) throw error;
      await fetchPlans();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    createPlan,
    updatePlan,
    deletePlan,
    refreshPlans: fetchPlans,
  };
}
