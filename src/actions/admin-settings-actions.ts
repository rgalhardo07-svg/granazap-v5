"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateAdminSettings(data: {
  bloquear_cadastro_novos_usuarios: boolean;
}) {
  const supabase = await createClient();
  
  console.log('💾 [SERVER] Salvando configurações administrativas:', data);
  
  // Verificar usuário atual
  const { data: { user } } = await supabase.auth.getUser();
  console.log('👤 [SERVER] Usuário:', user?.id);
  
  const { data: result, error } = await supabase
    .from("configuracoes_sistema")
    .update({
      bloquear_cadastro_novos_usuarios: data.bloquear_cadastro_novos_usuarios,
      updated_at: new Date().toISOString()
    })
    .eq("id", 1)
    .select();

  if (error) {
    console.error('❌ [SERVER] Erro ao atualizar:', error);
    return { success: false, error: error.message };
  }

  console.log('✅ [SERVER] Configurações atualizadas:', result);
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateLogoSettings(data: {
  show_sidebar_logo: boolean;
  show_sidebar_name: boolean;
  show_login_logo: boolean;
  show_login_name: boolean;
  logo_url_sidebar?: string;
  logo_url_login?: string;
  favicon_url?: string;
}) {
  const supabase = await createClient();
  
  console.log('💾 [SERVER] Salvando configurações de logo:', data);
  
  const { data: result, error } = await supabase
    .from("configuracoes_sistema")
    .update({
      show_sidebar_logo: data.show_sidebar_logo,
      show_sidebar_name: data.show_sidebar_name,
      show_login_logo: data.show_login_logo,
      show_login_name: data.show_login_name,
      logo_url_sidebar: data.logo_url_sidebar,
      logo_url_login: data.logo_url_login,
      favicon_url: data.favicon_url,
      updated_at: new Date().toISOString()
    })
    .eq("id", 1)
    .select();

  if (error) {
    console.error('❌ [SERVER] Erro ao atualizar:', error);
    return { success: false, error: error.message };
  }

  console.log('✅ [SERVER] Configurações de logo atualizadas:', result);
  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  return { success: true };
}
