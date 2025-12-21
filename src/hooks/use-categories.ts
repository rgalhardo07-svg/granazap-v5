"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./use-user";
import { useAccountFilter } from "./use-account-filter";

export interface Category {
  id: number;
  descricao: string;
  tipo: 'entrada' | 'saida' | 'ambos';
  icon_key?: string;
  cor?: string;
}

export function useCategories(type?: 'entrada' | 'saida') {
  const { profile } = useUser();
  const { filter: accountFilter } = useAccountFilter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        
        let query = supabase
          .from('categoria_trasacoes') 
          .select('*')
          .eq('usuario_id', profile.id)
          .eq('tipo_conta', accountFilter);

        if (type) {
          query = query.in('tipo', [type, 'ambos']);
        }

        const { data, error } = await query.order('descricao');

        if (error) throw error;

        setCategories(data || []);
      } catch (error) {
        // Erro ao buscar categorias
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();

    // Listener para recarregar quando uma nova categoria for criada
    const handleCategoriesChanged = () => {
      fetchCategories();
    };

    window.addEventListener('categoriesChanged', handleCategoriesChanged);

    return () => {
      window.removeEventListener('categoriesChanged', handleCategoriesChanged);
    };
  }, [profile, type, accountFilter]);

  return { categories, loading };
}
