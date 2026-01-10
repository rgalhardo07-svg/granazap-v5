-- =====================================================
-- CORREÇÃO: Função delete_category_safe
-- =====================================================
-- Data: 10/01/2026
-- Problema: Erro "column auth_user_id does not exist" ao deletar categoria
-- Causa: Função antiga usa auth_user_id em vez de auth_user
-- Solução: Corrigir para usar auth_user (coluna correta da tabela usuarios)
-- =====================================================

CREATE OR REPLACE FUNCTION delete_category_safe(p_category_id integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id INTEGER;
  v_transacoes_count INTEGER;
  v_lancamentos_count INTEGER;
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

  -- CORRIGIDO: Usar auth_user em vez de auth_user_id
  IF v_user_id != (SELECT id FROM usuarios WHERE auth_user = auth.uid()) THEN
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

-- =====================================================
-- RESULTADO ESPERADO:
-- 1. Usuário principal consegue deletar suas categorias
-- 2. Transações vinculadas ficam sem categoria (NULL)
-- 3. Lançamentos futuros vinculados ficam sem categoria (NULL)
-- 4. Erro "auth_user_id does not exist" resolvido
-- =====================================================
