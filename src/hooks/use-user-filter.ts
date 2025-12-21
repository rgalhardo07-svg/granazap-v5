"use client";

import { create } from 'zustand';
import { useUser } from './use-user';

interface UserFilterState {
  filter: 'todos' | 'principal' | number; // 'todos', 'principal', ou dependente_id
  setFilter: (filter: 'todos' | 'principal' | number) => void;
}

export const useUserFilterStore = create<UserFilterState>((set) => ({
  filter: 'todos',
  setFilter: (filter) => set({ filter }),
}));

export function useUserFilter() {
  const { profile } = useUser();
  const { filter, setFilter } = useUserFilterStore();

  // Determinar se é dependente
  const isDependente = profile?.is_dependente || false;
  const dependenteId = profile?.dependente_id;

  // CORREÇÃO: Proprietários PODEM usar o filtro!
  // Proprietários: filtro funciona normalmente para ver "Todos", "Meus", ou membros individuais
  // Dependentes: filtro baseado nas permissões
  return {
    filter,
    setFilter,
    canFilter: true,
    isDependente,
    dependenteId,
  };
}
