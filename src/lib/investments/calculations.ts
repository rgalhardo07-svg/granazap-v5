// ==============================================================================
// FUNÇÕES DE CÁLCULO - MÓDULO DE INVESTIMENTOS
// Funções puras para cálculos financeiros
// ==============================================================================

import type { PositionDetailed, InvestmentDividend } from '@/types/investments';

/**
 * Calcula o valor investido em uma posição
 */
export function calculateInvestedValue(quantidade: number, precoMedio: number): number {
  return quantidade * precoMedio;
}

/**
 * Calcula o valor atual de uma posição
 */
export function calculateCurrentValue(
  quantidade: number,
  precoAtual: number | null,
  precoMedio: number
): number {
  const price = precoAtual || precoMedio;
  return quantidade * price;
}

/**
 * Calcula lucro/prejuízo de uma posição
 */
export function calculateProfitLoss(
  valorAtual: number,
  valorInvestido: number
): number {
  return valorAtual - valorInvestido;
}

/**
 * Calcula rentabilidade percentual de uma posição
 */
export function calculateProfitLossPercentage(
  valorAtual: number,
  valorInvestido: number
): number {
  if (valorInvestido === 0) return 0;
  return ((valorAtual / valorInvestido) - 1) * 100;
}

/**
 * Calcula o valor total de proventos de uma posição
 */
export function calculateTotalDividends(
  dividends: InvestmentDividend[],
  quantidade: number
): number {
  return dividends.reduce((total, div) => {
    return total + (div.valor_por_ativo * quantidade);
  }, 0);
}

/**
 * Calcula rentabilidade total incluindo proventos
 */
export function calculateTotalReturn(
  lucroCapital: number,
  totalProventos: number,
  valorInvestido: number
): {
  totalReturn: number;
  totalReturnPercentage: number;
} {
  const totalReturn = lucroCapital + totalProventos;
  const totalReturnPercentage = valorInvestido > 0 
    ? (totalReturn / valorInvestido) * 100 
    : 0;

  return {
    totalReturn,
    totalReturnPercentage,
  };
}

/**
 * Calcula preço médio após nova compra
 */
export function calculateNewAveragePrice(
  quantidadeAtual: number,
  precoMedioAtual: number,
  quantidadeNova: number,
  precoNovo: number
): number {
  const valorTotal = (quantidadeAtual * precoMedioAtual) + (quantidadeNova * precoNovo);
  const quantidadeTotal = quantidadeAtual + quantidadeNova;
  
  return quantidadeTotal > 0 ? valorTotal / quantidadeTotal : 0;
}

/**
 * Calcula distribuição percentual por tipo de ativo
 */
export function calculateAssetDistribution(
  positions: PositionDetailed[]
): {
  type: string;
  value: number;
  percentage: number;
  count: number;
}[] {
  const typeMap = new Map<string, { value: number; count: number }>();
  let totalValue = 0;

  positions.forEach(pos => {
    const currentValue = calculateCurrentValue(
      pos.quantidade,
      pos.current_price,
      pos.preco_medio
    );
    
    totalValue += currentValue;
    
    const current = typeMap.get(pos.asset_type) || { value: 0, count: 0 };
    typeMap.set(pos.asset_type, {
      value: current.value + currentValue,
      count: current.count + 1,
    });
  });

  const distribution = Array.from(typeMap.entries()).map(([type, data]) => ({
    type,
    value: data.value,
    percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
    count: data.count,
  }));

  return distribution.sort((a, b) => b.value - a.value);
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number, currency: string = 'BRL'): string {
  const locales: Record<string, string> = {
    'BRL': 'pt-BR',
    'USD': 'en-US',
    'EUR': 'de-DE',
    'PYG': 'es-PY',
    'ARS': 'es-AR',
  };
  
  const locale = locales[currency] || 'pt-BR';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Formata percentual
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Formata quantidade de ativos
 */
export function formatQuantity(value: number, decimals: number = 4): string {
  // Remove zeros desnecessários
  return parseFloat(value.toFixed(decimals)).toString();
}

/**
 * Valida ticker (formato básico)
 */
export function validateTicker(ticker: string): boolean {
  // Aceita letras, números e hífen
  // Ex: PETR4, MXRF11, BTC-BRL
  const regex = /^[A-Z0-9-]+$/;
  return regex.test(ticker.toUpperCase());
}

/**
 * Normaliza ticker para formato padrão
 */
export function normalizeTicker(ticker: string): string {
  return ticker.toUpperCase().trim();
}

/**
 * Calcula variação percentual entre dois valores
 */
export function calculateVariation(
  currentValue: number,
  previousValue: number
): number {
  if (previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * Determina cor baseada em valor positivo/negativo
 */
export function getValueColor(value: number): string {
  if (value > 0) return 'text-green-400';
  if (value < 0) return 'text-red-400';
  return 'text-zinc-400';
}

/**
 * Determina cor de fundo baseada em valor positivo/negativo
 */
export function getValueBgColor(value: number): string {
  if (value > 0) return 'bg-green-500/10';
  if (value < 0) return 'bg-red-500/10';
  return 'bg-zinc-500/10';
}
