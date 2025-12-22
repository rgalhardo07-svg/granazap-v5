-- Adicionar coluna is_transferencia na tabela transacoes
-- Esta coluna marca transações que são transferências entre contas
-- para que possam ser filtradas do dashboard e relatórios

ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS is_transferencia BOOLEAN DEFAULT FALSE;

-- Criar índice para melhorar performance nas queries
CREATE INDEX IF NOT EXISTS idx_transacoes_is_transferencia 
ON transacoes(is_transferencia);

-- Atualizar transações existentes que são transferências
-- (baseado na categoria "Transferência")
UPDATE transacoes 
SET is_transferencia = TRUE
WHERE categoria_id IN (
  SELECT id 
  FROM categoria_trasacoes 
  WHERE descricao = 'Transferência'
);

COMMENT ON COLUMN transacoes.is_transferencia IS 'Indica se a transação é uma transferência entre contas (não deve contar como receita/despesa real)';
