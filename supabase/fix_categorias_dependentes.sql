-- =====================================================
-- CORREÇÃO: Políticas RLS de Categorias para Dependentes
-- =====================================================
-- Data: 10/01/2026
-- Problema: Dependentes não conseguem criar/editar categorias
-- Causa: Políticas RLS bloqueiam INSERT/UPDATE/DELETE para dependentes
-- Solução: Adicionar políticas para dependentes com permissões
-- =====================================================

-- Política INSERT para dependentes (CORRIGIDA)
CREATE POLICY "categorias_insert_dependentes" ON categoria_trasacoes
FOR INSERT WITH CHECK (
  usuario_id IN (
    SELECT d.usuario_principal_id
    FROM usuarios_dependentes d
    WHERE d.auth_user_id = auth.uid() 
      AND d.status = 'ativo'
      AND (
        (d.permissoes->>'pode_criar_transacoes')::boolean = true
        OR (d.permissoes->>'pode_ver_dados_admin')::boolean = true
      )
  )
);

-- Política UPDATE para dependentes (CORRIGIDA)
CREATE POLICY "categorias_update_dependentes" ON categoria_trasacoes
FOR UPDATE USING (
  usuario_id IN (
    SELECT d.usuario_principal_id
    FROM usuarios_dependentes d
    WHERE d.auth_user_id = auth.uid() 
      AND d.status = 'ativo'
      AND (
        (d.permissoes->>'pode_criar_transacoes')::boolean = true
        OR (d.permissoes->>'pode_ver_dados_admin')::boolean = true
      )
  )
)
WITH CHECK (
  usuario_id IN (
    SELECT d.usuario_principal_id
    FROM usuarios_dependentes d
    WHERE d.auth_user_id = auth.uid() 
      AND d.status = 'ativo'
      AND (
        (d.permissoes->>'pode_criar_transacoes')::boolean = true
        OR (d.permissoes->>'pode_ver_dados_admin')::boolean = true
      )
  )
);

-- Política DELETE para dependentes (apenas com permissão admin)
CREATE POLICY "categorias_delete_dependentes" ON categoria_trasacoes
FOR DELETE USING (
  usuario_id IN (
    SELECT d.usuario_principal_id
    FROM usuarios_dependentes d
    WHERE d.auth_user_id = auth.uid() 
      AND d.status = 'ativo'
      AND (d.permissoes->>'pode_ver_dados_admin')::boolean = true
  )
);

-- =====================================================
-- RESULTADO ESPERADO:
-- 1. Dependentes com permissão podem criar categorias
-- 2. Dependentes com permissão podem editar categorias
-- 3. Dependentes com permissão admin podem deletar categorias
-- 4. Categorias criadas terão usuario_id do principal
-- 5. Categorias são compartilhadas entre principal e dependentes
-- =====================================================
