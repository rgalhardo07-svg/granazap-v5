-- =====================================================
-- CORREÇÃO CRÍTICA: Função handle_public_user_invite_link
-- =====================================================
-- Execute esta query nos ambientes de alunos que já rodaram
-- o setup_differential_COMPLETO.sql com a função vazia
-- 
-- Data: 10/01/2026
-- Problema: Função handle_public_user_invite_link estava vazia, não vinculava dependentes
-- Solução: Implementar a lógica de vinculação por email
-- =====================================================

-- Recriar a função com a implementação correta
CREATE OR REPLACE FUNCTION handle_public_user_invite_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Atualizar usuarios_dependentes se houver convite pendente com este email
    UPDATE public.usuarios_dependentes
    SET 
        auth_user_id = NEW.auth_user,
        convite_status = 'aceito',
        data_ultima_modificacao = NOW()
    WHERE 
        LOWER(email) = LOWER(NEW.email)
        AND convite_status = 'pendente';
    
    RETURN NEW;
END;
$$;

-- =====================================================
-- RESULTADO ESPERADO:
-- Função atualizada com sucesso
-- Agora dependentes serão vinculados automaticamente quando criarem conta
-- usando o mesmo email cadastrado pelo admin
-- =====================================================
