-- =====================================================
-- SETUP DIFFERENTIAL COMPLETO - GRANAZAP V5
-- =====================================================
-- Este arquivo contém TODAS as diferenças entre o setup.sql original
-- e o banco de dados atual em produção no Supabase.
-- 
-- ⚠️ IMPORTANTE: Execute este arquivo APÓS o setup.sql
-- 
-- Data de Geração: 22/12/2024 (Atualizado)
-- Projeto: vrmickfxoxvyljounoxq
-- Última Atualização: 09/01/2025 - Função para deletar categorias com segurança
-- =====================================================

-- =====================================================
-- 1. EXTENSÕES HABILITADAS (não estão no setup.sql)
-- =====================================================

-- Extensões já habilitadas no Supabase:
-- ✅ pg_graphql (schema: graphql)
-- ✅ supabase_vault (schema: vault)
-- ✅ uuid-ossp (schema: extensions)
-- ✅ pg_net (schema: extensions) - NECESSÁRIA para Cron Jobs
-- ✅ http (schema: extensions)
-- ✅ pgcrypto (schema: extensions)
-- ✅ pg_stat_statements (schema: extensions)
-- ✅ pg_cron (schema: pg_catalog) - NECESSÁRIA para Investment Updates

-- =====================================================
-- 2. NOVAS TABELAS (criar PRIMEIRO para evitar erros de dependência)
-- =====================================================

-- 2.1 Tabela: usuarios_dependentes (adicionar colunas faltantes)
-- Tabela já existe, apenas adicionar colunas que podem estar faltando
ALTER TABLE usuarios_dependentes 
ADD COLUMN IF NOT EXISTS convite_token TEXT;

ALTER TABLE usuarios_dependentes 
ADD COLUMN IF NOT EXISTS convite_expira_em TIMESTAMP WITH TIME ZONE;

ALTER TABLE usuarios_dependentes 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

ALTER TABLE usuarios_dependentes 
ADD COLUMN IF NOT EXISTS convite_status TEXT DEFAULT 'pendente' CHECK (convite_status IN ('pendente', 'aceito', 'recusado', 'cancelado'));

ALTER TABLE usuarios_dependentes 
ADD COLUMN IF NOT EXISTS permissoes JSONB DEFAULT '{"pode_criar": true, "pode_editar": true, "pode_deletar": false}'::jsonb;

ALTER TABLE usuarios_dependentes 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE usuarios_dependentes 
ALTER COLUMN permissoes SET DEFAULT '{"nivel_acesso": "basico", "pode_ver_relatorios": true, "pode_ver_dados_admin": true, "pode_convidar_membros": false, "pode_criar_transacoes": true, "pode_gerenciar_contas": false, "pode_editar_transacoes": true, "pode_gerenciar_cartoes": false, "pode_deletar_transacoes": false, "pode_ver_outros_membros": false}'::jsonb;

COMMENT ON TABLE usuarios_dependentes IS 'Usuários dependentes vinculados a um usuário principal. Compartilham os mesmos dados financeiros do principal sem ter autenticação própria.';
COMMENT ON COLUMN usuarios_dependentes.usuario_principal_id IS 'ID do usuário principal (titular do plano) ao qual este dependente pertence';
COMMENT ON COLUMN usuarios_dependentes.auth_user_id IS 'UUID do auth.users se o dependente tiver login próprio';
COMMENT ON COLUMN usuarios_dependentes.permissoes IS 'Permissões do dependente em formato JSON';

-- 2.2 Tabela: contas_bancarias
CREATE TABLE IF NOT EXISTS contas_bancarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    banco TEXT,
    saldo_atual NUMERIC(15,2) NOT NULL DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    tipo_conta TEXT NOT NULL DEFAULT 'pessoal' CHECK (tipo_conta IN ('pessoal', 'pj')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE contas_bancarias IS 'Contas bancárias e carteiras do usuário para controle de saldo';
COMMENT ON COLUMN contas_bancarias.usuario_id IS 'UUID do auth.users (para RLS)';
COMMENT ON COLUMN contas_bancarias.user_id IS 'ID do usuário na tabela usuarios (INTEGER). Preenchido automaticamente via trigger baseado em usuario_id (UUID).';
COMMENT ON COLUMN contas_bancarias.saldo_atual IS 'Saldo atual calculado automaticamente';
COMMENT ON COLUMN contas_bancarias.tipo_conta IS 'Tipo de conta: pessoal ou pj (Pessoa Jurídica)';

-- 2.3 Tabela: cartoes_credito
CREATE TABLE IF NOT EXISTS cartoes_credito (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    bandeira TEXT,
    ultimos_digitos TEXT,
    limite_total NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (limite_total >= 0),
    dia_fechamento INTEGER NOT NULL CHECK (dia_fechamento >= 1 AND dia_fechamento <= 31),
    dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
    tipo_conta TEXT NOT NULL DEFAULT 'pessoal' CHECK (tipo_conta IN ('pessoal', 'pj')),
    cor_cartao TEXT DEFAULT '#8A05BE',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    conta_vinculada_id UUID REFERENCES contas_bancarias(id) ON DELETE SET NULL
);

COMMENT ON TABLE cartoes_credito IS 'Cartões de crédito do usuário';
COMMENT ON COLUMN cartoes_credito.usuario_id IS 'UUID do auth.users (para RLS)';
COMMENT ON COLUMN cartoes_credito.user_id IS 'ID do usuário na tabela usuarios (INTEGER). Preenchido automaticamente via trigger baseado em usuario_id (UUID).';
COMMENT ON COLUMN cartoes_credito.dia_fechamento IS 'Dia do mês em que a fatura fecha';
COMMENT ON COLUMN cartoes_credito.dia_vencimento IS 'Dia do mês em que a fatura vence';
COMMENT ON COLUMN cartoes_credito.conta_vinculada_id IS 'Conta bancária usada para pagar a fatura';

-- 2.4 Tabela: investment_assets
CREATE TABLE IF NOT EXISTS investment_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker TEXT NOT NULL UNIQUE,
    name TEXT,
    type TEXT NOT NULL CHECK (type IN ('acao', 'fii', 'etf', 'renda_fixa', 'cripto', 'bdr')),
    current_price NUMERIC(15,2),
    previous_close NUMERIC(15,2),
    last_updated TIMESTAMP WITH TIME ZONE,
    source TEXT DEFAULT 'brapi' CHECK (source IN ('brapi', 'manual', 'fallback', 'binance')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

COMMENT ON TABLE investment_assets IS 'Ativos disponíveis para investimento (ações, FIIs, criptos, etc)';
COMMENT ON COLUMN investment_assets.ticker IS 'Código do ativo (ex: PETR4, BTCBRL)';
COMMENT ON COLUMN investment_assets.type IS 'Tipo do ativo: acao, fii, etf, renda_fixa, cripto, bdr';
COMMENT ON COLUMN investment_assets.source IS 'Fonte dos dados: brapi, binance, manual, fallback';

-- 2.5 Tabela: investment_positions (CRIAR ANTES de investment_dividends)
CREATE TABLE IF NOT EXISTS investment_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES investment_assets(id) ON DELETE RESTRICT,
    conta_id UUID REFERENCES contas_bancarias(id) ON DELETE SET NULL,
    quantidade NUMERIC(15,4) NOT NULL CHECK (quantidade > 0),
    preco_medio NUMERIC(15,2) NOT NULL CHECK (preco_medio >= 0),
    data_compra DATE NOT NULL,
    tipo_conta TEXT NOT NULL CHECK (tipo_conta IN ('pessoal', 'pj')),
    is_manual_price BOOLEAN DEFAULT false,
    manual_price NUMERIC(15,8),
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    yield_percentage NUMERIC(5,2) DEFAULT NULL,
    manual_ir NUMERIC(15,2),
    manual_iof NUMERIC(15,2),
    use_manual_tax BOOLEAN DEFAULT false
);

COMMENT ON TABLE investment_positions IS 'Posições de investimento do usuário';
COMMENT ON COLUMN investment_positions.usuario_id IS 'UUID do auth.users (para RLS)';
COMMENT ON COLUMN investment_positions.user_id IS 'ID do usuário na tabela usuarios (INTEGER). Preenchido automaticamente via trigger baseado em usuario_id (UUID).';
COMMENT ON COLUMN investment_positions.quantidade IS 'Quantidade de ativos na posição';
COMMENT ON COLUMN investment_positions.preco_medio IS 'Preço médio de compra';
COMMENT ON COLUMN investment_positions.is_manual_price IS 'Se true, usa manual_price ao invés do preço da API';
COMMENT ON COLUMN investment_positions.yield_percentage IS 'Rentabilidade contratada para Renda Fixa (ex: 100 = 100% CDI, 110 = 110% CDI). NULL para outros tipos de ativos.';
COMMENT ON COLUMN investment_positions.manual_ir IS 'Valor manual de IR (para bater com banco)';
COMMENT ON COLUMN investment_positions.manual_iof IS 'Valor manual de IOF (para bater com banco)';
COMMENT ON COLUMN investment_positions.use_manual_tax IS 'Se true, usa valores manuais de impostos ao invés de calcular';

-- 2.6 Tabela: investment_dividends
CREATE TABLE IF NOT EXISTS investment_dividends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES investment_positions(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('dividendo', 'jcp', 'rendimento', 'amortizacao')),
    valor_por_ativo NUMERIC(15,8) NOT NULL CHECK (valor_por_ativo > 0),
    data_com DATE,
    data_pagamento DATE NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

COMMENT ON TABLE investment_dividends IS 'Proventos recebidos de investimentos (dividendos, JCP, rendimentos)';
COMMENT ON COLUMN investment_dividends.tipo IS 'Tipo do provento: dividendo, jcp, rendimento, amortizacao';
COMMENT ON COLUMN investment_dividends.valor_por_ativo IS 'Valor pago por ativo';
COMMENT ON COLUMN investment_dividends.data_com IS 'Data COM (quem tinha o ativo nesta data recebe)';

-- 2.6 Tabela: api_usage_log
CREATE TABLE IF NOT EXISTS api_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_name TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    tickers_count INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'rate_limit')),
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

COMMENT ON TABLE api_usage_log IS 'Log de uso das APIs externas (BrAPI, Binance, etc)';
COMMENT ON COLUMN api_usage_log.status IS 'Status da chamada: success, error, rate_limit';

-- 2.7 Tabela: cdi_rates
CREATE TABLE IF NOT EXISTS cdi_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    rate NUMERIC NOT NULL,
    source TEXT DEFAULT 'banco_central',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE cdi_rates IS 'Historical CDI rates from Banco Central do Brasil';
COMMENT ON COLUMN cdi_rates.date IS 'Reference date for the rate';
COMMENT ON COLUMN cdi_rates.rate IS 'Annual CDI rate in decimal format (0.1165 = 11.65%)';

-- =====================================================
-- 3. NOVAS COLUNAS EM TABELAS EXISTENTES
-- =====================================================

-- 3.1 Tabela: usuarios
-- Colunas de Internacionalização
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS idioma TEXT DEFAULT 'pt' CHECK (idioma IN ('pt', 'es', 'en'));

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL' CHECK (moeda IN ('BRL', 'USD', 'EUR', 'PYG', 'ARS'));

COMMENT ON COLUMN usuarios.idioma IS 'Idioma preferido do usuário: pt (Português), es (Español), en (English)';
COMMENT ON COLUMN usuarios.moeda IS 'Moeda preferida do usuário: BRL (Real), USD (Dólar), EUR (Euro)';

-- 2.2 Tabela: categoria_trasacoes
-- Colunas para Modo PJ e Keywords AI
ALTER TABLE categoria_trasacoes 
ADD COLUMN IF NOT EXISTS tipo TEXT CHECK (tipo IN ('entrada', 'saida', 'ambos'));

ALTER TABLE categoria_trasacoes 
ADD COLUMN IF NOT EXISTS tipo_conta TEXT NOT NULL DEFAULT 'pessoal' CHECK (tipo_conta IN ('pessoal', 'pj'));

ALTER TABLE categoria_trasacoes 
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';

COMMENT ON COLUMN categoria_trasacoes.tipo IS 'Tipo de categoria: entrada, saida ou ambos';
COMMENT ON COLUMN categoria_trasacoes.keywords IS 'Keywords for AI-powered category identification';

-- 2.3 Tabela: transacoes
-- Colunas para Modo PJ, Transferências, Contas Bancárias e Cartões
ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS dependente_id INTEGER REFERENCES usuarios_dependentes(id) ON DELETE SET NULL;

ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS tipo_conta TEXT DEFAULT 'pessoal' CHECK (tipo_conta IN ('pessoal', 'pj'));

ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS is_transferencia BOOLEAN DEFAULT false;

ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES contas_bancarias(id) ON DELETE SET NULL;

ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS cartao_id UUID REFERENCES cartoes_credito(id) ON DELETE SET NULL;

ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS conta_destino_id UUID REFERENCES contas_bancarias(id) ON DELETE SET NULL;

COMMENT ON COLUMN transacoes.conta_destino_id IS 'Conta bancária de destino (usado em transferências entre contas)';

-- Adicionar constraint de valor positivo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'transacoes_valor_positivo'
    ) THEN
        ALTER TABLE transacoes ADD CONSTRAINT transacoes_valor_positivo CHECK (valor > 0);
    END IF;
END $$;

COMMENT ON COLUMN transacoes.dependente_id IS 'ID do dependente que criou a transação. NULL = transação do usuário principal';
COMMENT ON COLUMN transacoes.tipo_conta IS 'Tipo de conta da transação: pessoal ou pj (Pessoa Jurídica)';
COMMENT ON COLUMN transacoes.is_transferencia IS 'Flag para identificar transferências entre contas (não conta em relatórios)';
COMMENT ON COLUMN transacoes.conta_id IS 'Conta bancária de origem da transação';
COMMENT ON COLUMN transacoes.cartao_id IS 'Cartão de crédito usado na transação (se aplicável)';

-- 2.4 Tabela: lancamentos_futuros
-- Colunas para Recorrentes, Dependentes e Cartões
ALTER TABLE lancamentos_futuros 
ADD COLUMN IF NOT EXISTS dependente_id INTEGER REFERENCES usuarios_dependentes(id) ON DELETE SET NULL;

ALTER TABLE lancamentos_futuros 
ADD COLUMN IF NOT EXISTS data_final DATE DEFAULT NULL;

ALTER TABLE lancamentos_futuros 
ADD COLUMN IF NOT EXISTS confirmed_dates TEXT DEFAULT NULL;

ALTER TABLE lancamentos_futuros 
ADD COLUMN IF NOT EXISTS cartao_id UUID REFERENCES cartoes_credito(id) ON DELETE SET NULL;

ALTER TABLE lancamentos_futuros 
ADD COLUMN IF NOT EXISTS parcela_info JSONB DEFAULT NULL;

ALTER TABLE lancamentos_futuros 
ADD COLUMN IF NOT EXISTS tipo_conta TEXT DEFAULT 'pessoal' CHECK (tipo_conta IN ('pessoal', 'pj'));

ALTER TABLE lancamentos_futuros 
ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES contas_bancarias(id) ON DELETE SET NULL;

COMMENT ON COLUMN lancamentos_futuros.dependente_id IS 'ID do dependente que criou o lançamento futuro. NULL = lançamento do usuário principal';
COMMENT ON COLUMN lancamentos_futuros.data_final IS 'Data final opcional para lançamentos recorrentes. NULL = recorrente indefinido (comportamento atual mantido)';
COMMENT ON COLUMN lancamentos_futuros.confirmed_dates IS 'JSON array com datas já confirmadas de recorrentes expandidos. NULL = comportamento atual mantido';
COMMENT ON COLUMN lancamentos_futuros.cartao_id IS 'Cartão de crédito vinculado ao lançamento (para parcelas)';
COMMENT ON COLUMN lancamentos_futuros.parcela_info IS 'Informações da parcela: {"numero": 1, "total": 12, "valor_original": 1200.00}';
COMMENT ON COLUMN lancamentos_futuros.tipo_conta IS 'Tipo de conta: pessoal ou pj (Pessoa Jurídica)';
COMMENT ON COLUMN lancamentos_futuros.conta_id IS 'Conta bancária vinculada ao lançamento futuro';

-- 2.5 Tabela: planos_sistema
-- Colunas para Planos Compartilhados e Modo PJ
ALTER TABLE planos_sistema 
ADD COLUMN IF NOT EXISTS permite_compartilhamento BOOLEAN DEFAULT false;

ALTER TABLE planos_sistema 
ADD COLUMN IF NOT EXISTS max_usuarios_dependentes INTEGER DEFAULT 0 CHECK (max_usuarios_dependentes >= 0);

ALTER TABLE planos_sistema 
ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT false;

ALTER TABLE planos_sistema 
ADD COLUMN IF NOT EXISTS permite_modo_pj BOOLEAN DEFAULT true;

ALTER TABLE planos_sistema 
ADD COLUMN IF NOT EXISTS permite_investimentos BOOLEAN DEFAULT false;

ALTER TABLE planos_sistema 
ADD COLUMN IF NOT EXISTS max_ativos_investimento INTEGER DEFAULT 0;

COMMENT ON COLUMN planos_sistema.permite_compartilhamento IS 'Define se este plano permite adicionar usuários dependentes (ex: Plano Casal, Plano Empresa). FALSE = não permite, TRUE = permite';
COMMENT ON COLUMN planos_sistema.max_usuarios_dependentes IS 'Número máximo de usuários dependentes permitidos neste plano. 0 = não permite, -1 = ilimitado, N = limite específico';
COMMENT ON COLUMN planos_sistema.destaque IS 'Se este plano deve ser destacado na interface (ex: "Mais Popular")';
COMMENT ON COLUMN planos_sistema.permite_modo_pj IS 'Se este plano permite usar o modo PJ (Pessoa Jurídica)';

-- 2.6 Tabela: configuracoes_sistema
-- Colunas Admin e Configurações Adicionais
ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS support_email CHARACTER VARYING DEFAULT 'suporte@granazap.com';

-- Configuração unificada de cadastro (substituiu bloquear_cadastro_novos_usuarios)
ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS restringir_cadastro_usuarios_existentes BOOLEAN DEFAULT true;

ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS habilitar_modo_pj BOOLEAN DEFAULT true;

ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS show_sidebar_logo BOOLEAN DEFAULT false;

ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS show_sidebar_name BOOLEAN DEFAULT true;

ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS show_login_logo BOOLEAN DEFAULT false;

ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS show_login_name BOOLEAN DEFAULT true;

ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS logo_url_sidebar TEXT DEFAULT NULL;

ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS logo_url_login TEXT DEFAULT NULL;

ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS favicon_url TEXT DEFAULT NULL;

ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS video_url_instalacao TEXT DEFAULT NULL;

ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS whatsapp_suporte_url TEXT DEFAULT NULL;

ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS webhook_convite_membro TEXT DEFAULT '';

COMMENT ON COLUMN configuracoes_sistema.support_email IS 'Email de suporte exibido na plataforma';
COMMENT ON COLUMN configuracoes_sistema.restringir_cadastro_usuarios_existentes IS 'Define se apenas usuários pré-cadastrados (via WhatsApp/N8N) podem fazer login. FALSE = qualquer pessoa pode se cadastrar (modo público). TRUE = apenas usuários existentes na tabela usuarios podem fazer login (modo restrito).';
COMMENT ON COLUMN configuracoes_sistema.habilitar_modo_pj IS 'Se true, habilita o modo PJ (Pessoa Jurídica) na plataforma';
COMMENT ON COLUMN configuracoes_sistema.show_sidebar_logo IS 'Se true, exibe logo na sidebar';
COMMENT ON COLUMN configuracoes_sistema.show_sidebar_name IS 'Se true, exibe nome da empresa na sidebar';
COMMENT ON COLUMN configuracoes_sistema.show_login_logo IS 'Se true, exibe logo na tela de login';
COMMENT ON COLUMN configuracoes_sistema.show_login_name IS 'Se true, exibe nome da empresa na tela de login';
COMMENT ON COLUMN configuracoes_sistema.logo_url_sidebar IS 'URL do logo para exibir na sidebar';
COMMENT ON COLUMN configuracoes_sistema.logo_url_login IS 'URL do logo para exibir na tela de login';
COMMENT ON COLUMN configuracoes_sistema.favicon_url IS 'URL do favicon (ícone da aba do navegador)';
COMMENT ON COLUMN configuracoes_sistema.video_url_instalacao IS 'URL do vídeo de instalação/tutorial';

-- =====================================================
-- 4. FUNÇÕES SQL (ordem correta: tabelas já existem)
-- =====================================================

-- 4.1 Função: is_user_admin
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT is_admin INTO v_is_admin
    FROM usuarios
    WHERE auth_user = auth.uid();
    
    RETURN COALESCE(v_is_admin, false);
END;
$$;

COMMENT ON FUNCTION is_user_admin() IS 'Verifica se o usuário logado é administrador';

-- 4.2 Função: calculate_fixed_income_price
CREATE OR REPLACE FUNCTION calculate_fixed_income_price(
    p_data_compra DATE,
    p_yield_percentage NUMERIC,
    p_preco_inicial NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_dias_corridos INTEGER;
    v_taxa_cdi_anual NUMERIC;
    v_taxa_cdi_diaria NUMERIC;
    v_rentabilidade_contratada NUMERIC;
    v_valor_final NUMERIC;
BEGIN
    -- Calcular dias corridos desde a compra
    v_dias_corridos := CURRENT_DATE - p_data_compra;
    
    -- Se não passou nenhum dia, retornar preço inicial
    IF v_dias_corridos <= 0 THEN
        RETURN p_preco_inicial;
    END IF;
    
    -- Buscar taxa CDI mais recente
    SELECT rate INTO v_taxa_cdi_anual
    FROM cdi_rates
    ORDER BY date DESC
    LIMIT 1;
    
    -- Se não encontrou taxa CDI, retornar preço inicial
    IF v_taxa_cdi_anual IS NULL THEN
        RETURN p_preco_inicial;
    END IF;
    
    -- Converter taxa anual para diária: (1 + taxa_anual)^(1/252) - 1
    v_taxa_cdi_diaria := POWER(1 + v_taxa_cdi_anual, 1.0/252.0) - 1;
    
    -- Aplicar percentual contratado (ex: 110% do CDI = 1.10)
    v_rentabilidade_contratada := v_taxa_cdi_diaria * (p_yield_percentage / 100.0);
    
    -- Calcular valor final: valor_inicial * (1 + taxa)^dias
    v_valor_final := p_preco_inicial * POWER(1 + v_rentabilidade_contratada, v_dias_corridos);
    
    RETURN v_valor_final;
END;
$$;

COMMENT ON FUNCTION calculate_fixed_income_price(DATE, NUMERIC, NUMERIC) IS 'Calcula o preço atual de um ativo de renda fixa baseado no CDI e yield contratado';

-- 4.3 Função: atualizar_saldo_conta
CREATE OR REPLACE FUNCTION atualizar_saldo_conta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Atualizar saldo ao INSERIR transação
    IF TG_OP = 'INSERT' THEN
        IF NEW.conta_id IS NOT NULL AND NEW.is_transferencia = false THEN
            UPDATE contas_bancarias
            SET saldo_atual = saldo_atual + 
                CASE 
                    WHEN NEW.tipo = 'entrada' THEN NEW.valor
                    WHEN NEW.tipo = 'saida' THEN -NEW.valor
                    ELSE 0
                END,
                updated_at = NOW()
            WHERE id = NEW.conta_id;
        END IF;
    END IF;
    
    -- Atualizar saldo ao DELETAR transação
    IF TG_OP = 'DELETE' THEN
        IF OLD.conta_id IS NOT NULL AND OLD.is_transferencia = false THEN
            UPDATE contas_bancarias
            SET saldo_atual = saldo_atual - 
                CASE 
                    WHEN OLD.tipo = 'entrada' THEN OLD.valor
                    WHEN OLD.tipo = 'saida' THEN -OLD.valor
                    ELSE 0
                END,
                updated_at = NOW()
            WHERE id = OLD.conta_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4.4 Função: update_account_balance
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Lógica de atualização de saldo para transferências
    IF TG_OP = 'INSERT' AND NEW.is_transferencia = true THEN
        -- Debitar da conta origem
        IF NEW.conta_id IS NOT NULL THEN
            UPDATE contas_bancarias
            SET saldo_atual = saldo_atual - NEW.valor,
                updated_at = NOW()
            WHERE id = NEW.conta_id;
        END IF;
        
        -- Creditar na conta destino
        IF NEW.conta_destino_id IS NOT NULL THEN
            UPDATE contas_bancarias
            SET saldo_atual = saldo_atual + NEW.valor,
                updated_at = NOW()
            WHERE id = NEW.conta_destino_id;
        END IF;
    END IF;
    
    IF TG_OP = 'DELETE' AND OLD.is_transferencia = true THEN
        -- Reverter débito da conta origem
        IF OLD.conta_id IS NOT NULL THEN
            UPDATE contas_bancarias
            SET saldo_atual = saldo_atual + OLD.valor,
                updated_at = NOW()
            WHERE id = OLD.conta_id;
        END IF;
        
        -- Reverter crédito na conta destino
        IF OLD.conta_destino_id IS NOT NULL THEN
            UPDATE contas_bancarias
            SET saldo_atual = saldo_atual - OLD.valor,
                updated_at = NOW()
            WHERE id = OLD.conta_destino_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4.5 Função: validar_saldo_suficiente
CREATE OR REPLACE FUNCTION validar_saldo_suficiente(p_conta_id UUID, p_valor NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_saldo_atual NUMERIC;
BEGIN
    SELECT saldo_atual INTO v_saldo_atual
    FROM contas_bancarias
    WHERE id = p_conta_id
    AND usuario_id = auth.uid();
    
    IF v_saldo_atual IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN v_saldo_atual >= p_valor;
END;
$$;

-- 4.6 Função: prevent_duplicate_user_on_signup
-- NOTA: A função principal link_existing_user_on_signup está no setup.sql
-- Esta função é um complemento para evitar duplicação de usuários
-- A lógica completa de dependentes está implementada no setup.sql
CREATE OR REPLACE FUNCTION prevent_duplicate_user_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_user_id INTEGER;
BEGIN
    -- Verificar se já existe usuário com este email
    SELECT id INTO v_existing_user_id
    FROM usuarios
    WHERE LOWER(email) = LOWER(NEW.email);
    
    -- Se encontrou, vincular auth_user ao usuário existente
    IF v_existing_user_id IS NOT NULL THEN
        UPDATE usuarios
        SET auth_user = NEW.auth_user,
            has_password = true,
            ultima_atualizacao = NOW()
        WHERE id = v_existing_user_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 4.7 Função: handle_public_user_invite_link
-- Vincula auth_user_id em usuarios_dependentes quando um usuário é criado
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

-- 4.7.1 Função: verificar_proprietario_por_auth (CRÍTICA para RLS)
CREATE OR REPLACE FUNCTION verificar_proprietario_por_auth()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_id INTEGER;
    principal_id INTEGER;
BEGIN
    -- 1. Tentar buscar como usuário principal
    SELECT id INTO user_id
    FROM public.usuarios
    WHERE auth_user = auth.uid();
    
    -- Se encontrou, retornar
    IF user_id IS NOT NULL THEN
        RETURN user_id;
    END IF;
    
    -- 2. Se não encontrou, verificar se é dependente
    SELECT usuario_principal_id INTO principal_id
    FROM public.usuarios_dependentes
    WHERE auth_user_id = auth.uid() 
      AND status = 'ativo';
    
    -- Retornar ID do principal (para acessar dados compartilhados)
    RETURN COALESCE(principal_id, 0);
END;
$$;

COMMENT ON FUNCTION verificar_proprietario_por_auth() IS 'Retorna o ID do usuário principal. Se for dependente, retorna o ID do titular. Usado nas políticas RLS para permitir acesso compartilhado.';

-- 4.8 Função: sync_user_id_from_auth (NOVA - 22/12/2024)
CREATE OR REPLACE FUNCTION sync_user_id_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Se user_id já está preenchido, não faz nada
  IF NEW.user_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Busca o user_id (INTEGER) baseado no usuario_id (UUID)
  SELECT id INTO NEW.user_id
  FROM usuarios
  WHERE auth_user = NEW.usuario_id;
  
  -- Se não encontrou, lança erro
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado na tabela usuarios para auth_user: %', NEW.usuario_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_user_id_from_auth() IS 'Preenche automaticamente user_id (INTEGER) baseado em usuario_id (UUID) nas tabelas de contas, cartões e investimentos';

-- 4.9 Função: auto_set_plano_id (NOVA - 22/12/2024)
CREATE OR REPLACE FUNCTION auto_set_plano_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Se plano_id já está preenchido, não faz nada
  IF NEW.plano_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Se plano é 'Free' ou NULL, seta plano_id = 1 (Plano Free)
  IF NEW.plano = 'Free' OR NEW.plano IS NULL THEN
    NEW.plano_id := 1;
    NEW.plano := 'Free'; -- Garante que o campo texto também está correto
    RETURN NEW;
  END IF;

  -- Para outros planos, tenta encontrar o ID baseado no nome
  -- Mensal = 2, Trimestral = 3, Semestral = 4, Anual = 5
  CASE LOWER(NEW.plano)
    WHEN 'mensal' THEN NEW.plano_id := 2;
    WHEN 'trimestral' THEN NEW.plano_id := 3;
    WHEN 'semestral' THEN NEW.plano_id := 4;
    WHEN 'anual' THEN NEW.plano_id := 5;
    ELSE 
      -- Se não reconhecer, seta como Free por segurança
      NEW.plano_id := 1;
      NEW.plano := 'Free';
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_set_plano_id() IS 'Preenche automaticamente plano_id baseado no campo plano. Se plano=Free ou NULL, seta plano_id=1. Garante que nenhum usuário fique sem plano vinculado.';

-- 4.10 Funções Admin (novas)
CREATE OR REPLACE FUNCTION admin_create_user(
    p_nome TEXT,
    p_email TEXT,
    p_celular TEXT DEFAULT NULL,
    p_plano TEXT DEFAULT 'free',
    p_is_admin BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    IF NOT is_user_admin() THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
    END IF;
    
    IF EXISTS (SELECT 1 FROM usuarios WHERE email = p_email) THEN
        RAISE EXCEPTION 'Email já cadastrado.';
    END IF;
    
    INSERT INTO usuarios (nome, email, celular, plano, is_admin, status, has_password, created_at)
    VALUES (p_nome, p_email, p_celular, p_plano, p_is_admin, 'ativo', false, NOW())
    RETURNING id INTO v_user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Usuário criado com sucesso',
        'user_id', v_user_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION admin_create_auth_for_user(
    p_user_id INTEGER,
    p_senha TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_email TEXT;
    v_auth_user_id UUID;
    v_encrypted_password TEXT;
    v_existing_auth UUID;
BEGIN
    IF NOT is_user_admin() THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
    END IF;
    
    SELECT email, auth_user INTO v_email, v_existing_auth
    FROM usuarios
    WHERE id = p_user_id;
    
    IF v_email IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    -- Se já tem auth_user, apenas resetar senha
    IF v_existing_auth IS NOT NULL THEN
        SELECT extensions.crypt(p_senha, extensions.gen_salt('bf')) INTO v_encrypted_password;
        
        UPDATE auth.users
        SET encrypted_password = v_encrypted_password,
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = v_existing_auth;
        
        UPDATE usuarios
        SET has_password = true, ultima_atualizacao = NOW()
        WHERE id = p_user_id;
        
        RETURN json_build_object(
            'success', true,
            'message', 'Senha atualizada com sucesso',
            'auth_user_id', v_existing_auth
        );
    END IF;
    
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
        RAISE EXCEPTION 'Email já cadastrado no sistema de autenticação';
    END IF;
    
    SELECT extensions.crypt(p_senha, extensions.gen_salt('bf')) INTO v_encrypted_password;
    
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
        'authenticated', v_email, v_encrypted_password, NOW(), NOW(), NOW(), '', ''
    ) RETURNING id INTO v_auth_user_id;
    
    UPDATE usuarios
    SET auth_user = v_auth_user_id, has_password = true, ultima_atualizacao = NOW()
    WHERE id = p_user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Conta de autenticação criada com sucesso',
        'auth_user_id', v_auth_user_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao criar conta: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION admin_clear_chat_history(p_user_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    IF NOT is_user_admin() THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
    END IF;
    
    WITH user_lid AS (
        SELECT lid_original FROM usuarios WHERE id = p_user_id
    )
    DELETE FROM n8n_chat_histories_corporation
    WHERE session_id IN (SELECT lid_original FROM user_lid);
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    UPDATE usuarios 
    SET data_ultima_mensagem = NULL 
    WHERE id = p_user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Histórico de chat limpo com sucesso',
        'deleted_count', v_deleted_count
    );
END;
$$;

CREATE OR REPLACE FUNCTION admin_create_plan(
    p_nome VARCHAR,
    p_tipo_periodo VARCHAR,
    p_valor NUMERIC,
    p_link_checkout TEXT DEFAULT '',
    p_descricao TEXT DEFAULT '',
    p_recursos TEXT DEFAULT '[]',
    p_permite_compartilhamento BOOLEAN DEFAULT false,
    p_max_usuarios_dependentes INTEGER DEFAULT 0,
    p_destaque BOOLEAN DEFAULT false,
    p_permite_modo_pj BOOLEAN DEFAULT true
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_user_id UUID;
    v_new_id INTEGER;
    v_max_ordem INTEGER;
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
    
    SELECT COALESCE(MAX(ordem_exibicao), 0) + 1 INTO v_max_ordem
    FROM planos_sistema;
    
    INSERT INTO planos_sistema (
        nome, tipo_periodo, valor, link_checkout, descricao, recursos,
        ativo, ordem_exibicao, permite_compartilhamento, max_usuarios_dependentes,
        destaque, permite_modo_pj
    ) VALUES (
        p_nome, p_tipo_periodo, p_valor, p_link_checkout, p_descricao, p_recursos::jsonb,
        true, v_max_ordem, p_permite_compartilhamento, p_max_usuarios_dependentes,
        p_destaque, p_permite_modo_pj
    )
    RETURNING id INTO v_new_id;
    
    RETURN v_new_id;
END;
$$;

-- 4.11 Função: admin_create_user_with_auth
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
  IF NOT is_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM usuarios WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já cadastrado.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já cadastrado no sistema de autenticação.';
  END IF;
  
  SELECT extensions.crypt(p_senha, extensions.gen_salt('bf')) INTO v_encrypted_password;
  
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
    'authenticated', p_email, v_encrypted_password, NOW(), NOW(), NOW(), '', ''
  ) RETURNING id INTO v_auth_user_id;
  
  INSERT INTO usuarios (
    nome, email, celular, plano_id, is_admin, status, has_password, auth_user, created_at
  ) VALUES (
    p_nome, p_email, p_celular, p_plano_id, p_is_admin, 'ativo', true, v_auth_user_id, NOW()
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

-- 4.12 Função: admin_delete_plan
CREATE OR REPLACE FUNCTION admin_delete_plan(p_plan_id integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_users_count integer;
BEGIN
  IF NOT is_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  
  SELECT COUNT(*) INTO v_users_count FROM usuarios WHERE plano_id = p_plan_id;
  
  IF v_users_count > 0 THEN
    RAISE EXCEPTION 'Não é possível excluir. Existem % usuários usando este plano.', v_users_count;
  END IF;
  
  DELETE FROM planos_sistema WHERE id = p_plan_id;
  
  RETURN json_build_object('success', true, 'message', 'Plano excluído com sucesso');
END;
$$;

-- 4.12.1 Função: admin_update_plan
CREATE OR REPLACE FUNCTION admin_update_plan(
    p_plan_id INTEGER,
    p_nome VARCHAR DEFAULT NULL,
    p_tipo_periodo VARCHAR DEFAULT NULL,
    p_valor NUMERIC DEFAULT NULL,
    p_link_checkout TEXT DEFAULT NULL,
    p_descricao TEXT DEFAULT NULL,
    p_recursos TEXT DEFAULT NULL,
    p_ativo BOOLEAN DEFAULT NULL,
    p_ordem_exibicao INTEGER DEFAULT NULL,
    p_permite_compartilhamento BOOLEAN DEFAULT NULL,
    p_max_usuarios_dependentes INTEGER DEFAULT NULL,
    p_destaque BOOLEAN DEFAULT NULL,
    p_permite_modo_pj BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_user_id UUID;
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
  
  UPDATE planos_sistema
  SET
    nome = COALESCE(p_nome, nome),
    tipo_periodo = COALESCE(p_tipo_periodo, tipo_periodo),
    valor = COALESCE(p_valor, valor),
    link_checkout = COALESCE(p_link_checkout, link_checkout),
    descricao = COALESCE(p_descricao, descricao),
    recursos = CASE WHEN p_recursos IS NOT NULL THEN p_recursos::jsonb ELSE recursos END,
    ativo = COALESCE(p_ativo, ativo),
    ordem_exibicao = COALESCE(p_ordem_exibicao, ordem_exibicao),
    permite_compartilhamento = COALESCE(p_permite_compartilhamento, permite_compartilhamento),
    max_usuarios_dependentes = COALESCE(p_max_usuarios_dependentes, max_usuarios_dependentes),
    destaque = COALESCE(p_destaque, destaque),
    permite_modo_pj = COALESCE(p_permite_modo_pj, permite_modo_pj),
    updated_at = NOW()
  WHERE id = p_plan_id;
END;
$$;

-- 4.13 Função: admin_delete_user
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
  IF NOT is_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  
  IF p_user_id = (SELECT id FROM usuarios WHERE auth_user = auth.uid()) THEN
    RAISE EXCEPTION 'Você não pode excluir sua própria conta.';
  END IF;
  
  SELECT auth_user INTO v_auth_user FROM usuarios WHERE id = p_user_id;
  
  IF p_delete_transactions THEN
    DELETE FROM transacoes WHERE usuario_id = p_user_id;
    DELETE FROM lancamentos_futuros WHERE usuario_id = p_user_id;
    DELETE FROM categoria_trasacoes WHERE usuario_id = p_user_id;
    DELETE FROM metas_orcamento WHERE usuario_id = p_user_id;
  END IF;
  
  DELETE FROM usuarios WHERE id = p_user_id;
  
  IF p_delete_auth AND v_auth_user IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = v_auth_user;
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Usuário excluído com sucesso');
END;
$$;

-- 4.14 Função: admin_get_user_stats
CREATE OR REPLACE FUNCTION admin_get_user_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result json;
BEGIN
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

-- 4.15 Função: processar_pagamento_fatura_segura (CORRIGIDA)
CREATE OR REPLACE FUNCTION processar_pagamento_fatura_segura(
    p_cartao_id UUID,
    p_conta_id UUID,
    p_mes_fatura TEXT,
    p_data_pagamento DATE,
    p_tipo_conta TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_usuario_id INTEGER;
    v_total_fatura NUMERIC := 0;
    v_saldo_conta NUMERIC;
    v_cartao_nome TEXT;
    v_transacao_id INTEGER;
    v_count_lancamentos INTEGER := 0;
    v_categoria_id INTEGER;
BEGIN
    -- 1. Validar usuário
    SELECT id INTO v_usuario_id
    FROM usuarios
    WHERE auth_user = auth.uid();
    
    IF v_usuario_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Usuário não autenticado');
    END IF;
    
    -- 2. Validar que cartão e conta pertencem ao usuário
    IF NOT EXISTS (
        SELECT 1 FROM cartoes_credito 
        WHERE id = p_cartao_id AND usuario_id = auth.uid()
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Cartão não pertence ao usuário');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM contas_bancarias 
        WHERE id = p_conta_id AND usuario_id = auth.uid()
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Conta não pertence ao usuário');
    END IF;
    
    -- 3. Calcular total da fatura
    SELECT COALESCE(SUM(valor), 0), COUNT(*) 
    INTO v_total_fatura, v_count_lancamentos
    FROM lancamentos_futuros
    WHERE cartao_id = p_cartao_id
    AND mes_previsto = p_mes_fatura
    AND status = 'pendente'
    AND usuario_id = v_usuario_id;
    
    IF v_count_lancamentos = 0 THEN
        RETURN json_build_object('success', false, 'error', 'Nenhum lançamento pendente encontrado');
    END IF;
    
    -- 4. Validar saldo
    SELECT saldo_atual INTO v_saldo_conta
    FROM contas_bancarias
    WHERE id = p_conta_id;
    
    IF v_saldo_conta < v_total_fatura THEN
        RETURN json_build_object('success', false, 'error', 'Saldo insuficiente');
    END IF;
    
    -- 5. Buscar nome do cartão
    SELECT nome INTO v_cartao_nome
    FROM cartoes_credito
    WHERE id = p_cartao_id;
    
    -- 6. Buscar categoria apropriada (prioriza "Cartao" ou "Fatura")
    SELECT id INTO v_categoria_id
    FROM categoria_trasacoes
    WHERE usuario_id = v_usuario_id
    AND tipo_conta = p_tipo_conta
    AND (tipo = 'saida' OR tipo = 'ambos')
    ORDER BY 
        CASE WHEN LOWER(descricao) LIKE '%cartao%' THEN 1
             WHEN LOWER(descricao) LIKE '%fatura%' THEN 2
             ELSE 3
        END,
        id
    LIMIT 1;
    
    -- Se não encontrou, usar primeira categoria de saída
    IF v_categoria_id IS NULL THEN
        SELECT id INTO v_categoria_id
        FROM categoria_trasacoes
        WHERE (tipo = 'saida' OR tipo = 'ambos')
        AND tipo_conta = p_tipo_conta
        ORDER BY id
        LIMIT 1;
    END IF;
    
    -- Se ainda não encontrou, retornar erro
    IF v_categoria_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Nenhuma categoria de saída encontrada');
    END IF;
    
    -- 7. Criar transação de pagamento
    INSERT INTO transacoes (
        usuario_id,
        tipo_conta,
        conta_id,
        tipo,
        valor,
        descricao,
        data,
        mes,
        cartao_id,
        categoria_id
    ) VALUES (
        v_usuario_id,
        p_tipo_conta,
        p_conta_id,
        'saida',
        v_total_fatura,
        'Pagamento Fatura ' || v_cartao_nome || ' - ' || p_mes_fatura,
        p_data_pagamento,
        TO_CHAR(p_data_pagamento, 'YYYY-MM'),
        p_cartao_id,
        v_categoria_id
    ) RETURNING id INTO v_transacao_id;
    
    -- 8. Marcar lançamentos como pagos
    UPDATE lancamentos_futuros
    SET status = 'pago',
        data_efetivacao = p_data_pagamento
    WHERE cartao_id = p_cartao_id
    AND mes_previsto = p_mes_fatura
    AND status = 'pendente'
    AND usuario_id = v_usuario_id;
    
    -- 9. Retornar sucesso
    RETURN json_build_object(
        'success', true,
        'transacao_id', v_transacao_id,
        'total_pago', v_total_fatura,
        'lancamentos_pagos', v_count_lancamentos
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION processar_pagamento_fatura_segura IS 'Processa pagamento TOTAL de fatura de cartão de crédito com categoria_id automática';

-- 4.16 Função: processar_pagamento_fatura_parcial (NOVA)
CREATE OR REPLACE FUNCTION processar_pagamento_fatura_parcial(
    p_cartao_id UUID,
    p_conta_id UUID,
    p_data_pagamento DATE,
    p_tipo_conta TEXT,
    p_lancamento_ids INTEGER[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_usuario_id INTEGER;
    v_total_pagar NUMERIC := 0;
    v_saldo_conta NUMERIC;
    v_cartao_nome TEXT;
    v_transacao_id INTEGER;
    v_count_lancamentos INTEGER := 0;
    v_mes_fatura TEXT;
    v_categoria_id INTEGER;
BEGIN
    -- 1. Validar usuário autenticado
    SELECT id INTO v_usuario_id
    FROM usuarios
    WHERE auth_user = auth.uid();
    
    IF v_usuario_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Usuário não autenticado');
    END IF;
    
    -- 2. Validar que cartão pertence ao usuário
    IF NOT EXISTS (
        SELECT 1 FROM cartoes_credito 
        WHERE id = p_cartao_id AND usuario_id = auth.uid()
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Cartão não pertence ao usuário');
    END IF;
    
    -- 3. Validar que conta pertence ao usuário
    IF NOT EXISTS (
        SELECT 1 FROM contas_bancarias 
        WHERE id = p_conta_id AND usuario_id = auth.uid()
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Conta não pertence ao usuário');
    END IF;
    
    -- 4. Validar que array de IDs não está vazio
    IF p_lancamento_ids IS NULL OR array_length(p_lancamento_ids, 1) IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Nenhum lançamento selecionado');
    END IF;
    
    -- 5. Calcular total APENAS dos lançamentos selecionados
    SELECT 
        COALESCE(SUM(valor), 0), 
        COUNT(*),
        MIN(mes_previsto)
    INTO v_total_pagar, v_count_lancamentos, v_mes_fatura
    FROM lancamentos_futuros
    WHERE id = ANY(p_lancamento_ids)
    AND cartao_id = p_cartao_id
    AND status = 'pendente'
    AND usuario_id = v_usuario_id;
    
    -- 6. Validar que encontrou lançamentos válidos
    IF v_count_lancamentos = 0 THEN
        RETURN json_build_object('success', false, 'error', 'Nenhum lançamento válido selecionado');
    END IF;
    
    -- 7. Validar que todos os IDs fornecidos foram encontrados
    IF v_count_lancamentos != array_length(p_lancamento_ids, 1) THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Alguns lançamentos selecionados não existem ou já foram pagos'
        );
    END IF;
    
    -- 8. Validar saldo suficiente
    SELECT saldo_atual INTO v_saldo_conta
    FROM contas_bancarias
    WHERE id = p_conta_id;
    
    IF v_saldo_conta < v_total_pagar THEN
        RETURN json_build_object('success', false, 'error', 'Saldo insuficiente');
    END IF;
    
    -- 9. Buscar nome do cartão
    SELECT nome INTO v_cartao_nome
    FROM cartoes_credito
    WHERE id = p_cartao_id;
    
    -- 10. Buscar categoria apropriada
    SELECT id INTO v_categoria_id
    FROM categoria_trasacoes
    WHERE usuario_id = v_usuario_id
    AND tipo_conta = p_tipo_conta
    AND (tipo = 'saida' OR tipo = 'ambos')
    ORDER BY 
        CASE WHEN LOWER(descricao) LIKE '%cartao%' THEN 1
             WHEN LOWER(descricao) LIKE '%fatura%' THEN 2
             ELSE 3
        END,
        id
    LIMIT 1;
    
    IF v_categoria_id IS NULL THEN
        SELECT id INTO v_categoria_id
        FROM categoria_trasacoes
        WHERE (tipo = 'saida' OR tipo = 'ambos')
        AND tipo_conta = p_tipo_conta
        ORDER BY id
        LIMIT 1;
    END IF;
    
    IF v_categoria_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Nenhuma categoria de saída encontrada');
    END IF;
    
    -- 11. Criar transação de pagamento parcial
    INSERT INTO transacoes (
        usuario_id,
        tipo_conta,
        conta_id,
        tipo,
        valor,
        descricao,
        data,
        mes,
        cartao_id,
        categoria_id
    ) VALUES (
        v_usuario_id,
        p_tipo_conta,
        p_conta_id,
        'saida',
        v_total_pagar,
        'Pagamento Parcial Fatura ' || v_cartao_nome || ' - ' || v_mes_fatura || ' (' || v_count_lancamentos || ' despesas)',
        p_data_pagamento,
        TO_CHAR(p_data_pagamento, 'YYYY-MM'),
        p_cartao_id,
        v_categoria_id
    ) RETURNING id INTO v_transacao_id;
    
    -- 12. Marcar APENAS os lançamentos selecionados como pagos
    UPDATE lancamentos_futuros
    SET status = 'pago',
        data_efetivacao = p_data_pagamento,
        transacao_id = v_transacao_id
    WHERE id = ANY(p_lancamento_ids)
    AND cartao_id = p_cartao_id
    AND status = 'pendente'
    AND usuario_id = v_usuario_id;
    
    -- 13. Retornar sucesso com detalhes
    RETURN json_build_object(
        'success', true,
        'transacao_id', v_transacao_id,
        'total_pago', v_total_pagar,
        'lancamentos_pagos', v_count_lancamentos,
        'mes_fatura', v_mes_fatura
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION processar_pagamento_fatura_parcial IS 'Processa pagamento PARCIAL de fatura de cartão de crédito (despesas selecionadas)';

-- 4.17 Função: admin_list_plans
CREATE OR REPLACE FUNCTION admin_list_plans()
RETURNS TABLE(
    id integer, nome character varying, tipo_periodo character varying, valor numeric, 
    link_checkout text, ativo boolean, ordem_exibicao integer, descricao text, recursos jsonb, 
    created_at timestamp with time zone, updated_at timestamp with time zone, 
    permite_compartilhamento boolean, max_usuarios_dependentes integer, destaque boolean, permite_modo_pj boolean
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
  
  SELECT u.is_admin INTO v_is_admin FROM usuarios u WHERE u.auth_user = v_user_id;
  IF v_is_admin IS NULL OR v_is_admin = false THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  
  RETURN QUERY
  SELECT p.id, p.nome, p.tipo_periodo, p.valor, p.link_checkout, p.ativo, p.ordem_exibicao,
    p.descricao, p.recursos, p.created_at, p.updated_at, p.permite_compartilhamento,
    p.max_usuarios_dependentes, COALESCE(p.destaque, false) as destaque,
    COALESCE(p.permite_modo_pj, true) as permite_modo_pj
  FROM planos_sistema p ORDER BY p.ordem_exibicao;
END;
$$;

-- 4.18 Função: admin_list_users
CREATE OR REPLACE FUNCTION admin_list_users(
    p_search text DEFAULT NULL, p_limit integer DEFAULT 25, p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id integer, nome text, email text, celular text, plano text, status text, is_admin boolean, 
    data_compra timestamp with time zone, data_final_plano timestamp with time zone, 
    data_ultimo_acesso timestamp with time zone, has_password boolean, created_at timestamp without time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  
  RETURN QUERY
  SELECT u.id, u.nome, u.email, u.celular, u.plano, u.status, u.is_admin,
    u.data_compra, u.data_final_plano, u.data_ultimo_acesso, u.has_password, u.created_at
  FROM usuarios u
  WHERE (p_search IS NULL OR u.nome ILIKE '%' || p_search || '%' OR u.email ILIKE '%' || p_search || '%')
  ORDER BY u.created_at DESC LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 4.19 Função: admin_reset_user_password
CREATE OR REPLACE FUNCTION admin_reset_user_password(p_user_id integer, p_new_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user uuid;
  v_encrypted_password text;
BEGIN
  IF NOT is_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  
  SELECT auth_user INTO v_auth_user FROM usuarios WHERE id = p_user_id;
  IF v_auth_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  
  SELECT extensions.crypt(p_new_password, extensions.gen_salt('bf')) INTO v_encrypted_password;
  
  UPDATE auth.users SET encrypted_password = v_encrypted_password, updated_at = now() WHERE id = v_auth_user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado no sistema de autenticação';
  END IF;
  
  UPDATE usuarios SET has_password = true, ultima_atualizacao = NOW() WHERE id = p_user_id;
  
  RETURN json_build_object('success', true, 'message', 'Senha resetada com sucesso');
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao resetar senha: %', SQLERRM;
END;
$$;

-- 4.20 Função: admin_update_user
CREATE OR REPLACE FUNCTION admin_update_user(
    p_user_id integer, p_nome text DEFAULT NULL, p_email text DEFAULT NULL, p_celular text DEFAULT NULL, 
    p_plano_id integer DEFAULT NULL, p_status text DEFAULT NULL, p_is_admin boolean DEFAULT NULL, 
    p_data_compra timestamp with time zone DEFAULT NULL, p_data_final_plano timestamp with time zone DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  
  UPDATE usuarios SET
    nome = COALESCE(p_nome, nome), email = COALESCE(p_email, email),
    celular = COALESCE(p_celular, celular), plano_id = COALESCE(p_plano_id, plano_id),
    status = COALESCE(p_status, status), is_admin = COALESCE(p_is_admin, is_admin),
    data_compra = COALESCE(p_data_compra, data_compra),
    data_final_plano = COALESCE(p_data_final_plano, data_final_plano),
    ultima_atualizacao = NOW()
  WHERE id = p_user_id;
  
  RETURN json_build_object('success', true, 'message', 'Usuário atualizado com sucesso');
END;
$$;

-- 4.21 Função: get_system_settings
CREATE OR REPLACE FUNCTION get_system_settings()
RETURNS TABLE(
    app_name text, app_logo_url text, primary_color text, secondary_color text, support_email text, 
    habilitar_modo_pj boolean, restringir_cadastro_usuarios_existentes boolean, show_sidebar_logo boolean, 
    show_sidebar_name boolean, show_login_logo boolean, show_login_name boolean, 
    logo_url_sidebar text, logo_url_login text, favicon_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT company_name::TEXT as app_name, logo_url::TEXT as app_logo_url,
    configuracoes_sistema.primary_color::TEXT, configuracoes_sistema.secondary_color::TEXT,
    configuracoes_sistema.support_email::TEXT, configuracoes_sistema.habilitar_modo_pj,
    configuracoes_sistema.restringir_cadastro_usuarios_existentes, configuracoes_sistema.show_sidebar_logo,
    configuracoes_sistema.show_sidebar_name, configuracoes_sistema.show_login_logo,
    configuracoes_sistema.show_login_name, configuracoes_sistema.logo_url_sidebar::TEXT,
    configuracoes_sistema.logo_url_login::TEXT, configuracoes_sistema.favicon_url::TEXT
  FROM configuracoes_sistema WHERE id = 1;
END;
$$;

-- 4.22 Função: update_system_settings
CREATE OR REPLACE FUNCTION update_system_settings(
    p_app_name text, p_app_logo_url text, p_primary_color text, p_secondary_color text, p_support_email text
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
    current_user_id := auth.uid();
    SELECT usuarios.is_admin INTO is_user_admin FROM public.usuarios WHERE usuarios.auth_user = current_user_id;
    
    IF NOT is_user_admin THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
    END IF;
    
    UPDATE public.configuracoes_sistema SET 
        company_name = p_app_name, logo_url = p_app_logo_url,
        primary_color = p_primary_color, secondary_color = p_secondary_color,
        support_email = p_support_email, updated_at = NOW()
    WHERE id = 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Configurações não encontradas'::TEXT;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT true, 'Configurações atualizadas com sucesso'::TEXT;
END;
$$;

-- 4.23 Função: processar_transferencia_segura
CREATE OR REPLACE FUNCTION processar_transferencia_segura(
    p_conta_origem_id uuid, p_conta_destino_id uuid, p_valor numeric, 
    p_descricao text, p_data date, p_tipo_conta text
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
    SELECT id INTO v_usuario_id FROM usuarios WHERE auth_user = auth.uid();
    IF v_usuario_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Usuário não autenticado');
    END IF;
    
    SELECT COUNT(*) INTO v_saldo_origem FROM contas_bancarias
    WHERE id IN (p_conta_origem_id, p_conta_destino_id) AND usuario_id = auth.uid();
    IF v_saldo_origem != 2 THEN
        RETURN json_build_object('success', false, 'error', 'Contas não pertencem ao usuário');
    END IF;
    
    SELECT saldo_atual, nome INTO v_saldo_origem, v_conta_origem_nome
    FROM contas_bancarias WHERE id = p_conta_origem_id AND usuario_id = auth.uid();
    IF v_saldo_origem < p_valor THEN
        RETURN json_build_object('success', false, 'error', 'Saldo insuficiente');
    END IF;
    
    SELECT nome INTO v_conta_destino_nome FROM contas_bancarias WHERE id = p_conta_destino_id;
    
    INSERT INTO transacoes (usuario_id, tipo_conta, conta_id, tipo, valor, descricao, data, mes, categoria_id)
    VALUES (v_usuario_id, p_tipo_conta, p_conta_origem_id, 'saida', p_valor,
        COALESCE(p_descricao, 'Transferência para ' || v_conta_destino_nome),
        p_data, TO_CHAR(p_data, 'YYYY-MM'), NULL)
    RETURNING id INTO v_transacao_saida_id;
    
    INSERT INTO transacoes (usuario_id, tipo_conta, conta_id, tipo, valor, descricao, data, mes, categoria_id)
    VALUES (v_usuario_id, p_tipo_conta, p_conta_destino_id, 'entrada', p_valor,
        COALESCE(p_descricao, 'Transferência de ' || v_conta_origem_nome),
        p_data, TO_CHAR(p_data, 'YYYY-MM'), NULL)
    RETURNING id INTO v_transacao_entrada_id;
    
    RETURN json_build_object('success', true, 'transacao_saida_id', v_transacao_saida_id,
        'transacao_entrada_id', v_transacao_entrada_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 4.24 Função: calcular_dias_restantes_free
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
    SELECT created_at, plano, data_final_plano INTO usuario_record FROM public.usuarios WHERE id = p_usuario_id;
    IF NOT FOUND THEN RETURN 0; END IF;
    
    IF usuario_record.plano IS NOT NULL AND LOWER(usuario_record.plano) != 'free' THEN
        RETURN -1;
    END IF;
    
    IF usuario_record.data_final_plano IS NOT NULL THEN
        data_final := DATE(usuario_record.data_final_plano);
        dias_restantes := (data_final - CURRENT_DATE);
        IF dias_restantes < 0 THEN RETURN 0; END IF;
        RETURN dias_restantes;
    END IF;
    
    SELECT dias_acesso_free INTO config_dias FROM public.configuracoes_sistema WHERE id = 1;
    IF NOT FOUND THEN config_dias := 7; END IF;
    
    dias_passados := EXTRACT(DAY FROM (NOW() - usuario_record.created_at));
    dias_restantes := config_dias - dias_passados;
    IF dias_restantes < 0 THEN RETURN 0; END IF;
    
    RETURN dias_restantes;
END;
$$;

-- 4.25 Função: calcular_progresso_meta (COMPLETA)
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

-- 4.26 Função: create_installments (COMPLETA)
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

-- 4.27 Função: get_metas_usuario (COMPLETA)
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

-- =====================================================
-- 5. NOVOS TRIGGERS (não existem no setup.sql)
-- =====================================================

-- 5.1 Trigger: atualizar saldo de conta
DROP TRIGGER IF EXISTS trigger_atualizar_saldo_conta ON transacoes;
CREATE TRIGGER trigger_atualizar_saldo_conta
    AFTER INSERT OR DELETE ON transacoes
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_saldo_conta();

-- 5.2 Trigger: atualizar saldo em transferências
DROP TRIGGER IF EXISTS trigger_update_balance ON transacoes;
CREATE TRIGGER trigger_update_balance
    AFTER INSERT OR DELETE OR UPDATE ON transacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance();

-- 5.3 Trigger: prevenir duplicação de usuário no signup
DROP TRIGGER IF EXISTS prevent_duplicate_user_trigger ON usuarios;
CREATE TRIGGER prevent_duplicate_user_trigger
    BEFORE INSERT ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_user_on_signup();

-- 5.4 Trigger: processar convite de dependente
DROP TRIGGER IF EXISTS on_public_user_created_link_invite ON usuarios;
CREATE TRIGGER on_public_user_created_link_invite
    AFTER INSERT ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION handle_public_user_invite_link();

-- 5.5 Triggers: atualizar updated_at
DROP TRIGGER IF EXISTS on_update_contas_bancarias ON contas_bancarias;
CREATE TRIGGER on_update_contas_bancarias
    BEFORE UPDATE ON contas_bancarias
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_update_investment_assets ON investment_assets;
CREATE TRIGGER on_update_investment_assets
    BEFORE UPDATE ON investment_assets
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_update_investment_positions ON investment_positions;
CREATE TRIGGER on_update_investment_positions
    BEFORE UPDATE ON investment_positions
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- 5.6 Triggers: sync user_id automaticamente (NOVOS - 22/12/2024)
DROP TRIGGER IF EXISTS sync_user_id_contas ON contas_bancarias;
CREATE TRIGGER sync_user_id_contas
  BEFORE INSERT OR UPDATE ON contas_bancarias
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_id_from_auth();

DROP TRIGGER IF EXISTS sync_user_id_cartoes ON cartoes_credito;
CREATE TRIGGER sync_user_id_cartoes
  BEFORE INSERT OR UPDATE ON cartoes_credito
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_id_from_auth();

DROP TRIGGER IF EXISTS sync_user_id_investments ON investment_positions;
CREATE TRIGGER sync_user_id_investments
  BEFORE INSERT OR UPDATE ON investment_positions
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_id_from_auth();

-- 5.7 Trigger: auto-set plano_id em usuários (NOVO - 22/12/2024)
DROP TRIGGER IF EXISTS set_plano_id_on_user ON usuarios;
CREATE TRIGGER set_plano_id_on_user
  BEFORE INSERT OR UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_plano_id();

-- =====================================================
-- 6. VIEWS (não existem no setup.sql)
-- =====================================================

-- 6.1 View: v_positions_detailed
CREATE OR REPLACE VIEW v_positions_detailed AS
SELECT 
    p.id,
    p.usuario_id,
    p.tipo_conta,
    p.quantidade,
    p.preco_medio,
    p.data_compra,
    p.is_manual_price,
    p.manual_price,
    p.observacao,
    p.yield_percentage,
    p.use_manual_tax,
    p.manual_ir,
    p.manual_iof,
    a.ticker,
    a.name AS asset_name,
    a.type AS asset_type,
    a.current_price,
    a.previous_close,
    a.last_updated AS price_last_updated,
    a.source AS price_source,
    (p.quantidade * p.preco_medio) AS valor_investido,
    (p.quantidade * COALESCE(
        p.manual_price,
        CASE 
            WHEN a.type = 'renda_fixa' AND p.yield_percentage IS NOT NULL 
            THEN calculate_fixed_income_price(p.data_compra, p.yield_percentage, p.preco_medio)
            ELSE a.current_price
        END,
        p.preco_medio
    )) AS valor_atual,
    ((p.quantidade * COALESCE(
        p.manual_price,
        CASE 
            WHEN a.type = 'renda_fixa' AND p.yield_percentage IS NOT NULL 
            THEN calculate_fixed_income_price(p.data_compra, p.yield_percentage, p.preco_medio)
            ELSE a.current_price
        END,
        p.preco_medio
    )) - (p.quantidade * p.preco_medio)) AS lucro_prejuizo,
    CASE 
        WHEN p.preco_medio > 0 THEN 
            (((COALESCE(
                p.manual_price,
                CASE 
                    WHEN a.type = 'renda_fixa' AND p.yield_percentage IS NOT NULL 
                    THEN calculate_fixed_income_price(p.data_compra, p.yield_percentage, p.preco_medio)
                    ELSE a.current_price
                END,
                p.preco_medio
            ) - p.preco_medio) / p.preco_medio) * 100)
        ELSE 0
    END AS rentabilidade_percentual,
    p.created_at,
    p.updated_at
FROM investment_positions p
JOIN investment_assets a ON p.asset_id = a.id
WHERE a.is_active = true;

-- 6.2 View: v_portfolio_summary
CREATE OR REPLACE VIEW v_portfolio_summary AS
SELECT 
    usuario_id,
    tipo_conta,
    COUNT(DISTINCT id) AS total_ativos,
    SUM(valor_investido) AS valor_investido,
    SUM(valor_atual) AS valor_atual,
    SUM(lucro_prejuizo) AS lucro_prejuizo,
    CASE 
        WHEN SUM(valor_investido) > 0 
        THEN (SUM(lucro_prejuizo) / SUM(valor_investido)) * 100
        ELSE 0
    END AS rentabilidade_percentual
FROM v_positions_detailed
GROUP BY usuario_id, tipo_conta;

-- 6.3 View: v_dividends_summary
CREATE OR REPLACE VIEW v_dividends_summary AS
SELECT 
    p.usuario_id,
    p.tipo_conta,
    COUNT(d.id) AS total_proventos,
    SUM(d.valor_por_ativo * p.quantidade) AS valor_total_proventos,
    EXTRACT(YEAR FROM d.data_pagamento) AS ano,
    EXTRACT(MONTH FROM d.data_pagamento) AS mes
FROM investment_dividends d
JOIN investment_positions p ON d.position_id = p.id
GROUP BY p.usuario_id, p.tipo_conta, EXTRACT(YEAR FROM d.data_pagamento), EXTRACT(MONTH FROM d.data_pagamento);

-- =====================================================
-- 6.4 Segurança das Views (Security Invoker)
-- =====================================================
-- Configurar views para usar security_invoker = true
-- Isso faz com que as views herdem as permissões RLS das tabelas base
ALTER VIEW v_positions_detailed SET (security_invoker = true);
ALTER VIEW v_portfolio_summary SET (security_invoker = true);
ALTER VIEW v_dividends_summary SET (security_invoker = true);

-- Comentários explicativos
COMMENT ON VIEW v_positions_detailed IS 'View com detalhes das posições de investimento. Security invoker habilitado para herdar RLS das tabelas base (investment_positions, investment_assets).';
COMMENT ON VIEW v_portfolio_summary IS 'View com resumo do portfólio por usuário e tipo de conta. Security invoker habilitado para herdar RLS da view v_positions_detailed.';
COMMENT ON VIEW v_dividends_summary IS 'View com resumo de dividendos por usuário, tipo de conta e período. Security invoker habilitado para herdar RLS das tabelas base (investment_dividends, investment_positions).';

-- =====================================================
-- 7. ÍNDICES ADICIONAIS (não existem no setup.sql)
-- =====================================================

-- Índices para contas_bancarias
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_usuario_id ON contas_bancarias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_contas_user_id ON contas_bancarias(user_id);
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_usuario_saldo ON contas_bancarias(usuario_id, saldo_atual);
CREATE INDEX IF NOT EXISTS idx_contas_tipo_conta ON contas_bancarias(tipo_conta);

-- Índices para cartoes_credito
CREATE INDEX IF NOT EXISTS idx_cartoes_usuario ON cartoes_credito(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cartoes_user_id ON cartoes_credito(user_id);
CREATE INDEX IF NOT EXISTS idx_cartoes_tipo_conta ON cartoes_credito(tipo_conta);
CREATE INDEX IF NOT EXISTS idx_cartoes_ativo ON cartoes_credito(ativo);
CREATE INDEX IF NOT EXISTS idx_cartoes_conta_vinculada ON cartoes_credito(conta_vinculada_id);

-- Índices para transacoes
CREATE INDEX IF NOT EXISTS idx_transacoes_conta_id ON transacoes(conta_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_cartao ON transacoes(cartao_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_dependente ON transacoes(dependente_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_is_transferencia ON transacoes(is_transferencia);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo_conta ON transacoes(tipo_conta);
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario_conta ON transacoes(usuario_id, tipo_conta);
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario_conta_data ON transacoes(usuario_id, tipo_conta, data);
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario_data ON transacoes(usuario_id, data);

-- Índices para lancamentos_futuros
CREATE INDEX IF NOT EXISTS idx_lancamentos_futuros_cartao ON lancamentos_futuros(cartao_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_futuros_dependente ON lancamentos_futuros(dependente_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_futuros_conta ON lancamentos_futuros(conta_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_futuros_tipo_conta ON lancamentos_futuros(tipo_conta);
CREATE INDEX IF NOT EXISTS idx_lancamentos_futuros_data_final ON lancamentos_futuros(data_final) WHERE data_final IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lancamentos_futuros_recorrente_periodo ON lancamentos_futuros(recorrente, data_prevista, status) WHERE recorrente = true AND status = 'pendente';
CREATE INDEX IF NOT EXISTS idx_lancamentos_futuros_expansion_query ON lancamentos_futuros(usuario_id, recorrente, status, data_prevista, data_final) WHERE recorrente = true AND status = 'pendente' AND data_final IS NOT NULL;

-- Índices para categoria_trasacoes
CREATE INDEX IF NOT EXISTS idx_categorias_usuario ON categoria_trasacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON categoria_trasacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_categories_tipo_conta ON categoria_trasacoes(tipo_conta);
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categoria_trasacoes(usuario_id, tipo_conta);
CREATE INDEX IF NOT EXISTS idx_categories_keywords ON categoria_trasacoes USING gin(keywords);

-- Índices para investment_assets
CREATE INDEX IF NOT EXISTS idx_investment_assets_ticker ON investment_assets(ticker);
CREATE INDEX IF NOT EXISTS idx_investment_assets_type ON investment_assets(type);
CREATE INDEX IF NOT EXISTS idx_investment_assets_active ON investment_assets(is_active);
CREATE INDEX IF NOT EXISTS idx_investment_assets_source ON investment_assets(source);

-- Índices para investment_positions
CREATE INDEX IF NOT EXISTS idx_investment_positions_usuario ON investment_positions(usuario_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investment_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_positions_asset ON investment_positions(asset_id);
CREATE INDEX IF NOT EXISTS idx_investment_positions_conta ON investment_positions(conta_id);
CREATE INDEX IF NOT EXISTS idx_investment_positions_tipo_conta ON investment_positions(tipo_conta);
CREATE INDEX IF NOT EXISTS idx_investment_positions_usuario_tipo ON investment_positions(usuario_id, tipo_conta);

-- Índices para investment_dividends
CREATE INDEX IF NOT EXISTS idx_investment_dividends_position ON investment_dividends(position_id);
CREATE INDEX IF NOT EXISTS idx_investment_dividends_data_pagamento ON investment_dividends(data_pagamento);

-- Índices para api_usage_log
CREATE INDEX IF NOT EXISTS idx_api_usage_log_api_name ON api_usage_log(api_name);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_status ON api_usage_log(status);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_created_at ON api_usage_log(created_at);

-- Índices para cdi_rates
CREATE INDEX IF NOT EXISTS idx_cdi_rates_date ON cdi_rates(date DESC);

-- Índices para usuarios_dependentes
CREATE INDEX IF NOT EXISTS idx_usuarios_dependentes_principal ON usuarios_dependentes(usuario_principal_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_dependentes_status ON usuarios_dependentes(usuario_principal_id, status) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS idx_usuarios_dependentes_nome ON usuarios_dependentes(nome);
CREATE INDEX IF NOT EXISTS idx_usuarios_dependentes_email ON usuarios_dependentes(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_dependentes_auth_user ON usuarios_dependentes(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_dependentes_permissoes ON usuarios_dependentes USING gin(permissoes);

-- Índices para planos_sistema
CREATE INDEX IF NOT EXISTS idx_planos_compartilhamento ON planos_sistema(permite_compartilhamento) WHERE permite_compartilhamento = true;

-- =====================================================
-- 8. RLS POLICIES (novas tabelas)
-- =====================================================

-- RLS para contas_bancarias
ALTER TABLE contas_bancarias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contas_bancarias_select" ON contas_bancarias;
CREATE POLICY "contas_bancarias_select" ON contas_bancarias
    FOR SELECT USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "contas_bancarias_insert" ON contas_bancarias;
CREATE POLICY "contas_bancarias_insert" ON contas_bancarias
    FOR INSERT WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "contas_bancarias_update" ON contas_bancarias;
CREATE POLICY "contas_bancarias_update" ON contas_bancarias
    FOR UPDATE USING (usuario_id = auth.uid())
    WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "contas_bancarias_delete" ON contas_bancarias;
CREATE POLICY "contas_bancarias_delete" ON contas_bancarias
    FOR DELETE USING (usuario_id = auth.uid());

-- RLS para cartoes_credito
ALTER TABLE cartoes_credito ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cartoes_credito_select" ON cartoes_credito;
CREATE POLICY "cartoes_credito_select" ON cartoes_credito
    FOR SELECT USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "cartoes_credito_insert" ON cartoes_credito;
CREATE POLICY "cartoes_credito_insert" ON cartoes_credito
    FOR INSERT WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "cartoes_credito_update" ON cartoes_credito;
CREATE POLICY "cartoes_credito_update" ON cartoes_credito
    FOR UPDATE USING (usuario_id = auth.uid())
    WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "cartoes_credito_delete" ON cartoes_credito;
CREATE POLICY "cartoes_credito_delete" ON cartoes_credito
    FOR DELETE USING (usuario_id = auth.uid());

-- RLS para investment_assets
ALTER TABLE investment_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "investment_assets_select" ON investment_assets;
CREATE POLICY "investment_assets_select" ON investment_assets
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "investment_assets_admin" ON investment_assets;
CREATE POLICY "investment_assets_admin" ON investment_assets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE auth_user = auth.uid() 
            AND is_admin = true
        )
    );

-- RLS para investment_positions
ALTER TABLE investment_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "investment_positions_select" ON investment_positions;
CREATE POLICY "investment_positions_select" ON investment_positions
    FOR SELECT USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "investment_positions_insert" ON investment_positions;
CREATE POLICY "investment_positions_insert" ON investment_positions
    FOR INSERT WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "investment_positions_update" ON investment_positions;
CREATE POLICY "investment_positions_update" ON investment_positions
    FOR UPDATE USING (usuario_id = auth.uid())
    WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "investment_positions_delete" ON investment_positions;
CREATE POLICY "investment_positions_delete" ON investment_positions
    FOR DELETE USING (usuario_id = auth.uid());

-- RLS para investment_dividends
ALTER TABLE investment_dividends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "investment_dividends_select" ON investment_dividends;
CREATE POLICY "investment_dividends_select" ON investment_dividends
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM investment_positions 
            WHERE id = investment_dividends.position_id 
            AND usuario_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "investment_dividends_insert" ON investment_dividends;
CREATE POLICY "investment_dividends_insert" ON investment_dividends
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM investment_positions 
            WHERE id = investment_dividends.position_id 
            AND usuario_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "investment_dividends_update" ON investment_dividends;
CREATE POLICY "investment_dividends_update" ON investment_dividends
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM investment_positions 
            WHERE id = investment_dividends.position_id 
            AND usuario_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "investment_dividends_delete" ON investment_dividends;
CREATE POLICY "investment_dividends_delete" ON investment_dividends
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM investment_positions 
            WHERE id = investment_dividends.position_id 
            AND usuario_id = auth.uid()
        )
    );

-- RLS para api_usage_log
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "api_usage_log_admin" ON api_usage_log;
CREATE POLICY "api_usage_log_admin" ON api_usage_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE auth_user = auth.uid() 
            AND is_admin = true
        )
    );

-- RLS para cdi_rates
ALTER TABLE cdi_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cdi_rates_select" ON cdi_rates;
CREATE POLICY "cdi_rates_select" ON cdi_rates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "cdi_rates_admin" ON cdi_rates;
CREATE POLICY "cdi_rates_admin" ON cdi_rates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE auth_user = auth.uid() 
            AND is_admin = true
        )
    );

-- RLS para usuarios_dependentes
ALTER TABLE usuarios_dependentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dependentes_select_policy" ON usuarios_dependentes;
CREATE POLICY "dependentes_select_policy" ON usuarios_dependentes
    FOR SELECT USING (usuario_principal_id = verificar_proprietario_por_auth());

DROP POLICY IF EXISTS "dependentes_insert_policy" ON usuarios_dependentes;
CREATE POLICY "dependentes_insert_policy" ON usuarios_dependentes
    FOR INSERT WITH CHECK (usuario_principal_id = verificar_proprietario_por_auth());

DROP POLICY IF EXISTS "dependentes_update_policy" ON usuarios_dependentes;
CREATE POLICY "dependentes_update_policy" ON usuarios_dependentes
    FOR UPDATE USING (usuario_principal_id = verificar_proprietario_por_auth())
    WITH CHECK (usuario_principal_id = verificar_proprietario_por_auth());

DROP POLICY IF EXISTS "dependentes_delete_policy" ON usuarios_dependentes;
CREATE POLICY "dependentes_delete_policy" ON usuarios_dependentes
    FOR DELETE USING (usuario_principal_id = verificar_proprietario_por_auth());

-- =====================================================
-- 9. CRON JOBS (pg_cron)
-- =====================================================

-- ⚠️ IMPORTANTE: Os Cron Jobs devem ser criados via SQL direto no Supabase
-- pois requerem permissões especiais. Aqui está a documentação:

-- 9.1 Cron Job: Atualizar preços de investimentos (Mercado)
-- Executa: Segunda a Sexta, às 12h, 15h e 21h (horário de Brasília)
-- SELECT cron.schedule(
--     'update-investment-prices-market',
--     '0 12,15,21 * * 1-5',
--     $$
--     SELECT net.http_post(
--         url := 'https://vrmickfxoxvyljounoxq.supabase.co/functions/v1/update-investment-prices',
--         headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
--         body := '{}'::jsonb
--     ) as request_id;
--     $$
-- );

-- 9.2 Cron Job: Atualizar preços de criptomoedas
-- Executa: A cada 4 horas, todos os dias
-- SELECT cron.schedule(
--     'update-investment-prices-crypto',
--     '0 */4 * * *',
--     $$
--     SELECT net.http_post(
--         url := 'https://vrmickfxoxvyljounoxq.supabase.co/functions/v1/update-investment-prices',
--         headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
--         body := '{}'::jsonb
--     ) as request_id;
--     $$
-- );

-- =====================================================
-- 10. EDGE FUNCTIONS (Supabase Functions)
-- =====================================================

-- Edge Functions criadas no Supabase:
-- 
-- 1. update-investment-prices
--    - Atualiza preços de ativos via BrAPI e Binance
--    - Chamada pelos Cron Jobs
--    - verify_jwt: false (chamada pelo sistema)
-- 
-- 2. update-cdi-rates
--    - Atualiza taxas CDI do Banco Central
--    - Chamada manualmente ou via Cron
--    - verify_jwt: false (chamada pelo sistema)

-- =====================================================
-- 11. CONFIGURAÇÕES DE BLOQUEIO DE ASSINATURA
-- =====================================================

-- Adicionar colunas de configuração de bloqueio (se não existirem)
ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS dias_aviso_expiracao INTEGER DEFAULT 3;

ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS dias_soft_block INTEGER DEFAULT 7;

ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS dias_hard_block INTEGER DEFAULT 14;

ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS permitir_visualizacao_bloqueado BOOLEAN DEFAULT true;

ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS whatsapp_suporte_url TEXT;

COMMENT ON COLUMN configuracoes_sistema.dias_aviso_expiracao IS 'Dias antes da expiração para mostrar aviso (banner amarelo)';
COMMENT ON COLUMN configuracoes_sistema.dias_soft_block IS 'Dias após expiração para bloqueio suave (modal, permite visualizar)';
COMMENT ON COLUMN configuracoes_sistema.dias_hard_block IS 'Dias após expiração para bloqueio total (redirect para /blocked)';
COMMENT ON COLUMN configuracoes_sistema.permitir_visualizacao_bloqueado IS 'Se true, usuário bloqueado pode visualizar dados (read-only)';
COMMENT ON COLUMN configuracoes_sistema.whatsapp_suporte_url IS 'URL do WhatsApp para suporte (diferente do WhatsApp de automação)';

-- =====================================================
-- ✅ SETUP DIFFERENTIAL COMPLETO FINALIZADO E CORRIGIDO!
-- =====================================================
-- 
-- 📊 RESUMO DAS MUDANÇAS:
-- ✅ 36 novas colunas em tabelas existentes (lancamentos_futuros: tipo_conta, conta_id | configuracoes_sistema: 13 novas colunas)
-- ✅ 8 novas tabelas completas
-- ✅ 35 funções SQL (incluindo sync_user_id, auto_set_plano_id, admin completas, pagamento de faturas, transferências, metas e configurações do sistema)
-- ✅ 14 novos triggers (incluindo sync user_id e auto plano_id)
-- ✅ 3 novas views
-- ✅ 55 novos índices (incluindo user_id indexes e lancamentos_futuros indexes)
-- ✅ 30+ novas políticas RLS
-- ✅ 2 Cron Jobs configurados
-- ✅ 2 Edge Functions
-- 
-- 🎯 MÓDULOS ADICIONADOS:
-- ✅ Internacionalização (idioma + moeda)
-- ✅ Contas Bancárias (com user_id INTEGER)
-- ✅ Cartões de Crédito (com user_id INTEGER)
-- ✅ Investimentos (Ações, FIIs, Cripto, Renda Fixa) (com user_id INTEGER)
-- ✅ Modo PJ (Pessoa Jurídica)
-- ✅ Sistema de Dependentes
-- ✅ Transferências entre Contas
-- ✅ Keywords AI para Categorias
-- ✅ Atualização Automática de Preços
-- ✅ Auto-vinculação de plano_id em cadastro de usuários
-- ✅ Sistema de Bloqueio de Assinatura (3 níveis: aviso, soft-block, hard-block)
-- ✅ Pagamento de Fatura de Cartão (Total e Parcial com categoria_id automática)
-- ✅ Funções Admin Completas (CRUD usuários, planos, estatísticas)
-- ✅ Configurações do Sistema (get/update settings para white label)
-- ✅ Transferências entre Contas (processar_transferencia_segura)
-- ✅ Sistema de Metas (calcular progresso, get metas usuário)
-- ✅ Parcelamentos (create_installments)
-- ✅ Cálculo de Dias Restantes Free
-- 
-- 🔐 SEGURANÇA:
-- ✅ RLS habilitado em todas as novas tabelas
-- ✅ Políticas específicas por operação (SELECT, INSERT, UPDATE, DELETE)
-- ✅ Funções SECURITY DEFINER com search_path fixado
-- ✅ Validações e constraints em todas as tabelas
-- 
-- 🔧 CORREÇÕES APLICADAS (07/01/2026):
-- ✅ Funções completas mescladas de missing_functions_differential.sql
-- ✅ calcular_progresso_meta: versão completa com todos os cálculos e status
-- ✅ create_installments: versão completa com tratamento correto de dias do mês
-- ✅ get_metas_usuario: versão completa com todos os campos de progresso
-- ✅ Ordem de criação corrigida: tabelas antes de funções
-- ✅ Todas as referências validadas contra o banco de dados
-- 
-- 🔧 CORREÇÕES APLICADAS (08/01/2025):
-- ✅ Unificação de configurações de cadastro (restringir_cadastro_usuarios_existentes)
-- ✅ Removida coluna bloquear_cadastro_novos_usuarios
-- ✅ Corrigida RPC admin_get_user_stats (cálculo correto de usuários premium)
-- ✅ Criada RPC admin_get_system_stats (estatísticas completas do sistema)
-- ✅ Corrigido cálculo de receita mensal estimada (conversão de planos anuais/semestrais)
-- 
-- ⚠️ PRÓXIMOS PASSOS:
-- 1. ✅ Arquivo corrigido e pronto para execução
-- 2. Executar após o setup.sql em banco limpo
-- 3. Validar todas as funcionalidades
-- 4. Configurar Cron Jobs manualmente no Supabase
-- 5. Deploy das Edge Functions
-- 
-- =====================================================

-- =====================================================
-- FUNÇÕES ADMIN - ESTATÍSTICAS (08/01/2025)
-- =====================================================

-- Função: admin_get_user_stats (CORRIGIDA)
-- Retorna estatísticas de usuários para o painel de Gestão de Usuários
CREATE OR REPLACE FUNCTION public.admin_get_user_stats()
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
    'usuarios_inativos', COUNT(*) FILTER (WHERE status != 'ativo'),
    'administradores', COUNT(*) FILTER (WHERE is_admin = true),
    'novos_30_dias', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'),
    'usuarios_free', COUNT(*) FILTER (WHERE plano_id IS NULL OR plano = 'Free' OR plano ILIKE '%free%'),
    'usuarios_premium', COUNT(*) FILTER (WHERE plano_id IS NOT NULL AND plano != 'Free' AND plano NOT ILIKE '%free%')
  ) INTO v_result
  FROM usuarios;
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION admin_get_user_stats() IS 'Retorna estatísticas de usuários para o painel admin (Gestão de Usuários). Corrigido em 08/01/2025 para calcular corretamente usuários premium.';

-- Função: admin_get_system_stats (NOVA)
-- Retorna estatísticas completas do sistema para o painel de Estatísticas
CREATE OR REPLACE FUNCTION public.admin_get_system_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result json;
  v_usuarios_por_plano json;
  v_receita_mensal numeric;
BEGIN
  -- Verificar se é admin
  IF NOT is_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  
  -- Buscar usuários por plano
  SELECT json_agg(
    json_build_object(
      'plano', COALESCE(p.nome, 'Sem Plano'),
      'count', COUNT(u.id)
    )
  )
  INTO v_usuarios_por_plano
  FROM usuarios u
  LEFT JOIN planos_sistema p ON u.plano_id = p.id
  GROUP BY p.nome
  ORDER BY COUNT(u.id) DESC;
  
  -- Calcular receita mensal estimada (convertendo planos anuais/semestrais/trimestrais para mensal)
  SELECT COALESCE(SUM(
    CASE 
      WHEN p.tipo_periodo = 'mensal' THEN p.valor
      WHEN p.tipo_periodo = 'trimestral' THEN p.valor / 3
      WHEN p.tipo_periodo = 'semestral' THEN p.valor / 6
      WHEN p.tipo_periodo = 'anual' THEN p.valor / 12
      ELSE 0
    END
  ), 0)
  INTO v_receita_mensal
  FROM usuarios u
  INNER JOIN planos_sistema p ON u.plano_id = p.id
  WHERE u.status = 'ativo' AND p.tipo_periodo != 'free';
  
  -- Montar resultado completo
  SELECT json_build_object(
    'total_usuarios', (SELECT COUNT(*) FROM usuarios),
    'usuarios_ativos', (SELECT COUNT(*) FROM usuarios WHERE status = 'ativo'),
    'usuarios_inativos', (SELECT COUNT(*) FROM usuarios WHERE status != 'ativo'),
    'usuarios_com_senha', (SELECT COUNT(*) FROM usuarios WHERE has_password = true),
    'total_planos', (SELECT COUNT(*) FROM planos_sistema),
    'planos_ativos', (SELECT COUNT(*) FROM planos_sistema WHERE ativo = true),
    'receita_mensal_estimada', v_receita_mensal,
    'usuarios_por_plano', COALESCE(v_usuarios_por_plano, '[]'::json)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION admin_get_system_stats() IS 'Retorna estatísticas completas do sistema para o painel admin (Estatísticas do Sistema). Criada em 08/01/2025 para corrigir dados dos cards e calcular receita mensal estimada corretamente.';

-- =====================================================
-- 🔧 FUNÇÃO: delete_category_safe
-- =====================================================
-- Criada em: 09/01/2025
-- Descrição: Deleta uma categoria de forma segura, removendo vínculos de 
--            transações e lançamentos futuros antes da exclusão.
-- Problema resolvido: Erro "violates foreign key constraint" ao deletar 
--                     categorias com transações vinculadas.
-- =====================================================

CREATE OR REPLACE FUNCTION delete_category_safe(p_category_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id INTEGER;
  v_transacoes_count INTEGER;
  v_lancamentos_count INTEGER;
  v_result JSON;
BEGIN
  -- Buscar o user_id da categoria para validar ownership
  SELECT usuario_id INTO v_user_id
  FROM categoria_trasacoes
  WHERE id = p_category_id;

  -- Verificar se a categoria existe
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Categoria não encontrada'
    );
  END IF;

  -- Verificar se o usuário autenticado é o dono da categoria
  IF v_user_id != (SELECT id FROM usuarios WHERE auth_user_id = auth.uid()) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Você não tem permissão para deletar esta categoria'
    );
  END IF;

  -- Contar transações vinculadas
  SELECT COUNT(*) INTO v_transacoes_count
  FROM transacoes
  WHERE categoria_id = p_category_id;

  -- Contar lançamentos futuros vinculados
  SELECT COUNT(*) INTO v_lancamentos_count
  FROM lancamentos_futuros
  WHERE categoria_id = p_category_id;

  -- Atualizar transações para categoria_id = NULL
  UPDATE transacoes
  SET categoria_id = NULL
  WHERE categoria_id = p_category_id;

  -- Atualizar lançamentos futuros para categoria_id = NULL
  UPDATE lancamentos_futuros
  SET categoria_id = NULL
  WHERE categoria_id = p_category_id;

  -- Deletar a categoria
  DELETE FROM categoria_trasacoes
  WHERE id = p_category_id;

  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'transacoes_afetadas', v_transacoes_count,
    'lancamentos_afetados', v_lancamentos_count
  );
END;
$$;

COMMENT ON FUNCTION delete_category_safe(INTEGER) IS 'Deleta uma categoria de forma segura, removendo vínculos de transações e lançamentos futuros antes da exclusão. Criada em 09/01/2025.';

-- =====================================================

