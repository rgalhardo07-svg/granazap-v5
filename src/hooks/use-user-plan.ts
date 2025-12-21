import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./use-user";

export function useUserPlan() {
  const { profile } = useUser();
  const [permiteModoPJ, setPermiteModoPJ] = useState(true); // Default true
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchPlanPermissions = async () => {
      if (!profile?.plano_id) {
        // Se não tem plano_id, assume que permite (para não quebrar)
        setPermiteModoPJ(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("planos_sistema")
          .select("permite_modo_pj")
          .eq("id", profile.plano_id)
          .single();

        if (error) {
          console.error('❌ Erro ao buscar permissões do plano:', error);
          setPermiteModoPJ(true); // Default true em caso de erro
        } else {
          setPermiteModoPJ(data?.permite_modo_pj !== false); // Default true
        }
      } catch (err) {
        console.error('❌ Erro:', err);
        setPermiteModoPJ(true); // Default true em caso de erro
      } finally {
        setLoading(false);
      }
    };

    fetchPlanPermissions();
  }, [profile?.plano_id]);

  return { permiteModoPJ, loading };
}
