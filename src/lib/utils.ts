import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Mapeamento de moeda para locale
const currencyLocales: Record<string, string> = {
  'BRL': 'pt-BR',
  'USD': 'en-US',
  'EUR': 'de-DE',
  'PYG': 'es-PY',
  'ARS': 'es-AR',
};

// Função de formatação de moeda com suporte a múltiplas moedas
export function formatCurrency(value: number, currency: 'BRL' | 'USD' | 'EUR' | 'PYG' | 'ARS' = 'BRL') {
  const locale = currencyLocales[currency] || 'pt-BR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
}
