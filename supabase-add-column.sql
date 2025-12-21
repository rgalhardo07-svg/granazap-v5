-- ==============================================================================
-- CORREÇÃO: ADICIONAR COLUNA FALTANTE 'tipo_conta'
-- Execute este script no SQL Editor do Supabase
-- ==============================================================================

-- 1. Adicionar a coluna tipo_conta se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_bancarias' AND column_name = 'tipo_conta') THEN
        ALTER TABLE public.contas_bancarias ADD COLUMN tipo_conta TEXT DEFAULT 'pessoal' NOT NULL;
        
        -- 2. Adicionar Constraint de Verificação (CHECK)
        ALTER TABLE public.contas_bancarias ADD CONSTRAINT contas_bancarias_tipo_conta_check CHECK (tipo_conta IN ('pessoal', 'pj'));
        
        -- 3. Atualizar o índice composto para incluir tipo_conta (opcional, mas bom para performance)
        CREATE INDEX IF NOT EXISTS idx_contas_tipo_conta ON public.contas_bancarias(tipo_conta);
    END IF;
END $$;

-- 4. Recarregar o Schema Cache (Supabase às vezes precisa disso)
NOTIFY pgrst, 'reload config';
