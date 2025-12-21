// ==============================================================================
// VALIDAÇÕES - MÓDULO DE INVESTIMENTOS
// Funções de validação de inputs e regras de negócio
// ==============================================================================

import type { CreatePositionInput, CreateAssetInput, CreateDividendInput } from '@/types/investments';

/**
 * Valida input de criação de ativo
 */
export function validateCreateAsset(input: CreateAssetInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Ticker obrigatório
  if (!input.ticker || input.ticker.trim() === '') {
    errors.push('Ticker é obrigatório');
  } else if (input.ticker.length > 20) {
    errors.push('Ticker deve ter no máximo 20 caracteres');
  } else if (!/^[A-Z0-9-]+$/i.test(input.ticker)) {
    errors.push('Ticker deve conter apenas letras, números e hífen');
  }

  // Tipo obrigatório
  if (!input.type) {
    errors.push('Tipo de ativo é obrigatório');
  }

  // Source obrigatório
  if (!input.source) {
    errors.push('Fonte do preço é obrigatória');
  }

  // Se fonte for manual, preço é obrigatório
  if (input.source === 'manual' && !input.current_price) {
    errors.push('Preço é obrigatório para ativos manuais');
  }

  // Preço deve ser positivo
  if (input.current_price !== undefined && input.current_price <= 0) {
    errors.push('Preço deve ser maior que zero');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida input de criação de posição
 */
export function validateCreatePosition(input: CreatePositionInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Asset ID obrigatório
  if (!input.asset_id || input.asset_id.trim() === '') {
    errors.push('Ativo é obrigatório');
  }

  // Quantidade obrigatória e positiva
  if (!input.quantidade || input.quantidade <= 0) {
    errors.push('Quantidade deve ser maior que zero');
  }

  // Preço médio obrigatório e positivo
  if (!input.preco_medio || input.preco_medio <= 0) {
    errors.push('Preço médio deve ser maior que zero');
  }

  // Data de compra obrigatória
  if (!input.data_compra || input.data_compra.trim() === '') {
    errors.push('Data de compra é obrigatória');
  } else {
    // Validar formato de data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input.data_compra)) {
      errors.push('Data de compra deve estar no formato YYYY-MM-DD');
    } else {
      // Validar se é data válida
      const date = new Date(input.data_compra);
      if (isNaN(date.getTime())) {
        errors.push('Data de compra inválida');
      }
      // Não permitir data futura
      if (date > new Date()) {
        errors.push('Data de compra não pode ser futura');
      }
    }
  }

  // Tipo de conta obrigatório
  if (!input.tipo_conta) {
    errors.push('Tipo de conta é obrigatório');
  }

  // Se preço manual, validar
  if (input.is_manual_price) {
    if (!input.manual_price || input.manual_price <= 0) {
      errors.push('Preço manual deve ser maior que zero');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida input de criação de provento
 */
export function validateCreateDividend(input: CreateDividendInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Position ID obrigatório
  if (!input.position_id || input.position_id.trim() === '') {
    errors.push('Posição é obrigatória');
  }

  // Tipo obrigatório
  if (!input.tipo) {
    errors.push('Tipo de provento é obrigatório');
  }

  // Valor por ativo obrigatório e positivo
  if (!input.valor_por_ativo || input.valor_por_ativo <= 0) {
    errors.push('Valor por ativo deve ser maior que zero');
  }

  // Data de pagamento obrigatória
  if (!input.data_pagamento || input.data_pagamento.trim() === '') {
    errors.push('Data de pagamento é obrigatória');
  } else {
    // Validar formato de data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input.data_pagamento)) {
      errors.push('Data de pagamento deve estar no formato YYYY-MM-DD');
    } else {
      const date = new Date(input.data_pagamento);
      if (isNaN(date.getTime())) {
        errors.push('Data de pagamento inválida');
      }
    }
  }

  // Data COM (se fornecida)
  if (input.data_com) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input.data_com)) {
      errors.push('Data COM deve estar no formato YYYY-MM-DD');
    } else {
      const dataCom = new Date(input.data_com);
      const dataPagamento = new Date(input.data_pagamento);
      
      if (isNaN(dataCom.getTime())) {
        errors.push('Data COM inválida');
      }
      
      // Data COM deve ser anterior à data de pagamento
      if (dataCom > dataPagamento) {
        errors.push('Data COM deve ser anterior à data de pagamento');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida se usuário pode adicionar mais ativos
 */
export function validateAssetLimit(
  currentAssets: number,
  maxAssets: number
): {
  canAdd: boolean;
  message?: string;
} {
  // -1 = ilimitado
  if (maxAssets === -1) {
    return { canAdd: true };
  }

  if (currentAssets >= maxAssets) {
    return {
      canAdd: false,
      message: `Limite de ${maxAssets} ativos atingido. Faça upgrade do plano para adicionar mais.`,
    };
  }

  return { canAdd: true };
}

/**
 * Sanitiza input de texto
 */
export function sanitizeText(text: string): string {
  return text.trim().replace(/[<>]/g, '');
}

/**
 * Valida UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
