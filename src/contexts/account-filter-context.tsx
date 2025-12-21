"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type AccountFilter = "pessoal" | "pj";

interface AccountFilterContextType {
  filter: AccountFilter;
  changeFilter: (filter: AccountFilter) => void;
  isPessoal: boolean;
  isPJ: boolean;
}

const AccountFilterContext = createContext<AccountFilterContextType | undefined>(undefined);

export function AccountFilterProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilter] = useState<AccountFilter>("pessoal");

  useEffect(() => {
    // Carregar filtro do localStorage na inicialização
    const saved = localStorage.getItem('account_filter') as AccountFilter;
    if (saved && ['pessoal', 'pj'].includes(saved)) {
      setFilter(saved);
    }
  }, []);

  const changeFilter = (newFilter: AccountFilter) => {
    setFilter(newFilter);
    localStorage.setItem('account_filter', newFilter);
    
    // Disparar evento para compatibilidade com código legado que possa ouvir o evento
    // (embora devêssemos migrar tudo para o contexto)
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('accountFilterChange', { detail: newFilter }));
    }
  };

  return (
    <AccountFilterContext.Provider 
      value={{ 
        filter, 
        changeFilter,
        isPessoal: filter === "pessoal",
        isPJ: filter === "pj"
      }}
    >
      {children}
    </AccountFilterContext.Provider>
  );
}

export function useAccountFilterContext() {
  const context = useContext(AccountFilterContext);
  if (context === undefined) {
    throw new Error("useAccountFilterContext must be used within a AccountFilterProvider");
  }
  return context;
}
