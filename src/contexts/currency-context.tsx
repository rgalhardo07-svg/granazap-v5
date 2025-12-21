"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useUser } from "@/hooks/use-user";

type Currency = 'BRL' | 'USD' | 'EUR' | 'PYG' | 'ARS';

interface CurrencyContextType {
  currency: Currency;
  formatCurrency: (value: number) => string;
  getCurrencySymbol: () => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Mapeamento de moeda para locale
const currencyLocales: Record<Currency, string> = {
  'BRL': 'pt-BR',
  'USD': 'en-US',
  'EUR': 'de-DE',
  'PYG': 'es-PY',
  'ARS': 'es-AR',
};

// Símbolos de moeda
const currencySymbols: Record<Currency, string> = {
  'BRL': 'R$',
  'USD': '$',
  'EUR': '€',
  'PYG': '₲',
  'ARS': '$',
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { profile } = useUser();
  
  // Pegar moeda do perfil ou usar BRL como padrão
  const currency: Currency = profile?.moeda || 'BRL';

  const formatCurrency = (value: number): string => {
    const locale = currencyLocales[currency];
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const getCurrencySymbol = (): string => {
    return currencySymbols[currency];
  };

  return (
    <CurrencyContext.Provider value={{ currency, formatCurrency, getCurrencySymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
