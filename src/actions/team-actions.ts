"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function inviteMember(formData: {
  nome: string;
  email: string;
  telefone: string;
}) {
  const supabase = await createClient();

  // 1. Verificar Usuário Atual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Usuário não autenticado" };
  }

  // 2. Buscar Perfil e Plano
  const { data: profile } = await supabase
    .from("usuarios")
    .select("id, plano_id")
    .eq("auth_user", user.id)
    .single();

  if (!profile) {
    return { success: false, error: "Perfil não encontrado" };
  }

  // 3. Verificar se usuário tem plano
  if (!profile.plano_id) {
    return {
      success: false,
      error: "Você precisa ter um plano ativo para adicionar membros na equipe.",
    };
  }

  // 4. Buscar Detalhes do Plano
  const { data: plano } = await supabase
    .from("planos_sistema")
    .select("permite_compartilhamento, max_usuarios_dependentes")
    .eq("id", profile.plano_id)
    .single();

  if (!plano?.permite_compartilhamento) {
    return {
      success: false,
      error: "Seu plano atual não permite adicionar membros na equipe.",
    };
  }

  // 5. Verificar Limite de Usuários
  const { count } = await supabase
    .from("usuarios_dependentes")
    .select("*", { count: "exact", head: true })
    .eq("usuario_principal_id", profile.id)
    .eq("status", "ativo");

  // max_usuarios_dependentes = -1 significa ilimitado
  if (
    plano.max_usuarios_dependentes !== -1 &&
    (count || 0) >= plano.max_usuarios_dependentes
  ) {
    return {
      success: false,
      error: `Você atingiu o limite de ${plano.max_usuarios_dependentes} membros do seu plano.`,
    };
  }

  // 6. Verificar se e-mail já foi convidado
  const { data: existingInvite } = await supabase
    .from("usuarios_dependentes")
    .select("id")
    .eq("usuario_principal_id", profile.id)
    .eq("email", formData.email)
    .single();

  if (existingInvite) {
    return { success: false, error: "Este e-mail já foi adicionado à sua equipe." };
  }

  // 7. Inserir na tabela usuarios_dependentes (Pré-convite)
  const { error: insertError } = await supabase
    .from("usuarios_dependentes")
    .insert({
      usuario_principal_id: profile.id,
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone,
      status: "ativo",
      convite_status: "pendente",
    });

  if (insertError) {
    return { success: false, error: "Erro ao salvar dados do membro: " + insertError.message };
  }

  // 8. Fluxo de Convite Passivo
  // Não enviamos e-mail automático via sistema para evitar uso de chaves administrativas.
  // O trigger 'on_auth_user_created_link_invite' no banco cuidará de vincular
  // o usuário quando ele criar a conta com este e-mail.

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateMemberPermissions(memberId: number, permissoes: any) {
  const supabase = await createClient();
  
  console.log('💾 Salvando permissões:', { memberId, permissoes });
  
  // Atualizar permissões do membro
  const { data, error } = await supabase
    .from("usuarios_dependentes")
    .update({ permissoes })
    .eq("id", memberId)
    .select();

  if (error) {
    console.error('❌ Erro ao salvar:', error);
    return { success: false, error: error.message };
  }

  console.log('✅ Permissões salvas:', data);
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateMemberInfo(memberId: number, data: { nome: string; email: string; telefone: string }) {
  const supabase = await createClient();
  
  console.log('💾 Atualizando cadastro:', { memberId, data });
  
  const { error } = await supabase
    .from("usuarios_dependentes")
    .update({
      nome: data.nome,
      email: data.email,
      telefone: data.telefone
    })
    .eq("id", memberId);

  if (error) {
    console.error('❌ Erro ao atualizar:', error);
    return { success: false, error: error.message };
  }

  console.log('✅ Cadastro atualizado');
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function toggleMemberStatus(memberId: number, currentStatus: string) {
  const supabase = await createClient();
  
  const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
  console.log('🔄 Alterando status:', { memberId, de: currentStatus, para: newStatus });
  
  const { error } = await supabase
    .from("usuarios_dependentes")
    .update({ status: newStatus })
    .eq("id", memberId);

  if (error) {
    console.error('❌ Erro ao alterar status:', error);
    return { success: false, error: error.message };
  }

  console.log('✅ Status alterado');
  revalidatePath("/dashboard/settings");
  return { success: true, newStatus };
}

export async function removeMember(memberId: number) {
  const supabase = await createClient();
  
  // Verificação básica de segurança (RLS deve garantir o resto)
  const { error } = await supabase
    .from("usuarios_dependentes")
    .delete() // Ou update status = 'inativo' para soft delete
    .eq("id", memberId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
