# Migration: Flag de Transferências

## 📋 O que foi feito?

Adicionada uma coluna `is_transferencia` na tabela `transacoes` para marcar transferências entre contas e excluí-las do dashboard e relatórios.

## 🎯 Por quê?

Transferências entre contas não são receitas ou despesas reais:
- ❌ Não aumentam o patrimônio
- ❌ Não diminuem o patrimônio  
- ✅ Apenas movem dinheiro entre contas

Incluí-las no dashboard distorce os números e confunde o usuário.

## 🔧 Como aplicar a migration?

### 1. Execute o SQL no Supabase:

Abra o SQL Editor no Supabase e execute o arquivo:
```
supabase-add-transferencia-flag.sql
```

Ou copie e cole este SQL:

```sql
ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS is_transferencia BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_transacoes_is_transferencia 
ON transacoes(is_transferencia);

UPDATE transacoes 
SET is_transferencia = TRUE
WHERE categoria_id IN (
  SELECT id 
  FROM categoria_trasacoes 
  WHERE descricao = 'Transferência'
);
```

### 2. Verifique se funcionou:

```sql
-- Ver transferências marcadas
SELECT COUNT(*) 
FROM transacoes 
WHERE is_transferencia = TRUE;

-- Ver estrutura da tabela
\d transacoes
```

## ✅ O que mudou no código?

### 1. Transferências são marcadas automaticamente:
```typescript
// transfer-modal.tsx
{
  is_transferencia: true  // ✅ Nova flag
}
```

### 2. Dashboard filtra transferências:
```typescript
// use-transactions-query.ts
.or('is_transferencia.is.null,is_transferencia.eq.false')
```

### 3. Transferências existentes foram atualizadas:
- SQL UPDATE marca todas as transferências antigas
- Baseado na categoria "Transferência"

## 📊 Resultado:

**ANTES:**
```
Dashboard:
Receitas: R$ 5.500 (inclui R$ 500 de transferência)
Despesas: R$ 2.500 (inclui R$ 500 de transferência)
```

**DEPOIS:**
```
Dashboard:
Receitas: R$ 5.000 (apenas receitas reais)
Despesas: R$ 2.000 (apenas despesas reais)
```

**Transferências continuam aparecendo:**
- ✅ Extrato da conta
- ✅ Histórico de transações
- ✅ Relatório de transferências (futuro)

## 🚨 Importante:

- ✅ Não quebra nada existente
- ✅ Compatível com transações antigas (is_transferencia = null ou false)
- ✅ Índice criado para performance
- ✅ Comentário no banco explica a coluna

## 🔮 Próximos passos (opcional):

1. Criar página específica de transferências
2. Adicionar relatório de movimentações entre contas
3. Dashboard de fluxo de caixa por conta
