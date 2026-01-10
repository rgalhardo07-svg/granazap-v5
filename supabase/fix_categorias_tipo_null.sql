-- =====================================================
-- CORREÇÃO: Categorias com tipo NULL (Migração de Bancos Antigos)
-- =====================================================
-- Data: 10/01/2026
-- Problema: Categorias antigas têm tipo=NULL, não aparecem no frontend
-- Causa: Bancos migrados de versões antigas não tinham campo tipo
-- Solução: Atualizar tipo=NULL para tipo='ambos' (permite usar em entrada e saída)
-- =====================================================

-- Atualizar todas as categorias com tipo NULL para 'ambos'
UPDATE categoria_trasacoes
SET tipo = 'ambos'
WHERE tipo IS NULL;

-- Verificar resultado
SELECT 
  COUNT(*) as total_categorias,
  COUNT(CASE WHEN tipo IS NULL THEN 1 END) as com_tipo_null,
  COUNT(CASE WHEN tipo = 'ambos' THEN 1 END) as tipo_ambos,
  COUNT(CASE WHEN tipo = 'entrada' THEN 1 END) as tipo_entrada,
  COUNT(CASE WHEN tipo = 'saida' THEN 1 END) as tipo_saida
FROM categoria_trasacoes;

-- =====================================================
-- RESULTADO ESPERADO:
-- 1. Todas as categorias com tipo=NULL agora têm tipo='ambos'
-- 2. Categorias aparecem tanto em receitas quanto em despesas
-- 3. Dependentes conseguem ver e usar as categorias
-- 4. Frontend não filtra mais por tipo=NULL
-- =====================================================
