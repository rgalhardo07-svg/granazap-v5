"use client";

import { useUser } from "./use-user";
import { useTeamMembers } from "./use-team-members";

export interface Permissions {
  pode_ver_dados_admin: boolean;
  pode_ver_outros_membros: boolean;
  pode_criar_transacoes: boolean;
  pode_editar_transacoes: boolean;
  pode_deletar_transacoes: boolean;
  pode_ver_relatorios: boolean;
  pode_gerenciar_contas: boolean;
  pode_gerenciar_cartoes: boolean;
  pode_convidar_membros: boolean;
  nivel_acesso: 'basico' | 'intermediario' | 'avancado';
}

const defaultPermissions: Permissions = {
  pode_ver_dados_admin: true,
  pode_ver_outros_membros: true,
  pode_criar_transacoes: true,
  pode_editar_transacoes: true,
  pode_deletar_transacoes: true,
  pode_ver_relatorios: true,
  pode_gerenciar_contas: true,
  pode_gerenciar_cartoes: true,
  pode_convidar_membros: true,
  nivel_acesso: 'avancado'
};

export function usePermissions() {
  const { profile } = useUser();
  const { data: members } = useTeamMembers();

  // Se for usuário principal (admin), tem todas as permissões
  if (!profile?.is_dependente) {
    return {
      permissions: defaultPermissions,
      isAdmin: true,
      canView: () => true,
      canEdit: () => true,
      canDelete: () => true,
      canCreate: () => true,
      canManageAccounts: () => true,
      canManageCards: () => true,
      canInviteMembers: () => true,
      canViewReports: () => true,
      canViewAdminData: () => true,
      canViewOtherMembers: () => true,
    };
  }

  // Se for dependente, buscar suas permissões
  const myData = members?.find(m => m.id === profile.dependente_id);
  const permissions: Permissions = myData?.permissoes || {
    pode_ver_dados_admin: true,
    pode_ver_outros_membros: false,
    pode_criar_transacoes: true,
    pode_editar_transacoes: true,
    pode_deletar_transacoes: false,
    pode_ver_relatorios: true,
    pode_gerenciar_contas: false,
    pode_gerenciar_cartoes: false,
    pode_convidar_membros: false,
    nivel_acesso: 'basico'
  };

  return {
    permissions,
    isAdmin: false,
    canView: () => permissions.pode_ver_dados_admin,
    canEdit: () => permissions.pode_editar_transacoes,
    canDelete: () => permissions.pode_deletar_transacoes,
    canCreate: () => permissions.pode_criar_transacoes,
    canManageAccounts: () => permissions.pode_gerenciar_contas,
    canManageCards: () => permissions.pode_gerenciar_cartoes,
    canInviteMembers: () => false, // Sempre false para dependentes
    canViewReports: () => permissions.pode_ver_relatorios,
    canViewAdminData: () => permissions.pode_ver_dados_admin,
    canViewOtherMembers: () => permissions.pode_ver_outros_membros,
  };
}
