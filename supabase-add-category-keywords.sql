-- Migration: Add keywords column to categoria_trasacoes
-- Purpose: Store keywords for AI-powered category identification
-- Date: 2024-12-16

-- Add keywords column (array of text)
ALTER TABLE categoria_trasacoes 
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_categories_keywords 
ON categoria_trasacoes USING GIN (keywords);

-- Add comment
COMMENT ON COLUMN categoria_trasacoes.keywords IS 'Keywords for AI-powered category identification';

-- Example update for existing categories (optional)
-- UPDATE categoria_trasacoes SET keywords = ARRAY['mercado', 'supermercado', 'feira'] WHERE descricao = 'Alimentação';
