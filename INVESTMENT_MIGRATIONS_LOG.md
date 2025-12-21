# 📊 Log de Migrations - Módulo de Investimentos

**Data de Criação:** 17 de Dezembro de 2025  
**Projeto Supabase:** Granazap_v5 (vrmickfxoxvyljounoxq)  
**Status:** ✅ Concluído

---

## ✅ Migrations Aplicadas

### 1. `create_investment_assets_table`
**Data:** 17/12/2025  
**Status:** ✅ Sucesso  
**Descrição:** Tabela centralizada de ativos (ações, FIIs, ETFs, criptos, renda fixa)

**Estrutura:**
- `id` (UUID, PK)
- `ticker` (TEXT, UNIQUE) - Ex: PETR4, MXRF11, BTC-BRL
- `name` (TEXT) - Nome do ativo
- `type` (TEXT) - acao | fii | etf | renda_fixa | cripto
- `current_price` (NUMERIC)
- `previous_close` (NUMERIC)
- `last_updated` (TIMESTAMP)
- `source` (TEXT) - brapi | manual | fallback
- `is_active` (BOOLEAN)

**RLS:** ✅ Habilitado
- SELECT: Todos podem ver
- INSERT/UPDATE/DELETE: Apenas service_role

**Índices:**
- `idx_investment_assets_ticker`
- `idx_investment_assets_type`
- `idx_investment_assets_source`
- `idx_investment_assets_active`

---

### 2. `create_investment_positions_table`
**Data:** 17/12/2025  
**Status:** ✅ Sucesso  
**Descrição:** Posições de investimento dos usuários

**Estrutura:**
- `id` (UUID, PK)
- `usuario_id` (UUID, FK → auth.users)
- `asset_id` (UUID, FK → investment_assets)
- `conta_id` (UUID, FK → contas_bancarias, NULLABLE)
- `quantidade` (NUMERIC) - CHECK > 0
- `preco_medio` (NUMERIC) - CHECK > 0
- `data_compra` (DATE)
- `tipo_conta` (TEXT) - pessoal | pj
- `is_manual_price` (BOOLEAN)
- `manual_price` (NUMERIC)
- `observacao` (TEXT)

**RLS:** ✅ Habilitado
- SELECT/INSERT/UPDATE/DELETE: Apenas próprio usuário (auth.uid() = usuario_id)

**Constraints:**
- UNIQUE(usuario_id, asset_id) - Usuário não pode ter posição duplicada

**Índices:**
- `idx_investment_positions_usuario`
- `idx_investment_positions_asset`
- `idx_investment_positions_conta`
- `idx_investment_positions_tipo_conta`

---

### 3. `create_investment_dividends_table`
**Data:** 17/12/2025  
**Status:** ✅ Sucesso  
**Descrição:** Proventos (dividendos, JCP, rendimentos)

**Estrutura:**
- `id` (UUID, PK)
- `position_id` (UUID, FK → investment_positions)
- `tipo` (TEXT) - dividendo | jcp | rendimento | amortizacao
- `valor_por_ativo` (NUMERIC) - CHECK > 0
- `data_com` (DATE, NULLABLE)
- `data_pagamento` (DATE)
- `observacao` (TEXT)

**RLS:** ✅ Habilitado
- SELECT/INSERT/UPDATE/DELETE: Apenas proventos de posições do próprio usuário

**Índices:**
- `idx_investment_dividends_position`
- `idx_investment_dividends_data_pagamento`

---

### 4. `create_api_usage_log_table`
**Data:** 17/12/2025  
**Status:** ✅ Sucesso  
**Descrição:** Log de uso da API externa (Brapi)

**Estrutura:**
- `id` (UUID, PK)
- `api_name` (TEXT) - Ex: "brapi"
- `endpoint` (TEXT) - Ex: "/api/quote/PETR4,VALE3"
- `tickers_count` (INTEGER) - Quantidade de tickers na request
- `status` (TEXT) - success | error | rate_limit
- `response_time_ms` (INTEGER)
- `error_message` (TEXT)

**RLS:** ✅ Habilitado
- ALL: Apenas service_role (logs internos)

**Índices:**
- `idx_api_usage_log_created_at`
- `idx_api_usage_log_api_name`
- `idx_api_usage_log_status`

---

### 5. `create_investment_views`
**Data:** 17/12/2025  
**Status:** ✅ Sucesso  
**Descrição:** Views para facilitar consultas

**Views Criadas:**

#### `v_portfolio_summary`
Resumo da carteira por usuário e tipo de conta
- `usuario_id`
- `tipo_conta`
- `total_ativos`
- `valor_investido`
- `valor_atual`
- `lucro_prejuizo`
- `rentabilidade_percentual`

#### `v_dividends_summary`
Resumo de proventos por usuário, tipo de conta e período
- `usuario_id`
- `tipo_conta`
- `total_proventos`
- `valor_total_proventos`
- `ano`
- `mes`

#### `v_positions_detailed`
Posições detalhadas com todos os cálculos
- Todos os campos de `investment_positions`
- Todos os campos de `investment_assets`
- Cálculos: valor_investido, valor_atual, lucro_prejuizo, rentabilidade_percentual

---

## 🔄 Rollback (Se Necessário)

Para reverter todas as migrations:

```sql
-- Executar no SQL Editor do Supabase

-- 1. Remover views
DROP VIEW IF EXISTS public.v_positions_detailed CASCADE;
DROP VIEW IF EXISTS public.v_dividends_summary CASCADE;
DROP VIEW IF EXISTS public.v_portfolio_summary CASCADE;

-- 2. Remover tabelas (ordem inversa devido a FKs)
DROP TABLE IF EXISTS public.api_usage_log CASCADE;
DROP TABLE IF EXISTS public.investment_dividends CASCADE;
DROP TABLE IF EXISTS public.investment_positions CASCADE;
DROP TABLE IF EXISTS public.investment_assets CASCADE;
```

**⚠️ ATENÇÃO:** O rollback irá deletar TODOS os dados de investimentos. Use apenas em caso de emergência.

---

## ✅ Verificações de Segurança

### RLS Policies Testadas:

**investment_assets:**
- ✅ Usuário autenticado pode ler todos os ativos
- ✅ Usuário comum NÃO pode criar/editar/deletar ativos
- ✅ Apenas service_role pode modificar ativos

**investment_positions:**
- ✅ Usuário vê apenas suas próprias posições
- ✅ Usuário NÃO vê posições de outros usuários
- ✅ Usuário pode criar/editar/deletar apenas suas posições

**investment_dividends:**
- ✅ Usuário vê apenas proventos de suas posições
- ✅ Usuário NÃO vê proventos de outros usuários
- ✅ Usuário pode criar/editar/deletar apenas seus proventos

**api_usage_log:**
- ✅ Usuário comum NÃO tem acesso aos logs
- ✅ Apenas service_role pode acessar logs

### Constraints Testadas:

- ✅ `quantidade > 0` - Não permite quantidade negativa ou zero
- ✅ `preco_medio > 0` - Não permite preço negativo ou zero
- ✅ `valor_por_ativo > 0` - Não permite provento negativo ou zero
- ✅ UNIQUE(usuario_id, asset_id) - Não permite posição duplicada
- ✅ Foreign Keys funcionando corretamente

---

## 📊 Impacto no Sistema Existente

### ✅ ZERO Impacto Confirmado:

**Tabelas NÃO modificadas:**
- ✅ `transacoes` - Intacta
- ✅ `lancamentos_futuros` - Intacta
- ✅ `contas_bancarias` - Intacta
- ✅ `categoria_transacoes` - Intacta
- ✅ `cartoes_credito` - Intacta
- ✅ `metas` - Intacta
- ✅ `profiles` - Intacta

**Funcionalidades NÃO afetadas:**
- ✅ Dashboard principal
- ✅ Transações
- ✅ Contas bancárias
- ✅ Cartões de crédito
- ✅ Categorias
- ✅ Metas
- ✅ Relatórios
- ✅ Agendamentos

---

## ✅ Fase 1 - Dia 2: TypeScript e Hooks (CONCLUÍDO)

**Data:** 17/12/2025  
**Status:** ✅ Concluído

### Migrations Aplicadas:

#### `add_investment_permissions_to_plans`
**Descrição:** Adiciona colunas de controle de investimentos à tabela `planos_sistema`

**Colunas adicionadas:**
- `permite_investimentos` (BOOLEAN) - Controla acesso ao módulo
- `max_ativos_investimento` (INTEGER) - Limite de ativos (-1 = ilimitado)

**Configuração inicial dos planos:**
- Plano Free: `permite_investimentos = false`, `max_ativos_investimento = 0`
- Plano Mensal/Trimestral: `permite_investimentos = true`, `max_ativos_investimento = 20`
- Plano Semestral/Anual: `permite_investimentos = true`, `max_ativos_investimento = -1` (ilimitado)

### Arquivos Criados:

#### Types (`src/types/investments.ts`)
- ✅ `InvestmentAsset` - Tipo do ativo
- ✅ `InvestmentPosition` - Posição do usuário
- ✅ `InvestmentDividend` - Provento
- ✅ `PositionDetailed` - Posição com cálculos
- ✅ `PortfolioSummary` - Resumo da carteira
- ✅ `DividendsSummary` - Resumo de proventos
- ✅ `CreateAssetInput`, `CreatePositionInput`, `CreateDividendInput` - Inputs de criação
- ✅ `InvestmentAccessInfo` - Informações de acesso
- ✅ `PortfolioStats` - Estatísticas da carteira
- ✅ `BrapiQuoteResponse` - Resposta da API Brapi

#### Hooks (`src/hooks/`)
- ✅ `use-investment-access.ts` - Verifica acesso ao módulo e limites
- ✅ `use-investments.ts` - CRUD de posições
- ✅ `use-investment-assets.ts` - Busca e criação de ativos
- ✅ `use-investment-summary.ts` - Resumo e estatísticas

**Padrão seguido:** Todos os hooks seguem o mesmo padrão dos hooks existentes (`use-accounts.ts`, `use-user-plan.ts`)

#### Utilities (`src/lib/investments/`)
- ✅ `calculations.ts` - Funções de cálculo financeiro
  - Valor investido, valor atual, lucro/prejuízo
  - Rentabilidade percentual
  - Preço médio após compra
  - Distribuição por tipo de ativo
  - Formatação de valores
- ✅ `validation.ts` - Validações de input
  - Validação de criação de ativo
  - Validação de criação de posição
  - Validação de criação de provento
  - Validação de limites de plano
  - Sanitização de inputs

### Garantias de Não-Quebra:

✅ **ZERO modificações em código existente:**
- Nenhum hook existente foi modificado
- Nenhum componente existente foi modificado
- Nenhuma rota existente foi modificada

✅ **Apenas adições:**
- Nova coluna em `planos_sistema` (não quebra queries existentes)
- Novos arquivos isolados em pastas específicas
- Novos types em arquivo separado

---

## ✅ Fase 1 - Dia 3: API Routes (CONCLUÍDO)

**Data:** 17/12/2025  
**Status:** ✅ Concluído

### API Routes Criadas:

#### 1. `/api/investments/assets`
**Métodos:** GET, POST

**GET** - Listar ativos disponíveis
- Query params: `type` (opcional), `search` (opcional)
- Retorna lista de ativos ativos
- Filtro por tipo de ativo
- Busca por ticker

**POST** - Buscar ou criar ativo
- Body: `CreateAssetInput`
- Valida input com `validateCreateAsset`
- Verifica se ativo já existe
- Retorna ativo existente ou erro 404 (usuário deve usar manual)

#### 2. `/api/investments/positions`
**Métodos:** GET, POST

**GET** - Listar posições do usuário
- Query params: `tipo_conta` (default: 'pessoal')
- Usa view `v_positions_detailed` (com todos os cálculos)
- Filtra por usuário autenticado via RLS
- Ordena por data de criação (mais recente primeiro)

**POST** - Criar nova posição
- Body: `CreatePositionInput`
- Valida input com `validateCreatePosition`
- Verifica duplicata (usuário + asset)
- Cria posição vinculada ao usuário

#### 3. `/api/investments/positions/[id]`
**Métodos:** PUT, DELETE

**PUT** - Atualizar posição
- Params: `id` (UUID da posição)
- Body: `UpdatePositionInput`
- Valida UUID
- Valida valores (quantidade > 0, preço > 0)
- RLS garante que só atualiza posição do usuário

**DELETE** - Excluir posição
- Params: `id` (UUID da posição)
- Valida UUID
- RLS garante que só exclui posição do usuário
- Cascade delete de dividendos (via FK)

#### 4. `/api/investments/summary`
**Métodos:** GET

**GET** - Resumo da carteira
- Query params: `tipo_conta` (default: 'pessoal')
- Usa view `v_portfolio_summary`
- Calcula distribuição por tipo de ativo
- Soma total de dividendos
- Retorna resumo completo com estatísticas

### Segurança Implementada:

✅ **Autenticação:**
- Todas as rotas verificam `auth.getUser()`
- Retorna 401 se não autenticado

✅ **RLS (Row Level Security):**
- Todas as queries respeitam RLS do Supabase
- Usuário só vê/modifica seus próprios dados
- Políticas do banco garantem isolamento

✅ **Validações:**
- Inputs validados com funções de `validation.ts`
- UUIDs validados
- Valores numéricos validados (> 0)
- Datas validadas

✅ **Error Handling:**
- Try-catch em todas as rotas
- Logs de erro no console
- Mensagens de erro apropriadas
- Status codes corretos (401, 404, 409, 500)

### Decisões de Arquitetura:

**✅ Sem middleware de plano premium (por enquanto):**
- Verificação de plano será adicionada depois
- Seguirá mesma lógica de PJ/compartilhamento
- Baseado em `planos_sistema.permite_investimentos`

**✅ Uso de Views:**
- `v_positions_detailed` - Posições com cálculos
- `v_portfolio_summary` - Resumo da carteira
- `v_dividends_summary` - Resumo de proventos
- Performance otimizada (cálculos no banco)

**✅ Validações em múltiplas camadas:**
- Frontend (futuramente)
- API routes (validação de inputs)
- Database (constraints, RLS)

### Arquivos Criados:

```
src/app/api/investments/
├── assets/
│   └── route.ts (GET, POST)
├── positions/
│   ├── route.ts (GET, POST)
│   └── [id]/
│       └── route.ts (PUT, DELETE)
└── summary/
    └── route.ts (GET)
```

**Total:** 4 arquivos, ~400 linhas de código

---

## ✅ Fase 1 - Dia 4: Edge Function (CONCLUÍDO)

**Data:** 17/12/2025  
**Status:** ✅ Concluído

### Edge Function Criada e Deployada:

**Nome:** `update-investment-prices`  
**ID:** `b21bb2a9-b61d-4545-b938-ad1204f1ebee`  
**Status:** ACTIVE  
**Versão:** 1

#### Funcionalidades:

✅ **Atualização automática de preços:**
- Busca todos os ativos com `source='brapi'` e `is_active=true`
- Agrupa tickers em lotes de 10 (otimização de requests)
- Chama API Brapi para cada lote
- Atualiza `current_price`, `previous_close` e `last_updated`

✅ **Sistema de logs:**
- Registra cada chamada à API em `api_usage_log`
- Status: success, error, rate_limit
- Tempo de resposta em ms
- Mensagens de erro detalhadas

✅ **Tratamento de erros:**
- Retry logic com delay de 1s entre lotes
- Continua processamento mesmo com falhas parciais
- Retorna resumo completo (success/failed/errors)

✅ **Segurança:**
- Usa `SUPABASE_SERVICE_ROLE_KEY` para bypass RLS
- Token Brapi via variável de ambiente
- Método POST apenas
- Verify JWT desabilitado (função interna)

#### Variáveis de Ambiente Necessárias:

```bash
# Já configuradas automaticamente pelo Supabase:
SUPABASE_URL=https://vrmickfxoxvyljounoxq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Precisa ser adicionada manualmente:
BRAPI_TOKEN=4HT1CjbV9zRHPY6W7nSoaW
```

#### Como Adicionar BRAPI_TOKEN:

1. Acesse o Supabase Dashboard
2. Vá em **Edge Functions** > **update-investment-prices**
3. Clique em **Settings** > **Secrets**
4. Adicione: `BRAPI_TOKEN` = `4HT1CjbV9zRHPY6W7nSoaW`

#### Como Testar Manualmente:

```bash
# Via curl:
curl -X POST \
  https://vrmickfxoxvyljounoxq.supabase.co/functions/v1/update-investment-prices \
  -H "Authorization: Bearer <anon_key>"

# Resposta esperada:
{
  "message": "Atualização concluída",
  "success": 5,
  "failed": 0,
  "errors": [],
  "updated": ["PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3"]
}
```

#### Configurar Cron Job (Próximo Passo):

**Recomendação:**
- **Ações/FIIs/ETFs:** 3x por dia (9h, 12h, 18h) - horário de mercado
- **Criptomoedas:** 6x por dia (a cada 4 horas) - mercado 24/7
- **Renda Fixa:** 1x por dia (após fechamento)

**Como configurar:**
1. Supabase Dashboard > Database > Cron Jobs
2. Criar job com SQL:
```sql
SELECT net.http_post(
  url := 'https://vrmickfxoxvyljounoxq.supabase.co/functions/v1/update-investment-prices',
  headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
);
```
3. Schedule: `0 9,12,18 * * 1-5` (seg-sex, 9h/12h/18h)

#### Monitoramento:

**Verificar logs:**
```sql
SELECT * FROM api_usage_log 
WHERE api_name = 'brapi' 
ORDER BY created_at DESC 
LIMIT 50;
```

**Verificar ativos atualizados:**
```sql
SELECT ticker, current_price, last_updated 
FROM investment_assets 
WHERE source = 'brapi' 
ORDER BY last_updated DESC;
```

**Consumo de API:**
```sql
SELECT 
  DATE(created_at) as dia,
  COUNT(*) as total_requests,
  SUM(tickers_count) as total_tickers,
  COUNT(*) FILTER (WHERE status = 'success') as sucessos,
  COUNT(*) FILTER (WHERE status = 'error') as erros,
  COUNT(*) FILTER (WHERE status = 'rate_limit') as rate_limits
FROM api_usage_log
WHERE api_name = 'brapi'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY dia DESC;
```

---

## 📝 Próximos Passos

### Fase 1 - Semana 2 (Próximo):
- [ ] Configurar Cron Jobs no Supabase
- [ ] Criar página de Investimentos (`/dashboard/investimentos`)
- [ ] Criar componentes de UI (cards, modais, gráficos)
- [ ] Integrar com dashboard principal
- [ ] Adicionar verificação de plano premium (quando necessário)
- [ ] Testes end-to-end

---

## 🔐 Credenciais Necessárias (Próximas Etapas)

Para a Edge Function de atualização de preços, será necessário:

1. **Brapi Token:**
   - Criar conta em https://brapi.dev
   - Obter token gratuito (15k requests/mês)
   - Adicionar em variáveis de ambiente do Supabase

2. **Variáveis de Ambiente (Supabase):**
   ```bash
   BRAPI_TOKEN=seu_token_aqui
   ```

---

## 📞 Suporte

Em caso de problemas:
1. Verificar logs no Supabase Dashboard
2. Testar RLS policies no SQL Editor
3. Verificar constraints e foreign keys
4. Consultar este documento para rollback

---

**Última atualização:** 17/12/2025  
**Responsável:** Sistema de Migrations Automatizado  
**Status:** ✅ Pronto para próxima fase
