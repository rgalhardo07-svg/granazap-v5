# 🚀 Edge Function: update-investment-prices

## 📋 Informações Gerais

**Nome:** `update-investment-prices`  
**ID:** `b21bb2a9-b61d-4545-b938-ad1204f1ebee`  
**Status:** ✅ ACTIVE  
**Versão:** 1  
**Deploy:** 17/12/2025

---

## 🔧 Configuração Necessária

### 1. Adicionar Token Brapi

O token Brapi precisa ser adicionado como secret na Edge Function:

**Passo a passo:**

1. Acesse: https://supabase.com/dashboard/project/vrmickfxoxvyljounoxq
2. Navegue: **Edge Functions** → **update-investment-prices**
3. Clique em: **Settings** → **Secrets**
4. Adicione o secret:
   - **Name:** `BRAPI_TOKEN`
   - **Value:** `4HT1CjbV9zRHPY6W7nSoaW`
5. Clique em **Save**

**⚠️ IMPORTANTE:** Sem este token, a função não conseguirá buscar preços!

---

## ⏰ Configurar Cron Jobs

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse: **Database** → **Cron Jobs**
2. Clique em **Create a new cron job**
3. Configure:

**Job 1: Atualização durante horário de mercado**
```
Name: update-investment-prices-market-hours
Schedule: 0 9,12,18 * * 1-5
Command: SELECT net.http_post(
  url := 'https://vrmickfxoxvyljounoxq.supabase.co/functions/v1/update-investment-prices',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
  )
);
```

**Job 2: Atualização de criptomoedas (24/7)**
```
Name: update-investment-prices-crypto
Schedule: 0 */4 * * *
Command: SELECT net.http_post(
  url := 'https://vrmickfxoxvyljounoxq.supabase.co/functions/v1/update-investment-prices',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
  )
);
```

### Opção 2: Via SQL (pg_cron)

```sql
-- Habilitar extensão pg_cron (se ainda não estiver)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Job 1: Segunda a sexta, 9h, 12h e 18h
SELECT cron.schedule(
  'update-investment-prices-market',
  '0 9,12,18 * * 1-5',
  $$
  SELECT net.http_post(
    url := 'https://vrmickfxoxvyljounoxq.supabase.co/functions/v1/update-investment-prices',
    headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
  );
  $$
);

-- Job 2: Criptomoedas a cada 4 horas
SELECT cron.schedule(
  'update-investment-prices-crypto',
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vrmickfxoxvyljounoxq.supabase.co/functions/v1/update-investment-prices',
    headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
  );
  $$
);
```

**⚠️ Substitua `<SERVICE_ROLE_KEY>` pela sua chave real!**

### Explicação dos Schedules:

- `0 9,12,18 * * 1-5` = Segunda a sexta, às 9h, 12h e 18h
- `0 */4 * * *` = A cada 4 horas, todos os dias
- Formato: `minuto hora dia mês dia-da-semana`

---

## 🧪 Testar Manualmente

### Via curl:

```bash
curl -X POST \
  https://vrmickfxoxvyljounoxq.supabase.co/functions/v1/update-investment-prices \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybWlja2Z4b3h2eWxqb3Vub3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNjA0MjMsImV4cCI6MjA4MDkzNjQyM30.jtuvfQdhnVq4r2dgfNZUjhLHoRKOcYKCymbIRFvl5n0" \
  -H "Content-Type: application/json"
```

### Via Supabase Dashboard:

1. Acesse: **Edge Functions** → **update-investment-prices**
2. Clique em **Invoke**
3. Método: **POST**
4. Body: `{}` (vazio)
5. Clique em **Send**

### Resposta Esperada:

```json
{
  "message": "Atualização concluída",
  "success": 5,
  "failed": 0,
  "errors": [],
  "updated": ["PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3"]
}
```

---

## 📊 Monitoramento

### 1. Verificar Logs da Edge Function:

```sql
-- Últimas execuções
SELECT * FROM api_usage_log 
WHERE api_name = 'brapi' 
ORDER BY created_at DESC 
LIMIT 20;
```

### 2. Verificar Ativos Atualizados:

```sql
-- Ativos com preços mais recentes
SELECT 
  ticker,
  type,
  current_price,
  previous_close,
  last_updated,
  EXTRACT(EPOCH FROM (NOW() - last_updated))/3600 as horas_desde_atualizacao
FROM investment_assets 
WHERE source = 'brapi' 
  AND is_active = true
ORDER BY last_updated DESC;
```

### 3. Consumo Mensal da API:

```sql
-- Resumo do mês atual
SELECT 
  COUNT(*) as total_requests,
  SUM(tickers_count) as total_tickers_consultados,
  COUNT(*) FILTER (WHERE status = 'success') as sucessos,
  COUNT(*) FILTER (WHERE status = 'error') as erros,
  COUNT(*) FILTER (WHERE status = 'rate_limit') as rate_limits,
  ROUND(AVG(response_time_ms)) as tempo_medio_ms
FROM api_usage_log
WHERE api_name = 'brapi'
  AND created_at >= DATE_TRUNC('month', NOW());
```

### 4. Alertas de Limite:

```sql
-- Verificar se está próximo do limite (15.000/mês)
WITH monthly_usage AS (
  SELECT COUNT(*) as requests_this_month
  FROM api_usage_log
  WHERE api_name = 'brapi'
    AND created_at >= DATE_TRUNC('month', NOW())
)
SELECT 
  requests_this_month,
  15000 - requests_this_month as requests_restantes,
  ROUND((requests_this_month::numeric / 15000) * 100, 2) as percentual_usado
FROM monthly_usage;
```

---

## 🔍 Troubleshooting

### Problema: "Configuração inválida"

**Causa:** Token Brapi não configurado  
**Solução:** Adicionar `BRAPI_TOKEN` nos secrets da Edge Function

### Problema: "Rate limit exceeded" (429)

**Causa:** Excedeu limite de 15.000 requests/mês  
**Solução:** 
- Reduzir frequência dos cron jobs
- Aguardar início do próximo mês
- Considerar upgrade do plano Brapi

### Problema: Preços não atualizando

**Verificar:**
1. Cron jobs estão ativos?
2. Token Brapi está correto?
3. Ativos têm `source='brapi'` e `is_active=true`?
4. Verificar logs de erro em `api_usage_log`

### Problema: Alguns ativos não atualizam

**Causa:** Ticker não existe na Brapi ou está inativo  
**Solução:** 
- Verificar ticker correto em https://brapi.dev
- Mudar `source` para `'manual'` se necessário

---

## 📈 Otimizações Futuras

### 1. Atualização Seletiva por Tipo:
- Criar Edge Functions separadas por tipo de ativo
- Ações/FIIs: horário de mercado
- Cripto: 24/7
- Renda Fixa: 1x/dia

### 2. Cache de Preços:
- Implementar cache Redis
- Reduzir chamadas à API
- Melhorar performance

### 3. Webhooks:
- Receber notificações de mudanças de preço
- Atualização em tempo real
- Reduzir polling

### 4. Fallback para Outras APIs:
- Yahoo Finance
- Alpha Vantage
- CoinGecko (cripto)

---

## 🔐 Segurança

✅ **Token Brapi:**
- Armazenado como secret (não exposto)
- Apenas Edge Function tem acesso
- Nunca enviado ao frontend

✅ **Service Role Key:**
- Usado apenas internamente
- Bypass RLS para atualização em lote
- Não exposto em logs

✅ **Verify JWT:**
- Desabilitado (função interna)
- Chamada apenas por cron jobs
- Não acessível publicamente sem auth

---

## 📞 Suporte

**Documentação Brapi:** https://brapi.dev/docs  
**Supabase Edge Functions:** https://supabase.com/docs/guides/functions  
**pg_cron:** https://github.com/citusdata/pg_cron

---

**Última atualização:** 17/12/2025  
**Versão:** 1.0
