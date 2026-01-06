-- Migration: Adicionar função para pagamento parcial de fatura
-- Data: 2026-01-06
-- Descrição: Permite pagar apenas despesas selecionadas da fatura do cartão
-- IMPORTANTE: NÃO modifica a função existente processar_pagamento_fatura_segura

-- ============================================================================
-- FUNÇÃO: processar_pagamento_fatura_parcial
-- ============================================================================
-- Permite selecionar quais despesas da fatura serão pagas
-- Recebe array de IDs dos lançamentos a serem pagos
-- ============================================================================

CREATE OR REPLACE FUNCTION processar_pagamento_fatura_parcial(
    p_cartao_id UUID,
    p_conta_id UUID,
    p_data_pagamento DATE,
    p_tipo_conta TEXT,
    p_lancamento_ids INTEGER[] -- Array de IDs selecionados
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usuario_id INTEGER;
    v_total_pagar NUMERIC := 0;
    v_saldo_conta NUMERIC;
    v_cartao_nome TEXT;
    v_transacao_id INTEGER;
    v_count_lancamentos INTEGER := 0;
    v_mes_fatura TEXT;
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
    -- E validar que todos pertencem ao usuário e estão pendentes
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
    
    -- 10. Criar transação de pagamento parcial
    -- O trigger 'atualizar_saldo_conta' automaticamente debita o saldo
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
        NULL
    ) RETURNING id INTO v_transacao_id;
    
    -- 11. Marcar APENAS os lançamentos selecionados como pagos
    UPDATE lancamentos_futuros
    SET status = 'pago',
        data_efetivacao = p_data_pagamento,
        transacao_id = v_transacao_id
    WHERE id = ANY(p_lancamento_ids)
    AND cartao_id = p_cartao_id
    AND status = 'pendente'
    AND usuario_id = v_usuario_id;
    
    -- 12. Retornar sucesso com detalhes
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

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON FUNCTION processar_pagamento_fatura_parcial IS 
'Processa pagamento parcial de fatura de cartão de crédito.
Permite selecionar quais despesas específicas serão pagas.
O saldo da conta é atualizado automaticamente pelo trigger atualizar_saldo_conta.
Validações incluem: autenticação, propriedade, saldo suficiente, e status dos lançamentos.';

-- ============================================================================
-- GRANTS (Segurança)
-- ============================================================================

-- Revogar acesso público
REVOKE ALL ON FUNCTION processar_pagamento_fatura_parcial FROM PUBLIC;

-- Permitir apenas usuários autenticados
GRANT EXECUTE ON FUNCTION processar_pagamento_fatura_parcial TO authenticated;
