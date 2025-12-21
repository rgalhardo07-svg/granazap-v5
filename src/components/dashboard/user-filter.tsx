"use client";

import { Users, User, ChevronDown } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useUserFilter } from "@/hooks/use-user-filter";
import { useTeamMembers } from "@/hooks/use-team-members";
import { useLanguage } from "@/contexts/language-context";
import { useState, useRef, useEffect } from "react";

export function UserFilter() {
  const { t } = useLanguage();
  const { profile } = useUser();
  const { filter, setFilter, isDependente } = useUserFilter();
  const { data: teamMembers = [] } = useTeamMembers();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Buscar permissões do dependente
  const myPermissions = isDependente 
    ? teamMembers?.find(m => m.id === profile?.dependente_id)?.permissoes
    : null;

  const canViewAdminData = !isDependente || myPermissions?.pode_ver_dados_admin === true;
  const canViewOtherMembers = !isDependente || myPermissions?.pode_ver_outros_membros === true;

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obter nome do filtro atual
  const getFilterLabel = () => {
    if (filter === 'todos') return t('userFilter.all');
    if (filter === 'principal') {
      return isDependente ? t('userFilter.principal') : t('userFilter.mine');
    }
    if (typeof filter === 'number') {
      const member = teamMembers.find(m => m.id === filter);
      return member?.nome.split(' ')[0] || t('userFilter.member');
    }
    return t('userFilter.all');
  };

  // Se não tem permissão para ver dados do admin E não pode ver outros membros
  // Só mostra "Meus" (não precisa de filtro)
  if (isDependente && !canViewAdminData && !canViewOtherMembers) {
    return null; // Não mostrar filtro, só vê seus próprios dados
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão Principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-zinc-900/50 border border-zinc-800 text-white hover:bg-zinc-800"
      >
        <Users className="w-4 h-4" />
        {getFilterLabel()}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 py-1">
          {/* Todos - Só mostra se tiver permissão para ver admin OU outros membros */}
          {(canViewAdminData || canViewOtherMembers) && (
            <button
              onClick={() => {
                setFilter('todos');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                filter === 'todos'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Users className="w-4 h-4" />
              {t('userFilter.all')}
            </button>
          )}

          {/* Principal - Só mostra se tiver permissão para ver dados do admin */}
          {canViewAdminData && (
            <button
              onClick={() => {
                setFilter('principal');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                filter === 'principal'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <User className="w-4 h-4" />
              {isDependente ? t('userFilter.principal') : t('userFilter.mine')}
            </button>
          )}

          {/* Meus - Sempre mostrar para dependentes */}
          {isDependente && (
            <button
              onClick={() => {
                setFilter(profile?.dependente_id || 0);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                filter === profile?.dependente_id
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <User className="w-4 h-4" />
              {t('userFilter.mine')}
            </button>
          )}

          {/* Membros da Equipe - Só mostra se tiver permissão para ver outros membros */}
          {canViewOtherMembers && teamMembers.length > 0 && (
            <>
              <div className="border-t border-zinc-800 my-1" />
              <div className="px-3 py-1 text-xs text-zinc-500 font-medium">
                Equipe ({teamMembers.length})
              </div>
              {teamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    setFilter(member.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    filter === member.id
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="truncate">{member.nome}</span>
                  {member.convite_status === 'pendente' && (
                    <span className="ml-auto text-xs text-yellow-500">Pendente</span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
