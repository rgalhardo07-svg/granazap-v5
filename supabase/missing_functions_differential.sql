-- =====================================================
-- FUNÇÕES FALTANTES NO SETUP_DIFFERENTIAL_COMPLETO.SQL
-- =====================================================
-- Data de Geração: 07/01/2026
-- Projeto: vrmickfxoxvyljounoxq
-- 
-- Este arquivo contém APENAS as funções que existem no Supabase
-- mas NÃO estão documentadas no setup_differential_COMPLETO.sql
-- =====================================================

-- =====================================================
-- 1. FUNÇÕES DE CONFIGURAÇÃO DO SISTEMA
-- =====================================================

-- 1.1 Função: get_system_settings
CREATE OR REPLACE FUNCTION get_system_settings()
RETURNS TABLE(
    app_name text, 
    app_logo_url text, 
    primary_color text, 
    secondary_color text, 
    support_email text, 
    habilitar_modo_pj boolean, 
    bloquear_cadastro_novos_usuarios boolean, 
    show_sidebar_logo boolean, 
    show_sidebar_name boolean, 
    show_login_logo boolean, 
    show_login_name boolean, 
    logo_url_sidebar text, 
    logo_url_login text, 
    favicon_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    company_name::TEXT as app_name,
    logo_url::TEXT as app_logo_url,
    configuracoes_sistema.primary_color::TEXT,
    configuracoes_sistema.secondary_color::TEXT,
    configuracoes_sistema.support_email::TEXT,
    configuracoes_sistema.habilitar_modo_pj,
    configuracoes_sistema.bloquear_cadastro_novos_usuarios,
    configuracoes_sistema.show_sidebar_logo,
    configuracoes_sistema.show_sidebar_name,
    configuracoes_sistema.show_login_logo,
    configuracoes_sistema.show_login_name,
    configuracoes_sistema.logo_url_sidebar::TEXT,
    configuracoes_sistema.logo_url_login::TEXT,
    configuracoes_sistema.favicon_url::TEXT
  FROM configuracoes_sistema
  WHERE id = 1;
END;
$$;

COMMENT ON FUNCTION get_system_settings IS 'Retorna todas as configurações do sistema para uso no frontend';

-- 1.2 Função: update_system_settings
CREATE OR REPLACE FUNCTION update_system_settings(
    p_app_name text, 
    p_app_logo_url text, 
    p_primary_color text, 
    p_secondary_color text, 
    p_support_email text
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id UUID;
    is_user_admin BOOLEAN := FALSE;
BEGIN
    -- Verificar se o usuário atual é admin
    current_user_id := auth.uid();
    
    SELECT usuarios.is_admin INTO is_user_admin
    FROM public.usuarios 
    WHERE usuarios.auth_user = current_user_id;
    
    IF NOT is_user_admin THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
    END IF;
    
    -- Atualizar configurações (sempre id = 1, pois só há um registro)
    UPDATE public.configuracoes_sistema
    SET 
        company_name = p_app_name,
        logo_url = p_app_logo_url,
        primary_color = p_primary_color,
        secondary_color = p_secondary_color,
        support_email = p_support_email,
        updated_at = NOW()
    WHERE id = 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Configurações não encontradas'::TEXT;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT true, 'Configurações atualizadas com sucesso'::TEXT;
END;
$$;

COMMENT ON FUNCTION update_system_settings IS 'Atualiza configurações do sistema (apenas admin)';

-- =====================================================
-- 2. FUNÇÕES ADMIN ADICIONAIS
-- =====================================================

-- 2.1 Função: admin_create_user_with_auth
CREATE OR REPLACE FUNCTION admin_create_user_with_auth(
    p_nome text, 
    p_email text, 
    p_senha text, 
    p_celular text DEFAULT NULL, 
    p_plano_id integer DEFAULT NULL, 
    p_is_admin boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id integer;
  v_auth_user_id uuid;
  v_encrypted_password text;
BEGIN
  -- Verificar se é admin
  IF NOT is_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  
  -- Verificar se email já existe
  IF EXISTS (SELECT 1 FROM usuarios WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já cadastrado.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já cadastrado no sistema de autenticação.';
  END IF;
  
  -- Gerar senha criptografada
  SELECT extensions.crypt(p_senha, extensions.gen_salt('bf')) INTO v_encrypted_password;
  
  -- Criar usuário no auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    v_encrypted_password,
    NOW(),
    NOW(),
    NOW(),
    '',
    ''
  ) RETURNING id INTO v_auth_user_id;
  
  -- Criar usuário na tabela usuarios
  INSERT INTO usuarios (
    nome,
    email,
    celular,
    plano_id,
    is_admin,
    status,
    has_password,
    auth_user,
    created_at
  ) VALUES (
    p_nome,
    p_email,
    p_celular,
    p_plano_id,
    p_is_admin,
    'ativo',
    true,
    v_auth_user_id,
    NOW()
  ) RETURNING id INTO v_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Usuário criado com sucesso com conta de login',
    'user_id', v_user_id,
    'auth_user_id', v_auth_user_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar usuário: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION admin_create_user_with_auth IS 'Cria usuário com autenticação (auth.users + usuarios) em uma única operação';

-- 2.2 Função: admin_delete_plan
CREATE OR REPLACE FUNCTION admin_delete_plan(p_plan_id integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_users_count integer;
BEGIN
  -- Verificar se é admin
  IF NOT is_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  
  -- Verificar se há usuários usando este plano
  SELECT COUNT(*) INTO v_users_count FROM usuarios WHERE plano_id = p_plan_id;
  
  IF v_users_count > 0 THEN
    RAISE EXCEPTION 'Não é possível excluir. Existem % usuários usando este plano.', v_users_count;
  END IF;
  
  -- Excluir plano
  DELETE FROM planos_sistema WHERE id = p_plan_id;
  
  RETURN json_build_object('success', true, 'message', 'Plano excluído com sucesso');
END;
$$;

COMMENT ON FUNCTION admin_delete_plan IS 'Exclui um plano do sistema (valida se não há usuários usando)';

-- 2.3 Função: admin_delete_user
CREATE OR REPLACE FUNCTION admin_delete_user(
    p_user_id integer, 
    p_delete_auth boolean DEFAULT false, 
    p_delete_transactions boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_auth_user uuid;
BEGIN
  -- Verificar se é admin
  IF NOT is_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  
  -- Não permitir excluir a si mesmo
  IF p_user_id = (SELECT id FROM usuarios WHERE auth_user = auth.uid()) THEN
    RAISE EXCEPTION 'Você não pode excluir sua própria conta.';
  END IF;
  
  -- Buscar auth_user
  SELECT auth_user INTO v_auth_user FROM usuarios WHERE id = p_user_id;
  
  -- Se solicitado, excluir transações
  IF p_delete_transactions THEN
    DELETE FROM transacoes WHERE usuario_id = p_user_id;
    DELETE FROM lancamentos_futuros WHERE usuario_id = p_user_id;
    DELETE FROM categoria_trasacoes WHERE usuario_id = p_user_id;
    DELETE FROM metas_orcamento WHERE usuario_id = p_user_id;
  END IF;
  
  -- Excluir usuário da tabela usuarios
  DELETE FROM usuarios WHERE id = p_user_id;
  
  -- Se solicitado e existe auth_user, excluir da auth.users
  IF p_delete_auth AND v_auth_user IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = v_auth_user;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Usuário excluído com sucesso'
  );
END;
$$;

COMMENT ON FUNCTION admin_delete_user IS 'Exclui usuário do sistema com opções de excluir auth e transações';

-- 2.4 Função: admin_get_user_stats
CREATE OR REPLACE FUNCTION admin_get_user_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result json;
BEGIN
  -- Verificar se é admin
  IF NOT is_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  
  SELECT json_build_object(
    'total_usuarios', COUNT(*),
    'usuarios_ativos', COUNT(*) FILTER (WHERE status = 'ativo'),
    'administradores', COUNT(*) FILTER (WHERE is_admin = true),
    'novos_30_dias', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'),
    'usuarios_free', COUNT(*) FILTER (WHERE plano = 'free' OR plano IS NULL),
    'usuarios_premium', COUNT(*) FILTER (WHERE plano IN ('pro', 'vitalicio'))
  ) INTO v_result
  FROM usuarios;
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION admin_get_user_stats IS 'Retorna estatísticas gerais de usuários para dashboard admin';

-- 2.5 Função: admin_list_plans
CREATE OR REPLACE FUNCTION admin_list_plans()
RETURNS TABLE(
    id integer, 
    nome character varying, 
    tipo_periodo character varying, 
    valor numeric, 
    link_checkout text, 
    ativo boolean, 
    ordem_exibicao integer, 
    descricao text, 
    recursos jsonb, 
    created_at timestamp with time zone, 
    updated_at timestamp with time zone, 
    permite_compartilhamento boolean, 
    max_usuarios_dependentes integer, 
    destaque boolean, 
    permite_modo_pj boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  SELECT u.is_admin INTO v_is_admin
  FROM usuarios u
  WHERE u.auth_user = v_user_id;
  
  IF v_is_admin IS NULL OR v_is_admin = false THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.nome,
    p.tipo_periodo,
    p.valor,
    p.link_checkout,
    p.ativo,
    p.ordem_exibicao,
    p.descricao,
    p.recursos,
    p.created_at,
    p.updated_at,
    p.permite_compartilhamento,
    p.max_usuarios_dependentes,
    COALESCE(p.destaque, false) as destaque,
    COALESCE(p.permite_modo_pj, true) as permite_modo_pj
  FROM planos_sistema p
  ORDER BY p.ordem_exibicao;
END;
$$;

COMMENT ON FUNCTION admin_list_plans IS 'Lista todos os planos do sistema para administração';

-- 2.6 Função: admin_list_users
CREATE OR REPLACE FUNCTION admin_list_users(
    p_search text DEFAULT NULL, 
    p_limit integer DEFAULT 25, 
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id integer, 
    nome text, 
    email text, 
    celular text, 
    plano text, 
    status text, 
    is_admin boolean, 
    data_compra timestamp with time zone, 
    data_final_plano timestamp with time zone, 
    data_ultimo_acesso timestamp with time zone, 
    has_password boolean, 
    created_at timestamp without time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT is_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.nome,
    u.email,
    u.celular,
    u.plano,
    u.status,
    u.is_admin,
    u.data_compra,
    u.data_final_plano,
    u.data_ultimo_acesso,
    u.has_password,
    u.created_at
  FROM usuarios u
  WHERE 
    (p_search IS NULL OR 
     u.nome ILIKE '%' || p_search || '%' OR 
     u.email ILIKE '%' || p_search || '%')
  ORDER BY u.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION admin_list_users IS 'Lista usuários com paginação e busca para painel admin';

-- 2.7 Função: admin_reset_user_password
CREATE OR REPLACE FUNCTION admin_reset_user_password(
    p_user_id integer, 
    p_new_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user uuid;
  v_result json;
  v_encrypted_password text;
BEGIN
  -- Verificar se é admin
  IF NOT is_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  
  -- Buscar o auth_user do usuário
  SELECT auth_user INTO v_auth_user
  FROM usuarios
  WHERE id = p_user_id;
  
  IF v_auth_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  
  -- Gerar senha criptografada
  SELECT extensions.crypt(p_new_password, extensions.gen_salt('bf')) INTO v_encrypted_password;
  
  -- Atualizar senha no auth.users
  UPDATE auth.users
  SET 
    encrypted_password = v_encrypted_password,
    updated_at = now()
  WHERE id = v_auth_user;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado no sistema de autenticação';
  END IF;
  
  -- Atualizar flag has_password
  UPDATE usuarios
  SET 
    has_password = true,
    ultima_atualizacao = NOW()
  WHERE id = p_user_id;
  
  v_result := json_build_object(
    'success', true,
    'message', 'Senha resetada com sucesso'
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao resetar senha: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION admin_reset_user_password IS 'Reseta senha de usuário (apenas admin)';

-- 2.8 Função: admin_update_user
CREATE OR REPLACE FUNCTION admin_update_user(
    p_user_id integer, 
    p_nome text DEFAULT NULL, 
    p_email text DEFAULT NULL, 
    p_celular text DEFAULT NULL, 
    p_plano_id integer DEFAULT NULL, 
    p_status text DEFAULT NULL, 
    p_is_admin boolean DEFAULT NULL, 
    p_data_compra timestamp with time zone DEFAULT NULL, 
    p_data_final_plano timestamp with time zone DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT is_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  
  -- Atualizar apenas campos não nulos
  UPDATE usuarios
  SET
    nome = COALESCE(p_nome, nome),
    email = COALESCE(p_email, email),
    celular = COALESCE(p_celular, celular),
    plano_id = COALESCE(p_plano_id, plano_id),
    status = COALESCE(p_status, status),
    is_admin = COALESCE(p_is_admin, is_admin),
    data_compra = COALESCE(p_data_compra, data_compra),
    data_final_plano = COALESCE(p_data_final_plano, data_final_plano),
    ultima_atualizacao = NOW()
  WHERE id = p_user_id;
  
  RETURN json_build_object('success', true, 'message', 'Usuário atualizado com sucesso');
END;
$$;

COMMENT ON FUNCTION admin_update_user IS 'Atualiza dados de usuário (apenas admin)';

-- =====================================================
-- 3. FUNÇÕES DE NEGÓCIO
-- =====================================================

-- 3.1 Função: processar_transferencia_segura
CREATE OR REPLACE FUNCTION processar_transferencia_segura(
    p_conta_origem_id uuid, 
    p_conta_destino_id uuid, 
    p_valor numeric, 
    p_descricao text, 
    p_data date, 
    p_tipo_conta text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_usuario_id INTEGER;
    v_saldo_origem NUMERIC;
    v_conta_origem_nome TEXT;
    v_conta_destino_nome TEXT;
    v_transacao_saida_id INTEGER;
    v_transacao_entrada_id INTEGER;
BEGIN
    -- 1. Validar usuário autenticado
    SELECT id INTO v_usuario_id
    FROM usuarios
    WHERE auth_user = auth.uid();
    
    IF v_usuario_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Usuário não autenticado');
    END IF;
    
    -- 2. Validar que ambas as contas pertencem ao usuário
    SELECT COUNT(*) INTO v_saldo_origem
    FROM contas_bancarias
    WHERE id IN (p_conta_origem_id, p_conta_destino_id)
    AND usuario_id = auth.uid();
    
    IF v_saldo_origem != 2 THEN
        RETURN json_build_object('success', false, 'error', 'Contas não pertencem ao usuário');
    END IF;
    
    -- 3. Validar saldo suficiente
    SELECT saldo_atual, nome INTO v_saldo_origem, v_conta_origem_nome
    FROM contas_bancarias
    WHERE id = p_conta_origem_id
    AND usuario_id = auth.uid();
    
    IF v_saldo_origem < p_valor THEN
        RETURN json_build_object('success', false, 'error', 'Saldo insuficiente');
    END IF;
    
    -- 4. Buscar nome da conta destino
    SELECT nome INTO v_conta_destino_nome
    FROM contas_bancarias
    WHERE id = p_conta_destino_id;
    
    -- 5. Criar transação de SAÍDA
    INSERT INTO transacoes (
        usuario_id,
        tipo_conta,
        conta_id,
        tipo,
        valor,
        descricao,
        data,
        mes,
        categoria_id
    ) VALUES (
        v_usuario_id,
        p_tipo_conta,
        p_conta_origem_id,
        'saida',
        p_valor,
        COALESCE(p_descricao, 'Transferência para ' || v_conta_destino_nome),
        p_data,
        TO_CHAR(p_data, 'YYYY-MM'),
        NULL
    ) RETURNING id INTO v_transacao_saida_id;
    
    -- 6. Criar transação de ENTRADA
    INSERT INTO transacoes (
        usuario_id,
        tipo_conta,
        conta_id,
        tipo,
        valor,
        descricao,
        data,
        mes,
        categoria_id
    ) VALUES (
        v_usuario_id,
        p_tipo_conta,
        p_conta_destino_id,
        'entrada',
        p_valor,
        COALESCE(p_descricao, 'Transferência de ' || v_conta_origem_nome),
        p_data,
        TO_CHAR(p_data, 'YYYY-MM'),
        NULL
    ) RETURNING id INTO v_transacao_entrada_id;
    
    -- 7. Retornar sucesso
    RETURN json_build_object(
        'success', true,
        'transacao_saida_id', v_transacao_saida_id,
        'transacao_entrada_id', v_transacao_entrada_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION processar_transferencia_segura IS 'Processa transferência entre contas do mesmo usuário de forma atômica';

-- 3.2 Função: calcular_dias_restantes_free
CREATE OR REPLACE FUNCTION calcular_dias_restantes_free(p_usuario_id integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    usuario_record RECORD;
    config_dias INTEGER;
    dias_passados INTEGER;
    dias_restantes INTEGER;
    data_final DATE;
BEGIN
    -- Buscar dados do usuário
    SELECT created_at, plano, data_final_plano
    INTO usuario_record 
    FROM public.usuarios 
    WHERE id = p_usuario_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Se não for plano Free, retorna -1 (acesso ilimitado)
    IF usuario_record.plano IS NOT NULL AND LOWER(usuario_record.plano) != 'free' THEN
        RETURN -1;
    END IF;
    
    -- Se tem data_final_plano, usar ela
    IF usuario_record.data_final_plano IS NOT NULL THEN
        data_final := DATE(usuario_record.data_final_plano);
        dias_restantes := (data_final - CURRENT_DATE);
        
        IF dias_restantes < 0 THEN
            RETURN 0;
        END IF;
        
        RETURN dias_restantes;
    END IF;
    
    -- Fallback: usar created_at
    SELECT dias_acesso_free 
    INTO config_dias 
    FROM public.configuracoes_sistema 
    WHERE id = 1;
    
    IF NOT FOUND THEN
        config_dias := 7;
    END IF;
    
    dias_passados := EXTRACT(DAY FROM (NOW() - usuario_record.created_at));
    dias_restantes := config_dias - dias_passados;
    
    IF dias_restantes < 0 THEN
        RETURN 0;
    END IF;
    
    RETURN dias_restantes;
END;
$$;

COMMENT ON FUNCTION calcular_dias_restantes_free IS 'Calcula dias restantes de acesso para usuários Free';

-- 3.3 Função: calcular_progresso_meta
CREATE OR REPLACE FUNCTION calcular_progresso_meta(
    p_meta_id integer, 
    p_data_referencia date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    meta_id integer, 
    nome text, 
    tipo_meta text, 
    valor_limite numeric, 
    valor_gasto numeric, 
    valor_restante numeric, 
    percentual_usado numeric, 
    dias_restantes integer, 
    projecao_final numeric, 
    data_inicio date, 
    data_fim date, 
    status text, 
    erro text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_meta RECORD;
    v_valor_gasto NUMERIC := 0;
    v_percentual_usado NUMERIC := 0;
    v_dias_restantes INTEGER := 0;
    v_dias_totais INTEGER := 0;
    v_dias_passados INTEGER := 0;
    v_projecao_final NUMERIC := 0;
    v_valor_restante NUMERIC := 0;
    v_status TEXT := 'normal';
    v_data_calculo DATE;
BEGIN
    -- Buscar dados da meta
    SELECT * INTO v_meta
    FROM public.metas_orcamento
    WHERE id = p_meta_id AND ativo = true;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            p_meta_id, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 
            NULL::NUMERIC, NULL::NUMERIC, NULL::INTEGER, NULL::NUMERIC, 
            NULL::DATE, NULL::DATE, NULL::TEXT, 'Meta não encontrada ou inativa'::TEXT;
        RETURN;
    END IF;
    
    -- Ajustar data de cálculo
    IF p_data_referencia < v_meta.data_inicio THEN
        v_data_calculo := v_meta.data_inicio;
    ELSIF p_data_referencia > v_meta.data_fim THEN
        v_data_calculo := v_meta.data_fim;
    ELSE
        v_data_calculo := p_data_referencia;
    END IF;
    
    -- Calcular valor gasto baseado no tipo
    IF v_meta.tipo_meta = 'categoria' THEN
        SELECT COALESCE(SUM(t.valor), 0) INTO v_valor_gasto
        FROM public.transacoes t
        WHERE t.usuario_id = v_meta.usuario_id
          AND t.categoria_id = v_meta.categoria_id
          AND t.tipo = 'saida'
          AND t.data >= v_meta.data_inicio
          AND t.data <= v_data_calculo;
          
    ELSIF v_meta.tipo_meta = 'geral' THEN
        SELECT COALESCE(SUM(t.valor), 0) INTO v_valor_gasto
        FROM public.transacoes t
        WHERE t.usuario_id = v_meta.usuario_id
          AND t.tipo = 'saida'
          AND t.data >= v_meta.data_inicio
          AND t.data <= v_data_calculo;
          
    ELSIF v_meta.tipo_meta = 'economia' THEN
        SELECT COALESCE(
            (SELECT SUM(valor) FROM public.transacoes WHERE usuario_id = v_meta.usuario_id AND tipo = 'entrada' AND data >= v_meta.data_inicio AND data <= v_data_calculo) -
            (SELECT SUM(valor) FROM public.transacoes WHERE usuario_id = v_meta.usuario_id AND tipo = 'saida' AND data >= v_meta.data_inicio AND data <= v_data_calculo),
            0
        ) INTO v_valor_gasto;
        
        v_valor_gasto := GREATEST(v_valor_gasto, 0);
    END IF;
    
    -- Calcular percentual
    v_percentual_usado := CASE 
        WHEN v_meta.valor_limite > 0 THEN (v_valor_gasto / v_meta.valor_limite) * 100
        ELSE 0
    END;
    
    -- Calcular dias
    v_dias_totais := (v_meta.data_fim - v_meta.data_inicio) + 1;
    v_dias_passados := GREATEST((v_data_calculo - v_meta.data_inicio) + 1, 0);
    v_dias_restantes := GREATEST((v_meta.data_fim - v_data_calculo), 0);
    
    -- Calcular projeção
    IF v_dias_passados > 0 AND v_dias_totais > 0 THEN
        v_projecao_final := (v_valor_gasto / v_dias_passados) * v_dias_totais;
    ELSE
        v_projecao_final := v_valor_gasto;
    END IF;
    
    v_valor_restante := v_meta.valor_limite - v_valor_gasto;
    
    -- Determinar status
    IF v_percentual_usado >= 100 THEN
        v_status := 'excedida';
    ELSIF v_percentual_usado >= 90 THEN
        v_status := 'critica';
    ELSIF v_percentual_usado >= 80 THEN
        v_status := 'alerta';
    ELSIF v_percentual_usado >= 70 THEN
        v_status := 'atencao';
    ELSE
        v_status := 'normal';
    END IF;
    
    RETURN QUERY SELECT 
        v_meta.id,
        v_meta.nome,
        v_meta.tipo_meta,
        v_meta.valor_limite,
        v_valor_gasto,
        v_valor_restante,
        v_percentual_usado,
        v_dias_restantes,
        v_projecao_final,
        v_meta.data_inicio,
        v_meta.data_fim,
        v_status,
        NULL::TEXT;
END;
$$;

COMMENT ON FUNCTION calcular_progresso_meta IS 'Calcula progresso de uma meta de orçamento com projeções';

-- 3.4 Função: create_installments
CREATE OR REPLACE FUNCTION create_installments(
    p_usuario_id integer, 
    p_tipo text, 
    p_valor numeric, 
    p_descricao text, 
    p_data_prevista date, 
    p_categoria_id integer, 
    p_numero_parcelas integer
)
RETURNS SETOF lancamentos_futuros
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    data_parcela DATE;
    descricao_parcela TEXT;
    i INTEGER;
    parcela_id INTEGER;
    mes_previsto TEXT;
    dia_original INTEGER;
    ultimo_dia_mes INTEGER;
BEGIN
    dia_original := EXTRACT(DAY FROM p_data_prevista);

    FOR i IN 1..p_numero_parcelas LOOP
        IF i = 1 THEN
            data_parcela := p_data_prevista;
        ELSE
            data_parcela := DATE_TRUNC('month', p_data_prevista + ((i-1) || ' months')::INTERVAL)::DATE;
            ultimo_dia_mes := (DATE_TRUNC('month', data_parcela) + '1 month'::INTERVAL - '1 day'::INTERVAL)::DATE;
            ultimo_dia_mes := EXTRACT(DAY FROM ultimo_dia_mes);

            IF dia_original <= ultimo_dia_mes THEN
                data_parcela := data_parcela + (dia_original - 1) * INTERVAL '1 day';
            ELSE
                data_parcela := data_parcela + (ultimo_dia_mes - 1) * INTERVAL '1 day';
            END IF;
        END IF;

        descricao_parcela := p_descricao || ' (' || i || '/' || p_numero_parcelas || ')';
        mes_previsto := to_char(data_parcela, 'YYYY-MM');

        INSERT INTO public.lancamentos_futuros (
            usuario_id, tipo, valor, descricao, data_prevista, categoria_id, mes_previsto, status, recorrente, parcelamento, numero_parcelas, parcela_atual
        ) VALUES (
            p_usuario_id, p_tipo, p_valor, descricao_parcela, data_parcela, p_categoria_id, mes_previsto, 'pendente', FALSE, 'TRUE', p_numero_parcelas, i
        ) RETURNING id INTO parcela_id;

        RETURN QUERY SELECT * FROM public.lancamentos_futuros WHERE id = parcela_id;
    END LOOP;

    RETURN;
END;
$$;

COMMENT ON FUNCTION create_installments IS 'Cria lançamentos futuros parcelados automaticamente';

-- 3.5 Função: get_metas_usuario
CREATE OR REPLACE FUNCTION get_metas_usuario(
    p_usuario_id integer, 
    p_data_referencia date DEFAULT CURRENT_DATE
)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    meta_record RECORD;
    progresso_record RECORD;
    resultado json;
BEGIN
    FOR meta_record IN 
        SELECT id FROM public.metas_orcamento 
        WHERE usuario_id = p_usuario_id AND ativo = true
        ORDER BY created_at DESC
    LOOP
        SELECT * INTO progresso_record
        FROM public.calcular_progresso_meta(meta_record.id, p_data_referencia);
        
        IF progresso_record.erro IS NULL THEN
            resultado := json_build_object(
                'meta_id', progresso_record.meta_id,
                'nome', progresso_record.nome,
                'tipo_meta', progresso_record.tipo_meta,
                'valor_limite', progresso_record.valor_limite,
                'valor_gasto', progresso_record.valor_gasto,
                'valor_restante', progresso_record.valor_restante,
                'percentual_usado', progresso_record.percentual_usado,
                'dias_restantes', progresso_record.dias_restantes,
                'projecao_final', progresso_record.projecao_final,
                'data_inicio', progresso_record.data_inicio,
                'data_fim', progresso_record.data_fim,
                'status', progresso_record.status
            );
            
            RETURN NEXT resultado;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$;

COMMENT ON FUNCTION get_metas_usuario IS 'Retorna todas as metas ativas de um usuário com progresso calculado';

-- =====================================================
-- ✅ ARQUIVO DE DIFERENÇAS COMPLETO
-- =====================================================
-- 
-- 📊 RESUMO:
-- ✅ 2 funções de configuração do sistema
-- ✅ 8 funções admin adicionais
-- ✅ 5 funções de negócio (transferências, metas, parcelamentos)
-- 
-- Total: 15 funções faltantes identificadas e documentadas
-- =====================================================
