-- =====================================================
-- CORREÇÃO: Função verificar_meu_acesso para Dependentes
-- =====================================================
-- Data: 10/01/2026
-- Problema: Dependentes sem registro em usuarios eram bloqueados
-- Causa: verificar_meu_acesso buscava apenas em usuarios
-- Solução: Buscar também em usuarios_dependentes e retornar dados do principal
-- 
-- ⚠️ IMPORTANTE: Execute este arquivo em ambientes que já rodaram setup.sql
-- =====================================================

CREATE OR REPLACE FUNCTION public.verificar_meu_acesso()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_id INTEGER;
    acesso_info JSONB;
    dias_restantes INTEGER;
    tem_acesso BOOLEAN;
    usuario_record RECORD;
    plano_atual TEXT;
    plano_nome_atual TEXT;
    plano_detalhes JSONB;
BEGIN
    -- Buscar o ID numérico do usuário logado com informações do plano
    SELECT 
        u.id, 
        u.status, 
        u.plano as plano_legado, 
        u.plano_id,
        u.is_admin, 
        u.data_final_plano,
        p.nome::TEXT as plano_nome,
        p.tipo_periodo,
        p.valor,
        p.recursos
    INTO usuario_record
    FROM public.usuarios u
    LEFT JOIN public.planos_sistema p ON u.plano_id = p.id
    WHERE u.auth_user = auth.uid();
    
    -- Se não encontrou em usuarios, verificar se é dependente
    IF NOT FOUND THEN
        -- Buscar dependente e dados do principal
        SELECT 
            u.id, 
            u.status, 
            u.plano as plano_legado, 
            u.plano_id,
            u.is_admin, 
            u.data_final_plano,
            p.nome::TEXT as plano_nome,
            p.tipo_periodo,
            p.valor,
            p.recursos
        INTO usuario_record
        FROM public.usuarios_dependentes d
        INNER JOIN public.usuarios u ON u.id = d.usuario_principal_id
        LEFT JOIN public.planos_sistema p ON u.plano_id = p.id
        WHERE d.auth_user_id = auth.uid()
          AND d.status = 'ativo';
        
        -- Se ainda não encontrou, retornar erro
        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'hasAccess', false,
                'isAdmin', false,
                'plan', null,
                'planName', null,
                'planDetails', null,
                'daysRemaining', 0,
                'needsUpgrade', true,
                'isBlocked', true,
                'dataFinalPlano', null,
                'message', 'Usuário não encontrado'
            );
        END IF;
    END IF;
    
    -- Calcular informações de acesso
    dias_restantes := calcular_dias_restantes_free(usuario_record.id);
    tem_acesso := usuario_tem_acesso_ativo(usuario_record.id);
    
    -- Determinar o plano atual (priorizar FK sobre legado)
    IF usuario_record.plano_id IS NOT NULL AND usuario_record.plano_nome IS NOT NULL THEN
        -- Usar plano vinculado via FK
        plano_atual := usuario_record.tipo_periodo;
        plano_nome_atual := usuario_record.plano_nome;
        plano_detalhes := jsonb_build_object(
            'id', usuario_record.plano_id,
            'nome', usuario_record.plano_nome,
            'valor', COALESCE(usuario_record.valor, 0),
            'recursos', COALESCE(usuario_record.recursos, '[]'::jsonb)
        );
    ELSE
        -- Fallback para plano legado
        plano_atual := COALESCE(usuario_record.plano_legado, 'free');
        plano_nome_atual := CASE 
            WHEN plano_atual = 'Premium' THEN 'Plano Premium'
            WHEN plano_atual = 'free' THEN 'Plano Free'
            ELSE plano_atual
        END;
        plano_detalhes := NULL;
    END IF;
    
    -- Montar resposta
    acesso_info := jsonb_build_object(
        'hasAccess', tem_acesso,
        'isAdmin', COALESCE(usuario_record.is_admin, false),
        'plan', plano_atual,
        'planName', plano_nome_atual,
        'planDetails', plano_detalhes,
        'daysRemaining', dias_restantes,
        'needsUpgrade', (dias_restantes >= 0 AND dias_restantes <= 3 AND NOT COALESCE(usuario_record.is_admin, false)),
        'isBlocked', (usuario_record.status != 'ativo' OR NOT tem_acesso),
        'dataFinalPlano', usuario_record.data_final_plano,
        'userId', usuario_record.id
    );
    
    -- Atualizar último acesso
    UPDATE public.usuarios 
    SET data_ultimo_acesso = NOW()
    WHERE id = usuario_record.id;
    
    RETURN acesso_info;
END;
$$;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- 1. Dependentes sem registro em usuarios NÃO serão bloqueados
-- 2. verificar_meu_acesso retornará dados do plano do principal para dependentes
-- 3. Dependentes terão acesso enquanto plano do principal estiver ativo
-- 4. useSubscriptionStatus e middleware funcionarão corretamente para dependentes
-- =====================================================
