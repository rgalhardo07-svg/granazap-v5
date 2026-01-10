-- =====================================================
-- CORREÇÃO: Políticas RLS de Contas e Cartões para Dependentes
-- =====================================================
-- Execute esta query nos ambientes de alunos para permitir que
-- dependentes gerenciem contas bancárias e cartões de crédito do principal
-- 
-- Data: 10/01/2026
-- Problema: Dependentes não conseguem criar/editar contas e cartões
-- Causa: Políticas RLS usavam auth.uid() direto, não verificavam dependentes
-- Solução: Adicionar subquery para verificar se usuário é dependente com permissão
-- =====================================================

-- =====================================================
-- CONTAS BANCÁRIAS
-- =====================================================

DROP POLICY IF EXISTS "contas_bancarias_insert" ON contas_bancarias;
CREATE POLICY "contas_bancarias_insert" ON contas_bancarias
    FOR INSERT WITH CHECK (
        usuario_id = auth.uid()
        OR usuario_id IN (
            SELECT u.auth_user
            FROM usuarios u
            JOIN usuarios_dependentes d ON d.usuario_principal_id = u.id
            WHERE d.auth_user_id = auth.uid()
              AND d.status = 'ativo'
              AND (
                  (d.permissoes->>'pode_gerenciar_contas')::boolean = true
                  OR (d.permissoes->>'pode_ver_dados_admin')::boolean = true
              )
        )
    );

DROP POLICY IF EXISTS "contas_bancarias_update" ON contas_bancarias;
CREATE POLICY "contas_bancarias_update" ON contas_bancarias
    FOR UPDATE USING (
        usuario_id = auth.uid()
        OR usuario_id IN (
            SELECT u.auth_user
            FROM usuarios u
            JOIN usuarios_dependentes d ON d.usuario_principal_id = u.id
            WHERE d.auth_user_id = auth.uid()
              AND d.status = 'ativo'
              AND (
                  (d.permissoes->>'pode_gerenciar_contas')::boolean = true
                  OR (d.permissoes->>'pode_ver_dados_admin')::boolean = true
              )
        )
    )
    WITH CHECK (
        usuario_id = auth.uid()
        OR usuario_id IN (
            SELECT u.auth_user
            FROM usuarios u
            JOIN usuarios_dependentes d ON d.usuario_principal_id = u.id
            WHERE d.auth_user_id = auth.uid()
              AND d.status = 'ativo'
              AND (
                  (d.permissoes->>'pode_gerenciar_contas')::boolean = true
                  OR (d.permissoes->>'pode_ver_dados_admin')::boolean = true
              )
        )
    );

DROP POLICY IF EXISTS "contas_bancarias_delete" ON contas_bancarias;
CREATE POLICY "contas_bancarias_delete" ON contas_bancarias
    FOR DELETE USING (
        usuario_id = auth.uid()
        OR usuario_id IN (
            SELECT u.auth_user
            FROM usuarios u
            JOIN usuarios_dependentes d ON d.usuario_principal_id = u.id
            WHERE d.auth_user_id = auth.uid()
              AND d.status = 'ativo'
              AND (
                  (d.permissoes->>'pode_gerenciar_contas')::boolean = true
                  OR (d.permissoes->>'pode_ver_dados_admin')::boolean = true
              )
        )
    );

-- =====================================================
-- CARTÕES DE CRÉDITO
-- =====================================================

DROP POLICY IF EXISTS "cartoes_credito_insert" ON cartoes_credito;
CREATE POLICY "cartoes_credito_insert" ON cartoes_credito
    FOR INSERT WITH CHECK (
        usuario_id = auth.uid()
        OR usuario_id IN (
            SELECT u.auth_user
            FROM usuarios u
            JOIN usuarios_dependentes d ON d.usuario_principal_id = u.id
            WHERE d.auth_user_id = auth.uid()
              AND d.status = 'ativo'
              AND (
                  (d.permissoes->>'pode_gerenciar_cartoes')::boolean = true
                  OR (d.permissoes->>'pode_ver_dados_admin')::boolean = true
              )
        )
    );

DROP POLICY IF EXISTS "cartoes_credito_update" ON cartoes_credito;
CREATE POLICY "cartoes_credito_update" ON cartoes_credito
    FOR UPDATE USING (
        usuario_id = auth.uid()
        OR usuario_id IN (
            SELECT u.auth_user
            FROM usuarios u
            JOIN usuarios_dependentes d ON d.usuario_principal_id = u.id
            WHERE d.auth_user_id = auth.uid()
              AND d.status = 'ativo'
              AND (
                  (d.permissoes->>'pode_gerenciar_cartoes')::boolean = true
                  OR (d.permissoes->>'pode_ver_dados_admin')::boolean = true
              )
        )
    );

DROP POLICY IF EXISTS "cartoes_credito_delete" ON cartoes_credito;
CREATE POLICY "cartoes_credito_delete" ON cartoes_credito
    FOR DELETE USING (
        usuario_id = auth.uid()
        OR usuario_id IN (
            SELECT u.auth_user
            FROM usuarios u
            JOIN usuarios_dependentes d ON d.usuario_principal_id = u.id
            WHERE d.auth_user_id = auth.uid()
              AND d.status = 'ativo'
              AND (
                  (d.permissoes->>'pode_gerenciar_cartoes')::boolean = true
                  OR (d.permissoes->>'pode_ver_dados_admin')::boolean = true
              )
        )
    );

-- =====================================================
-- RESULTADO ESPERADO:
-- Políticas atualizadas com sucesso
-- Agora dependentes podem gerenciar contas e cartões do principal
-- se tiverem as permissões:
-- - pode_gerenciar_contas = true (para contas)
-- - pode_gerenciar_cartoes = true (para cartões)
-- - OU pode_ver_dados_admin = true (acesso total)
-- =====================================================
