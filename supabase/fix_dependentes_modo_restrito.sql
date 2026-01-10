-- =====================================================
-- CORREÇÃO: Permitir cadastro de dependentes no modo restrito
-- =====================================================
-- Execute esta query nos ambientes de alunos para permitir que
-- dependentes criem conta mesmo quando restringir_cadastro_usuarios_existentes = TRUE
-- 
-- Data: 10/01/2026
-- Problema: Dependentes não conseguem criar conta no modo restrito
-- Solução: Verificar usuarios_dependentes antes de bloquear e criar usuário vinculado ao principal
-- =====================================================

-- Atualizar função link_existing_user_on_signup para suportar dependentes no modo restrito
CREATE OR REPLACE FUNCTION public.link_existing_user_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    usuario_existente RECORD;
    dependente_existente RECORD;
    config_restricao BOOLEAN;
    plano_free_id INTEGER;
    dias_free INTEGER;
BEGIN
    -- Log para debug
    RAISE LOG 'Trigger executado para email: %', NEW.email;
    
    -- Buscar configuração de restrição
    SELECT restringir_cadastro_usuarios_existentes, dias_acesso_free
    INTO config_restricao, dias_free
    FROM public.configuracoes_sistema 
    ORDER BY id DESC 
    LIMIT 1;
    
    -- Se não há configuração, usar padrão (true = restrito, 7 dias)
    IF config_restricao IS NULL THEN
        config_restricao := true;
    END IF;
    
    IF dias_free IS NULL THEN
        dias_free := 7;
    END IF;
    
    RAISE LOG 'Configuração: restrição=%, dias_free=%', config_restricao, dias_free;
    
    -- Buscar usuário existente com este email
    SELECT * INTO usuario_existente
    FROM public.usuarios 
    WHERE LOWER(email) = LOWER(NEW.email);
    
    IF FOUND THEN
        -- CENÁRIO 1: Usuário existe (fluxo WhatsApp/N8N)
        RAISE LOG 'Usuário existente encontrado, vinculando auth_user';
        
        UPDATE public.usuarios 
        SET auth_user = NEW.id,
            has_password = true,
            data_ultimo_acesso = NOW(),
            ultima_atualizacao = NOW()
        WHERE LOWER(email) = LOWER(NEW.email);
        
    ELSIF NOT config_restricao THEN
        -- CENÁRIO 2: Usuário NÃO existe e modo livre (criar automaticamente)
        RAISE LOG 'Modo livre: criando usuário automaticamente';
        
        -- Buscar plano Free
        SELECT id INTO plano_free_id
        FROM public.planos_sistema 
        WHERE tipo_periodo = 'free' AND ativo = true
        ORDER BY id
        LIMIT 1;
        
        -- Se não encontrou plano free, usar null
        IF plano_free_id IS NULL THEN
            RAISE WARNING 'Plano Free não encontrado, usuário será criado sem plano';
        END IF;
        
        -- Extrair dados do raw_user_meta_data se disponível
        DECLARE
            nome_usuario TEXT;
            telefone_usuario TEXT;
        BEGIN
            nome_usuario := COALESCE(
                NEW.raw_user_meta_data->>'name',
                NEW.raw_user_meta_data->>'full_name', 
                SPLIT_PART(NEW.email, '@', 1)
            );
            
            telefone_usuario := COALESCE(
                NEW.raw_user_meta_data->>'phone',
                NEW.raw_user_meta_data->>'phone_number',
                ''
            );
            
            -- Criar usuário na tabela usuarios
            INSERT INTO public.usuarios (
                nome,
                email,
                celular,
                aceite_termos,
                data_aceite_termos,
                auth_user,
                has_password,
                plano,
                plano_id,
                status,
                data_compra,
                data_final_plano,
                dias_restantes_free,
                data_ultimo_acesso,
                created_at,
                ultima_atualizacao
            ) VALUES (
                nome_usuario,
                NEW.email,
                telefone_usuario,
                true,
                NOW(),
                NEW.id,
                true,
                'Free',
                plano_free_id,
                'ativo',
                NOW(),
                NOW() + INTERVAL '1 day' * dias_free,
                dias_free,
                NOW(),
                NOW(),
                NOW()
            );
            
            RAISE LOG 'Usuário criado com sucesso: nome=%, email=%, plano_id=%', nome_usuario, NEW.email, plano_free_id;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Erro ao criar usuário: %', SQLERRM;
            -- Não falha o trigger, apenas loga o erro
        END;
        
    ELSE
        -- CENÁRIO 3: Modo restrito - verificar se é dependente
        RAISE LOG 'Modo restrito: verificando se é dependente';
        
        -- Buscar dependente com convite pendente
        SELECT * INTO dependente_existente
        FROM public.usuarios_dependentes
        WHERE LOWER(email) = LOWER(NEW.email)
          AND convite_status = 'pendente';
        
        IF FOUND THEN
            -- CENÁRIO 3A: É dependente com convite pendente - criar usuário vinculado ao principal
            RAISE LOG 'Dependente encontrado, criando usuário vinculado ao principal';
            
            -- Buscar plano do usuário principal
            SELECT plano_id INTO plano_free_id
            FROM public.usuarios
            WHERE id = dependente_existente.usuario_principal_id;
            
            -- Extrair dados do raw_user_meta_data se disponível
            DECLARE
                nome_usuario TEXT;
                telefone_usuario TEXT;
            BEGIN
                nome_usuario := COALESCE(
                    NEW.raw_user_meta_data->>'name',
                    NEW.raw_user_meta_data->>'full_name',
                    dependente_existente.nome,
                    SPLIT_PART(NEW.email, '@', 1)
                );
                
                telefone_usuario := COALESCE(
                    NEW.raw_user_meta_data->>'phone',
                    NEW.raw_user_meta_data->>'phone_number',
                    dependente_existente.telefone,
                    ''
                );
                
                -- Criar usuário na tabela usuarios vinculado ao plano do principal
                INSERT INTO public.usuarios (
                    nome,
                    email,
                    celular,
                    aceite_termos,
                    data_aceite_termos,
                    auth_user,
                    has_password,
                    plano,
                    plano_id,
                    status,
                    data_compra,
                    data_final_plano,
                    dias_restantes_free,
                    data_ultimo_acesso,
                    created_at,
                    ultima_atualizacao
                ) VALUES (
                    nome_usuario,
                    NEW.email,
                    telefone_usuario,
                    true,
                    NOW(),
                    NEW.id,
                    true,
                    'Compartilhado',
                    plano_free_id,
                    'ativo',
                    NOW(),
                    (SELECT data_final_plano FROM public.usuarios WHERE id = dependente_existente.usuario_principal_id),
                    0,
                    NOW(),
                    NOW(),
                    NOW()
                );
                
                RAISE LOG 'Usuário dependente criado com sucesso: nome=%, email=%, plano_id=%', nome_usuario, NEW.email, plano_free_id;
                
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Erro ao criar usuário dependente: %', SQLERRM;
            END;
        ELSE
            -- CENÁRIO 3B: Modo restrito e não é dependente (não fazer nada)
            RAISE LOG 'Modo restrito: usuário não existe e não é dependente, signup falhará na validação';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- =====================================================
-- RESULTADO ESPERADO:
-- Função atualizada com sucesso
-- Agora dependentes podem criar conta mesmo no modo restrito
-- O sistema verifica em 2 tabelas:
-- 1. usuarios (fluxo WhatsApp/N8N)
-- 2. usuarios_dependentes (fluxo de convites)
-- =====================================================
