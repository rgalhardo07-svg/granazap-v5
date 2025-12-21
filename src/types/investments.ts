// ==============================================================================
// TIPOS E INTERFACES - MÓDULO DE INVESTIMENTOS
// ==============================================================================

export type AssetType = 'acao' | 'fii' | 'etf' | 'renda_fixa' | 'cripto' | 'bdr';
export type PriceSource = 'brapi' | 'manual' | 'fallback' | 'binance';
export type DividendType = 'dividendo' | 'jcp' | 'rendimento' | 'amortizacao';
export type TipoConta = 'pessoal' | 'pj';

// ==============================================================================
// INVESTMENT ASSET (Ativo centralizado)
// ==============================================================================
export interface InvestmentAsset {
  id: string;
  ticker: string;
  name: string | null;
  type: AssetType;
  current_price: number | null;
  previous_close: number | null;
  last_updated: string | null;
  source: PriceSource;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==============================================================================
// INVESTMENT POSITION (Posição do usuário)
// ==============================================================================
export interface InvestmentPosition {
  id: string;
  usuario_id: string;
  asset_id: string;
  conta_id: string | null;
  quantidade: number;
  preco_medio: number;
  data_compra: string;
  tipo_conta: TipoConta;
  observacao: string | null;
  is_manual_price: boolean;
  manual_price: number | null;
  yield_percentage: number | null; // Rentabilidade contratada (ex: 100 = 100% CDI)
  use_manual_tax?: boolean; // Se true, usa valores manuais de impostos
  manual_ir?: number | null; // Valor manual de IR
  manual_iof?: number | null; // Valor manual de IOF
  created_at: string;
  updated_at: string;
  
  // Relacionamentos (quando incluídos na query)
  investment_asset?: InvestmentAsset;
  conta_bancaria?: {
    id: string;
    nome: string;
  };
}

// ==============================================================================
// INVESTMENT DIVIDEND (Provento)
// ==============================================================================
export interface InvestmentDividend {
  id: string;
  position_id: string;
  tipo: DividendType;
  valor_por_ativo: number;
  data_com: string | null;
  data_pagamento: string;
  observacao: string | null;
  created_at: string;
  
  // Relacionamentos (quando incluídos na query)
  investment_position?: InvestmentPosition;
}

// ==============================================================================
// POSITION DETAILED (View com cálculos)
// ==============================================================================
export interface PositionDetailed extends InvestmentPosition {
  // Dados do ativo
  ticker: string;
  asset_name: string | null;
  asset_type: AssetType;
  current_price: number | null;
  previous_close: number | null;
  price_last_updated: string | null;
  price_source: PriceSource;
  
  // Cálculos
  valor_investido: number;
  valor_atual: number;
  lucro_prejuizo: number;
  rentabilidade_percentual: number;
}

// ==============================================================================
// PORTFOLIO SUMMARY (Resumo da carteira)
// ==============================================================================
export interface PortfolioSummary {
  usuario_id: string;
  tipo_conta: TipoConta;
  total_ativos: number;
  valor_investido: number;
  valor_atual: number;
  lucro_prejuizo: number;
  rentabilidade_percentual: number;
}

// ==============================================================================
// DIVIDENDS SUMMARY (Resumo de proventos)
// ==============================================================================
export interface DividendsSummary {
  usuario_id: string;
  tipo_conta: TipoConta;
  total_proventos: number;
  valor_total_proventos: number;
  ano: number;
  mes: number;
}

// ==============================================================================
// FORMS E INPUTS
// ==============================================================================

export interface CreateAssetInput {
  ticker: string;
  name?: string;
  type: AssetType;
  source: PriceSource;
  current_price?: number;
}

export interface CreatePositionInput {
  asset_id: string;
  conta_id?: string;
  quantidade: number;
  preco_medio: number;
  data_compra: string;
  tipo_conta: TipoConta;
  is_manual_price?: boolean;
  manual_price?: number;
  observacao?: string;
  yield_percentage?: number; // Rentabilidade para Renda Fixa
}

export interface UpdatePositionInput {
  quantidade?: number;
  preco_medio?: number;
  data_compra?: string;
  is_manual_price?: boolean;
  manual_price?: number;
  observacao?: string;
  yield_percentage?: number; // Rentabilidade para Renda Fixa
}

export interface CreateDividendInput {
  position_id: string;
  tipo: DividendType;
  valor_por_ativo: number;
  data_com?: string;
  data_pagamento: string;
  observacao?: string;
}

// ==============================================================================
// API RESPONSES
// ==============================================================================

export interface InvestmentAccessInfo {
  hasAccess: boolean;
  plan: string;
  maxAssets: number;
  currentAssets: number;
  canAddMore: boolean;
}

export interface PortfolioStats {
  totalAssets: number;
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  totalDividends: number;
  
  // Por tipo de ativo
  byType: {
    type: AssetType;
    count: number;
    invested: number;
    currentValue: number;
    percentage: number;
  }[];
}

// ==============================================================================
// BRAPI API TYPES
// ==============================================================================

export interface BrapiQuoteResult {
  symbol: string;
  shortName: string;
  longName: string;
  currency: string;
  regularMarketPrice: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketDayRange: string;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime: string;
  marketCap: number;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  averageDailyVolume10Day: number;
  averageDailyVolume3Month: number;
  fiftyTwoWeekLowChange: number;
  fiftyTwoWeekLowChangePercent: number;
  fiftyTwoWeekRange: string;
  fiftyTwoWeekHighChange: number;
  fiftyTwoWeekHighChangePercent: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  twoHundredDayAverage: number;
  twoHundredDayAverageChange: number;
  twoHundredDayAverageChangePercent: number;
}

export interface BrapiQuoteResponse {
  results: BrapiQuoteResult[];
  requestedAt: string;
  took: string;
}

// ==============================================================================
// PLAN FEATURES
// ==============================================================================

export interface InvestmentPlanFeatures {
  enabled: boolean;
  maxAssets: number; // -1 = ilimitado
  autoUpdate: boolean;
  dividendTracking: boolean;
}
