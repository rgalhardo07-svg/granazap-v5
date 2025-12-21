-- ==============================================================================
-- SCHEMA PARA GESTÃO DE CONTAS BANCÁRIAS
-- Execute este script no SQL Editor do Supabase para criar a estrutura necessária.
-- ==============================================================================

-- 1. Tabela de Contas Bancárias
CREATE TABLE IF NOT EXISTS public.contas_bancarias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    banco TEXT,
    saldo_atual NUMERIC(15,2) DEFAULT 0.00,
    tipo_conta TEXT NOT NULL CHECK (tipo_conta IN ('pessoal', 'pj')),
    is_default BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_contas_usuario ON public.contas_bancarias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_contas_tipo ON public.contas_bancarias(tipo_conta);
CREATE INDEX IF NOT EXISTS idx_contas_archived ON public.contas_bancarias(is_archived);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança (RLS)
-- Permitir SELECT apenas para o dono da conta
CREATE POLICY "Usuarios podem ver suas proprias contas"
    ON public.contas_bancarias
    FOR SELECT
    USING (auth.uid() = usuario_id);

-- Permitir INSERT apenas com seu próprio ID
CREATE POLICY "Usuarios podem criar suas proprias contas"
    ON public.contas_bancarias
    FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

-- Permitir UPDATE apenas nas suas próprias contas
CREATE POLICY "Usuarios podem atualizar suas proprias contas"
    ON public.contas_bancarias
    FOR UPDATE
    USING (auth.uid() = usuario_id);

-- Permitir DELETE apenas nas suas próprias contas
CREATE POLICY "Usuarios podem excluir suas proprias contas"
    ON public.contas_bancarias
    FOR DELETE
    USING (auth.uid() = usuario_id);

-- 5. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS on_update_contas_bancarias ON public.contas_bancarias;
CREATE TRIGGER on_update_contas_bancarias
    BEFORE UPDATE ON public.contas_bancarias
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- 6. Garantir permissões básicas
GRANT ALL ON public.contas_bancarias TO authenticated;
GRANT ALL ON public.contas_bancarias TO service_role;
