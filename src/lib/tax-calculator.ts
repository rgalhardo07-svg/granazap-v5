/**
 * Calculadora de Impostos para Investimentos
 * Implementa as regras brasileiras de IR e IOF para Renda Fixa
 */

export interface TaxCalculation {
  ir: number;
  iof: number;
  totalTax: number;
  netProfit: number;
  netValue: number;
  irRate: number;
  iofRate: number;
  daysInvested: number;
}

/**
 * Calcula a alíquota de IR baseado no tempo de investimento (Renda Fixa)
 * Tabela Regressiva de IR:
 * - Até 180 dias: 22,5%
 * - 181 a 360 dias: 20%
 * - 361 a 720 dias: 17,5%
 * - Acima de 720 dias: 15%
 * 
 * NOTA: Nubank e outras instituições podem usar alíquotas ligeiramente diferentes
 * devido a arredondamentos ou regras específicas. Esta é a tabela oficial da Receita.
 */
export function getIRRate(daysInvested: number): number {
  if (daysInvested <= 180) return 0.225;
  if (daysInvested <= 360) return 0.20;
  if (daysInvested <= 720) return 0.175;
  return 0.15;
}

/**
 * Calcula a alíquota de IOF baseado no tempo de investimento
 * Tabela Regressiva de IOF (0-29 dias):
 * - Dia 1: 96%
 * - Dia 2: 93%
 * - ...
 * - Dia 29: 3%
 * - Dia 30+: 0% (isento)
 */
export function getIOFRate(daysInvested: number): number {
  if (daysInvested >= 30) return 0;
  
  // IOF regressivo: começa em 96% no dia 1 e diminui 3% por dia
  // Fórmula: (30 - dias) * 3 / 100
  const rate = ((30 - daysInvested) * 3) / 100;
  return Math.max(0, Math.min(0.96, rate));
}

/**
 * Calcula os impostos (IR e IOF) para investimentos de Renda Fixa
 * @param investedValue - Valor total investido
 * @param currentValue - Valor atual (bruto) do investimento
 * @param purchaseDate - Data da compra (ISO string ou Date)
 * @returns Objeto com detalhes dos impostos calculados
 */
export function calculateFixedIncomeTax(
  investedValue: number,
  currentValue: number,
  purchaseDate: string | Date
): TaxCalculation {
  const purchase = typeof purchaseDate === 'string' ? new Date(purchaseDate) : purchaseDate;
  const today = new Date();
  
  // Calcula dias investidos (incluindo o dia da compra)
  const diffTime = Math.abs(today.getTime() - purchase.getTime());
  const daysInvested = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  // Calcula lucro bruto
  const grossProfit = currentValue - investedValue;
  
  // Se não há lucro, não há impostos
  if (grossProfit <= 0) {
    return {
      ir: 0,
      iof: 0,
      totalTax: 0,
      netProfit: grossProfit,
      netValue: currentValue,
      irRate: 0,
      iofRate: 0,
      daysInvested,
    };
  }
  
  // Calcula alíquotas
  const irRate = getIRRate(daysInvested);
  const iofRate = getIOFRate(daysInvested);
  
  // Calcula impostos
  const ir = grossProfit * irRate;
  const iof = grossProfit * iofRate;
  const totalTax = ir + iof;
  
  // Calcula valores líquidos
  const netProfit = grossProfit - totalTax;
  const netValue = currentValue - totalTax;
  
  return {
    ir,
    iof,
    totalTax,
    netProfit,
    netValue,
    irRate,
    iofRate,
    daysInvested,
  };
}

/**
 * Formata a alíquota de imposto para exibição
 * @param rate - Alíquota (0.225 = 22.5%)
 * @returns String formatada (ex: "22,5%")
 */
export function formatTaxRate(rate: number): string {
  return `${(rate * 100).toFixed(1).replace('.', ',')}%`;
}

/**
 * Retorna a faixa de IR baseado nos dias investidos
 */
export function getIRBracket(daysInvested: number): string {
  if (daysInvested <= 180) return "Até 180 dias";
  if (daysInvested <= 360) return "181 a 360 dias";
  if (daysInvested <= 720) return "361 a 720 dias";
  return "Acima de 720 dias";
}

/**
 * Retorna se está isento de IOF
 */
export function isIOFExempt(daysInvested: number): boolean {
  return daysInvested >= 30;
}
