"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface WhatsAppConfig {
  whatsapp_enabled: boolean;
  whatsapp_contact_url: string;
  whatsapp_contact_text: string;
  video_url_instalacao?: string;
}

export function useWhatsAppConfig() {
  return useQuery({
    queryKey: ["whatsapp-config"],
    queryFn: async () => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("configuracoes_sistema")
        .select("whatsapp_enabled, whatsapp_contact_url, whatsapp_contact_text, video_url_instalacao")
        .single();

      if (error) throw error;
      return data as WhatsAppConfig;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
