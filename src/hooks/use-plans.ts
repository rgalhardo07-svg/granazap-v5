import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Plan {
  id: number;
  nome: string;
  tipo_periodo: string;
  valor: number;
  ativo: boolean;
  destaque?: boolean;
  descricao?: string;
  recursos?: string | string[];
  link_checkout?: string;
}

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('planos_sistema')
        .select('id, nome, tipo_periodo, valor, ativo, destaque, descricao, recursos, link_checkout')
        .eq('ativo', true)
        .order('ordem_exibicao');

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar planos:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return { plans, loading };
}
