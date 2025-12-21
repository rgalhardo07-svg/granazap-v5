-- Migration para habilitar Compartilhamento de Conta (Equipe)
-- Adiciona colunas para vincular login e gerenciar convites
ALTER TABLE public.usuarios_dependentes
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS convite_status TEXT DEFAULT 'pendente' CHECK (convite_status IN ('pendente', 'aceito', 'recusado', 'cancelado')),
ADD COLUMN IF NOT EXISTS convite_enviado_em TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS permissoes JSONB DEFAULT '{"role": "member", "can_edit": true}'::jsonb;

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_usuarios_dependentes_auth_user ON public.usuarios_dependentes(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_dependentes_email ON public.usuarios_dependentes(email);

-- Comentários
COMMENT ON COLUMN public.usuarios_dependentes.auth_user_id IS 'ID do usuário na tabela auth.users quando o convite é aceito';
COMMENT ON COLUMN public.usuarios_dependentes.convite_status IS 'Status do convite enviado por email';

-- Trigger para atualizar status quando o usuário for criado/logar (opcional, pode ser via app)
-- Mas vamos criar uma função auxiliar para verificar permissão de acesso
CREATE OR REPLACE FUNCTION public.check_team_access(resource_user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_auth_id UUID;
    is_owner BOOLEAN;
    is_member BOOLEAN;
BEGIN
    current_auth_id := auth.uid();
    
    -- Se não estiver logado, nega
    IF current_auth_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Verifica se é o dono do recurso (link via public.usuarios)
    SELECT EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = resource_user_id 
        AND auth_user = current_auth_id
    ) INTO is_owner;

    IF is_owner THEN
        RETURN TRUE;
    END IF;

    -- Verifica se é membro da equipe (dependente com acesso)
    SELECT EXISTS (
        SELECT 1 FROM public.usuarios_dependentes ud
        WHERE ud.usuario_principal_id = resource_user_id
        AND ud.auth_user_id = current_auth_id
        AND ud.status = 'ativo'
        AND ud.convite_status = 'aceito'
    ) INTO is_member;

    RETURN is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
