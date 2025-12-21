-- ============================================
-- ÍNDICES PARA OTIMIZAÇÃO DE PERFORMANCE
-- Execute estes comandos no SQL Editor do Supabase
-- ============================================

-- Índices para lancamentos_futuros
CREATE INDEX IF NOT EXISTS idx_lancamentos_futuros_usuario_conta 
ON lancamentos_futuros(usuario_id, tipo_conta);

CREATE INDEX IF NOT EXISTS idx_lancamentos_futuros_data_prevista 
ON lancamentos_futuros(data_prevista);

CREATE INDEX IF NOT EXISTS idx_lancamentos_futuros_tipo 
ON lancamentos_futuros(tipo);

CREATE INDEX IF NOT EXISTS idx_lancamentos_futuros_status 
ON lancamentos_futuros(status);

-- Índice composto para queries mais comuns
CREATE INDEX IF NOT EXISTS idx_lancamentos_futuros_usuario_conta_data 
ON lancamentos_futuros(usuario_id, tipo_conta, data_prevista);

-- Índices para transacoes
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario_conta 
ON transacoes(usuario_id, tipo_conta);

CREATE INDEX IF NOT EXISTS idx_transacoes_data 
ON transacoes(data);

CREATE INDEX IF NOT EXISTS idx_transacoes_tipo 
ON transacoes(tipo);

-- Índice composto para queries mais comuns
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario_conta_data 
ON transacoes(usuario_id, tipo_conta, data);

-- Índices para categoria_trasacoes
CREATE INDEX IF NOT EXISTS idx_categorias_usuario 
ON categoria_trasacoes(usuario_id);

CREATE INDEX IF NOT EXISTS idx_categorias_tipo 
ON categoria_trasacoes(tipo);

-- ============================================
-- ANÁLISE DE PERFORMANCE
-- Execute para verificar se os índices estão sendo usados
-- ============================================

-- Verificar índices criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('lancamentos_futuros', 'transacoes', 'categoria_trasacoes')
ORDER BY tablename, indexname;

-- Verificar tamanho das tabelas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('lancamentos_futuros', 'transacoes', 'categoria_trasacoes')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
