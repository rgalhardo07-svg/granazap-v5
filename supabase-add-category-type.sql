-- Add tipo_conta column to categoria_trasacoes table
ALTER TABLE categoria_trasacoes 
ADD COLUMN IF NOT EXISTS tipo_conta text CHECK (tipo_conta IN ('pessoal', 'pj')) DEFAULT 'pessoal';

-- Update existing records to have 'pessoal' if they are null (though default handles new ones)
UPDATE categoria_trasacoes SET tipo_conta = 'pessoal' WHERE tipo_conta IS NULL;

-- Make it not null after update
ALTER TABLE categoria_trasacoes ALTER COLUMN tipo_conta SET NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_categories_tipo_conta ON categoria_trasacoes(tipo_conta);
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categoria_trasacoes(usuario_id, tipo_conta);
