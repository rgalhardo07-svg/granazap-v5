# 📈 Módulo de Investimentos - Plano de Implementação

**Versão:** 1.0  
**Data:** Dezembro 2025  
**Status:** Planejamento  

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
4. [Integração com Planos Premium](#integração-com-planos-premium)
5. [Gestão de API e Limites](#gestão-de-api-e-limites)
6. [Controles Manuais](#controles-manuais)
7. [Fases de Implementação](#fases-de-implementação)
8. [Segurança e RLS](#segurança-e-rls)
9. [Testes e Validação](#testes-e-validação)
10. [Monitoramento](#monitoramento)

---

## 🎯 Visão Geral

### Objetivo

Criar um módulo de **gestão de investimentos pessoal e PJ** integrado ao GranaZap, permitindo que usuários acompanhem seu patrimônio investido com atualização automática de cotações via API externa (Brapi) e controle manual completo.

### Escopo

**O que É:**
- ✅ Ferramenta de **acompanhamento** de investimentos
- ✅ Gestão de **patrimônio** e **rentabilidade**
- ✅ Controle de **proventos** (dividendos, JCP)
- ✅ Atualização **automática** de cotações
- ✅ Controle **100% manual** quando necessário

**O que NÃO É:**
- ❌ Plataforma de trading
- ❌ Sincronização com corretoras
- ❌ Análise técnica ou recomendações
- ❌ Execução de ordens de compra/venda

### Princípios de Design

1. **Simplicidade:** Interface clara e objetiva
2. **Controle:** Usuário tem autonomia total
3. **Confiabilidade:** Fallbacks para garantir funcionamento
4. **Performance:** Preços centralizados, zero redundância
5. **Segurança:** RLS em todas as tabelas
6. **Escalabilidade:** Arquitetura preparada para crescimento

---

## 🏗️ Arquitetura do Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Carteira    │  │   Ativos     │  │  Proventos   │     │
│  │   Page       │  │    Page      │  │    Page      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   API ROUTES (Next.js)                      │
│  /api/investments/portfolio                                 │
│  /api/investments/assets                                    │
│  /api/investments/dividends                                 │
│  /api/investments/summary                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE DATABASE                          │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ investment_assets│  │investment_positions│              │
│  │ (preços únicos)  │  │ (posições usuário)│              │
│  └──────────────────┘  └──────────────────┘               │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │investment_dividends│ │ api_usage_log   │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────────┐
│            EDGE FUNCTION (Supabase Cron)                    │
│  - Atualiza preços 3x/dia (ações/FIIs)                     │
│  - Atualiza preços 6x/dia (cripto)                         │
│  - Monitora limite de requests                             │
│  - Loga todas as chamadas                                  │
└─────────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────────┐
│                    BRAPI API (Externa)                      │
│  https://brapi.dev/api/quote/{tickers}                     │
│  Limite: 15.000 requests/mês (plano free)                  │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Atualização de Preços

```
┌─────────────────────────────────────────────────────────────┐
│  1. CRON JOB (11h, 15h, 18h)                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Buscar ativos com source='brapi' e last_update > 3h     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Verificar limite de requests (< 15k/mês)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Chamar Brapi em batch (até 50 tickers por request)      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Atualizar investment_assets com novos preços            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Logar request em api_usage_log                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 Estrutura do Banco de Dados

### Schema Completo

```sql
-- ==============================================================================
-- MÓDULO DE INVESTIMENTOS - SCHEMA COMPLETO
-- ==============================================================================

-- 1. Tabela de Ativos (centralizada, compartilhada entre usuários)
CREATE TABLE IF NOT EXISTS public.investment_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker TEXT UNIQUE NOT NULL, -- PETR4, MXRF11, BTC-BRL
    name TEXT, -- Petrobras PN, Maxi Renda FII
    type TEXT NOT NULL CHECK (type IN ('acao', 'fii', 'etf', 'renda_fixa', 'cripto')),
    
    -- Preço e atualização
    current_price NUMERIC(15,2),
    previous_close NUMERIC(15,2),
    last_updated TIMESTAMP WITH TIME ZONE,
    
    -- Fonte do preço
    source TEXT DEFAULT 'brapi' CHECK (source IN ('brapi', 'manual', 'fallback')),
    
    -- Metadados
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Posições (investimentos do usuário)
CREATE TABLE IF NOT EXISTS public.investment_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.investment_assets(id) ON DELETE RESTRICT,
    conta_id UUID REFERENCES public.contas_bancarias(id) ON DELETE SET NULL,
    
    -- Dados da posição
    quantidade NUMERIC(15,4) NOT NULL CHECK (quantidade > 0),
    preco_medio NUMERIC(15,2) NOT NULL CHECK (preco_medio > 0),
    data_compra DATE NOT NULL,
    
    -- Tipo de conta
    tipo_conta TEXT NOT NULL CHECK (tipo_conta IN ('pessoal', 'pj')),
    
    -- Controle manual
    is_manual_price BOOLEAN DEFAULT false,
    manual_price NUMERIC(15,2),
    
    -- Observações
    observacao TEXT,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraint: usuário não pode ter posição duplicada do mesmo ativo
    UNIQUE(usuario_id, asset_id)
);

-- 3. Tabela de Proventos
CREATE TABLE IF NOT EXISTS public.investment_dividends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    position_id UUID NOT NULL REFERENCES public.investment_positions(id) ON DELETE CASCADE,
    
    -- Dados do provento
    tipo TEXT NOT NULL CHECK (tipo IN ('dividendo', 'jcp', 'rendimento', 'amortizacao')),
    valor_por_ativo NUMERIC(15,4) NOT NULL CHECK (valor_por_ativo > 0),
    
    -- Datas
    data_com DATE, -- Data COM (quem tinha ação nesse dia recebe)
    data_pagamento DATE NOT NULL,
    
    -- Observações
    observacao TEXT,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Log de Uso da API
CREATE TABLE IF NOT EXISTS public.api_usage_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Dados da requisição
    api_name TEXT NOT NULL, -- 'brapi'
    endpoint TEXT NOT NULL, -- '/api/quote/PETR4,VALE3'
    tickers_count INTEGER NOT NULL, -- quantidade de tickers na request
    
    -- Resultado
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'rate_limit')),
    response_time_ms INTEGER,
    error_message TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_investment_assets_ticker ON public.investment_assets(ticker);
CREATE INDEX IF NOT EXISTS idx_investment_assets_type ON public.investment_assets(type);
CREATE INDEX IF NOT EXISTS idx_investment_assets_source ON public.investment_assets(source);
CREATE INDEX IF NOT EXISTS idx_investment_assets_active ON public.investment_assets(is_active);

CREATE INDEX IF NOT EXISTS idx_investment_positions_usuario ON public.investment_positions(usuario_id);
CREATE INDEX IF NOT EXISTS idx_investment_positions_asset ON public.investment_positions(asset_id);
CREATE INDEX IF NOT EXISTS idx_investment_positions_conta ON public.investment_positions(conta_id);
CREATE INDEX IF NOT EXISTS idx_investment_positions_tipo_conta ON public.investment_positions(tipo_conta);

CREATE INDEX IF NOT EXISTS idx_investment_dividends_position ON public.investment_dividends(position_id);
CREATE INDEX IF NOT EXISTS idx_investment_dividends_data_pagamento ON public.investment_dividends(data_pagamento);

CREATE INDEX IF NOT EXISTS idx_api_usage_log_created_at ON public.api_usage_log(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_api_name ON public.api_usage_log(api_name);

-- 6. Triggers para updated_at
CREATE TRIGGER on_update_investment_assets
    BEFORE UPDATE ON public.investment_assets
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_update_investment_positions
    BEFORE UPDATE ON public.investment_positions
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- 7. Row Level Security (RLS)
ALTER TABLE public.investment_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_dividends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;

-- Políticas para investment_assets (todos podem ler, apenas admin pode modificar)
CREATE POLICY "Todos podem ver ativos"
    ON public.investment_assets
    FOR SELECT
    USING (true);

CREATE POLICY "Apenas service_role pode modificar ativos"
    ON public.investment_assets
    FOR ALL
    USING (auth.role() = 'service_role');

-- Políticas para investment_positions
CREATE POLICY "Usuarios podem ver suas posicoes"
    ON public.investment_positions
    FOR SELECT
    USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem criar suas posicoes"
    ON public.investment_positions
    FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar suas posicoes"
    ON public.investment_positions
    FOR UPDATE
    USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem excluir suas posicoes"
    ON public.investment_positions
    FOR DELETE
    USING (auth.uid() = usuario_id);

-- Políticas para investment_dividends
CREATE POLICY "Usuarios podem ver seus proventos"
    ON public.investment_dividends
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.investment_positions
            WHERE investment_positions.id = investment_dividends.position_id
            AND investment_positions.usuario_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios podem criar seus proventos"
    ON public.investment_dividends
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.investment_positions
            WHERE investment_positions.id = investment_dividends.position_id
            AND investment_positions.usuario_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios podem atualizar seus proventos"
    ON public.investment_dividends
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.investment_positions
            WHERE investment_positions.id = investment_dividends.position_id
            AND investment_positions.usuario_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios podem excluir seus proventos"
    ON public.investment_dividends
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.investment_positions
            WHERE investment_positions.id = investment_dividends.position_id
            AND investment_positions.usuario_id = auth.uid()
        )
    );

-- Políticas para api_usage_log (apenas leitura para admins)
CREATE POLICY "Apenas service_role pode acessar logs"
    ON public.api_usage_log
    FOR ALL
    USING (auth.role() = 'service_role');

-- 8. Permissões
GRANT SELECT ON public.investment_assets TO authenticated;
GRANT ALL ON public.investment_positions TO authenticated;
GRANT ALL ON public.investment_dividends TO authenticated;
GRANT ALL ON public.api_usage_log TO service_role;
```

### Views Úteis

```sql
-- View: Resumo de carteira por usuário
CREATE OR REPLACE VIEW public.v_portfolio_summary AS
SELECT 
    p.usuario_id,
    p.tipo_conta,
    COUNT(DISTINCT p.id) as total_ativos,
    SUM(p.quantidade * p.preco_medio) as valor_investido,
    SUM(p.quantidade * COALESCE(
        CASE WHEN p.is_manual_price THEN p.manual_price ELSE a.current_price END,
        p.preco_medio
    )) as valor_atual,
    SUM(p.quantidade * COALESCE(
        CASE WHEN p.is_manual_price THEN p.manual_price ELSE a.current_price END,
        p.preco_medio
    )) - SUM(p.quantidade * p.preco_medio) as lucro_prejuizo
FROM public.investment_positions p
LEFT JOIN public.investment_assets a ON p.asset_id = a.id
GROUP BY p.usuario_id, p.tipo_conta;

-- View: Proventos totais por usuário
CREATE OR REPLACE VIEW public.v_dividends_summary AS
SELECT 
    p.usuario_id,
    COUNT(d.id) as total_proventos,
    SUM(d.valor_por_ativo * p.quantidade) as valor_total_proventos
FROM public.investment_dividends d
JOIN public.investment_positions p ON d.position_id = p.id
GROUP BY p.usuario_id;
```

---

## 🔐 Integração com Planos Premium

### Estrutura de Planos

```typescript
// types/subscription.ts
export type SubscriptionPlan = 'free' | 'premium' | 'business';

export interface PlanFeatures {
  investments: {
    enabled: boolean;
    maxAssets: number;
    autoUpdate: boolean;
    dividendTracking: boolean;
  };
}

export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  free: {
    investments: {
      enabled: false,
      maxAssets: 0,
      autoUpdate: false,
      dividendTracking: false,
    },
  },
  premium: {
    investments: {
      enabled: true,
      maxAssets: 20,
      autoUpdate: true,
      dividendTracking: true,
    },
  },
  business: {
    investments: {
      enabled: true,
      maxAssets: -1, // ilimitado
      autoUpdate: true,
      dividendTracking: true,
    },
  },
};
```

### Verificação de Acesso

```typescript
// lib/check-investment-access.ts
import { createClient } from '@/lib/supabase/server';
import { PLAN_FEATURES } from '@/types/subscription';

export async function checkInvestmentAccess() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  // Buscar plano do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan')
    .eq('id', user.id)
    .single();

  const plan = profile?.subscription_plan || 'free';
  const features = PLAN_FEATURES[plan];

  if (!features.investments.enabled) {
    throw new Error('Módulo de investimentos disponível apenas para planos Premium e Business');
  }

  return {
    plan,
    features: features.investments,
  };
}

export async function checkAssetLimit(userId: string) {
  const supabase = createClient();
  
  // Buscar plano
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan')
    .eq('id', userId)
    .single();

  const plan = profile?.subscription_plan || 'free';
  const maxAssets = PLAN_FEATURES[plan].investments.maxAssets;

  // Contar ativos atuais
  const { count } = await supabase
    .from('investment_positions')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', userId);

  const currentAssets = count || 0;

  return {
    currentAssets,
    maxAssets,
    canAddMore: maxAssets === -1 || currentAssets < maxAssets,
  };
}
```

### Middleware de Proteção

```typescript
// app/api/investments/[...route]/route.ts
import { checkInvestmentAccess } from '@/lib/check-investment-access';

export async function GET(request: Request) {
  try {
    // Verificar acesso ao módulo
    await checkInvestmentAccess();
    
    // Lógica da rota...
    
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 403 }
    );
  }
}
```

### UI de Bloqueio

```typescript
// components/investments/premium-gate.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export function PremiumGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { plan, hasAccess } = useInvestmentAccess();

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Módulo Premium
          </h3>
          <p className="text-zinc-400 mb-6">
            A gestão de investimentos está disponível apenas para usuários dos planos Premium e Business.
          </p>
          <button
            onClick={() => router.push('/dashboard/configuracoes/planos')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Ver Planos
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

---

## 📊 Gestão de API e Limites

### Monitoramento de Requests

```typescript
// lib/api-usage-tracker.ts
import { createClient } from '@/lib/supabase/server';

export async function logApiUsage(
  apiName: string,
  endpoint: string,
  tickersCount: number,
  status: 'success' | 'error' | 'rate_limit',
  responseTimeMs?: number,
  errorMessage?: string
) {
  const supabase = createClient();
  
  await supabase.from('api_usage_log').insert({
    api_name: apiName,
    endpoint,
    tickers_count: tickersCount,
    status,
    response_time_ms: responseTimeMs,
    error_message: errorMessage,
  });
}

export async function getMonthlyUsage(): Promise<number> {
  const supabase = createClient();
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('api_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('api_name', 'brapi')
    .eq('status', 'success')
    .gte('created_at', startOfMonth.toISOString());

  return count || 0;
}

export async function canMakeRequest(): Promise<boolean> {
  const usage = await getMonthlyUsage();
  const limit = 15000;
  const buffer = 1000; // Margem de segurança
  
  return usage < (limit - buffer);
}
```

### Edge Function de Atualização

```typescript
// supabase/functions/update-investment-prices/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BRAPI_BASE_URL = 'https://brapi.dev/api';
const MAX_REQUESTS_PER_MONTH = 14000; // Buffer de segurança

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Verificar limite de requests
    const monthlyUsage = await getMonthlyUsage(supabase);
    if (monthlyUsage >= MAX_REQUESTS_PER_MONTH) {
      console.log('⚠️ Limite mensal de requests atingido');
      return new Response(
        JSON.stringify({ error: 'Monthly limit reached' }),
        { status: 429 }
      );
    }

    // 2. Buscar ativos que precisam atualização
    const threeHoursAgo = new Date();
    threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

    const { data: assets, error } = await supabase
      .from('investment_assets')
      .select('*')
      .eq('source', 'brapi')
      .eq('is_active', true)
      .or(`last_updated.is.null,last_updated.lt.${threeHoursAgo.toISOString()}`);

    if (error) throw error;
    if (!assets || assets.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No assets to update' }),
        { status: 200 }
      );
    }

    // 3. Agrupar por tipo
    const stocks = assets.filter(a => ['acao', 'fii', 'etf'].includes(a.type));
    const cryptos = assets.filter(a => a.type === 'cripto');

    let updatedCount = 0;
    let errorCount = 0;

    // 4. Atualizar ações/FIIs em batch
    if (stocks.length > 0) {
      const tickers = stocks.map(a => a.ticker).join(',');
      const startTime = Date.now();

      try {
        const response = await fetch(`${BRAPI_BASE_URL}/quote/${tickers}?token=${Deno.env.get('BRAPI_TOKEN')}`);
        const responseTime = Date.now() - startTime;
        
        if (!response.ok) {
          throw new Error(`Brapi error: ${response.status}`);
        }

        const data = await response.json();

        // Atualizar preços no banco
        for (const result of data.results) {
          const { error: updateError } = await supabase
            .from('investment_assets')
            .update({
              current_price: result.regularMarketPrice,
              previous_close: result.regularMarketPreviousClose,
              last_updated: new Date().toISOString(),
            })
            .eq('ticker', result.symbol);

          if (updateError) {
            console.error(`Error updating ${result.symbol}:`, updateError);
            errorCount++;
          } else {
            updatedCount++;
          }
        }

        // Logar uso da API
        await logApiUsage(supabase, 'brapi', `/quote/${tickers}`, stocks.length, 'success', responseTime);

      } catch (error) {
        console.error('Error fetching stock prices:', error);
        await logApiUsage(supabase, 'brapi', `/quote/${tickers}`, stocks.length, 'error', 0, error.message);
        errorCount += stocks.length;
      }
    }

    // 5. Atualizar criptos (se houver)
    for (const crypto of cryptos) {
      const startTime = Date.now();
      
      try {
        const response = await fetch(`${BRAPI_BASE_URL}/quote/${crypto.ticker}?token=${Deno.env.get('BRAPI_TOKEN')}`);
        const responseTime = Date.now() - startTime;
        
        if (!response.ok) {
          throw new Error(`Brapi error: ${response.status}`);
        }

        const data = await response.json();
        const result = data.results[0];

        await supabase
          .from('investment_assets')
          .update({
            current_price: result.regularMarketPrice,
            previous_close: result.regularMarketPreviousClose,
            last_updated: new Date().toISOString(),
          })
          .eq('ticker', crypto.ticker);

        updatedCount++;
        await logApiUsage(supabase, 'brapi', `/quote/${crypto.ticker}`, 1, 'success', responseTime);

      } catch (error) {
        console.error(`Error fetching crypto ${crypto.ticker}:`, error);
        await logApiUsage(supabase, 'brapi', `/quote/${crypto.ticker}`, 1, 'error', 0, error.message);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: updatedCount,
        errors: errorCount,
        total: assets.length,
        monthlyUsage: monthlyUsage + updatedCount,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});

async function getMonthlyUsage(supabase: any): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('api_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('api_name', 'brapi')
    .eq('status', 'success')
    .gte('created_at', startOfMonth.toISOString());

  return count || 0;
}

async function logApiUsage(
  supabase: any,
  apiName: string,
  endpoint: string,
  tickersCount: number,
  status: string,
  responseTimeMs: number,
  errorMessage?: string
) {
  await supabase.from('api_usage_log').insert({
    api_name: apiName,
    endpoint,
    tickers_count: tickersCount,
    status,
    response_time_ms: responseTimeMs,
    error_message: errorMessage,
  });
}
```

### Configuração do Cron

```sql
-- Configurar cron no Supabase (via pg_cron extension)
-- Executar 3x por dia: 11h, 15h, 18h (horário de Brasília = UTC-3)

SELECT cron.schedule(
  'update-investment-prices-morning',
  '0 14 * * 1-5', -- 11h BRT = 14h UTC, segunda a sexta
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/update-investment-prices',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'update-investment-prices-afternoon',
  '0 18 * * 1-5', -- 15h BRT = 18h UTC, segunda a sexta
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/update-investment-prices',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'update-investment-prices-evening',
  '0 21 * * 1-5', -- 18h BRT = 21h UTC, segunda a sexta
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/update-investment-prices',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

### Fallback Manual

```typescript
// lib/price-fallback.ts
export async function getPriceWithFallback(
  ticker: string,
  assetType: string
): Promise<{ price: number; source: string } | null> {
  try {
    // Tentar Brapi primeiro
    const brapiPrice = await fetchBrapiPrice(ticker);
    if (brapiPrice) {
      return { price: brapiPrice, source: 'brapi' };
    }
  } catch (error) {
    console.error('Brapi failed:', error);
  }

  // Fallback: retornar último preço conhecido
  const supabase = createClient();
  const { data: asset } = await supabase
    .from('investment_assets')
    .select('current_price, last_updated')
    .eq('ticker', ticker)
    .single();

  if (asset?.current_price) {
    return { price: asset.current_price, source: 'fallback' };
  }

  return null;
}
```

---

## 🎛️ Controles Manuais

### Cadastro de Ativo com Controle Manual

```typescript
// components/investments/asset-form.tsx
'use client';

import { useState } from 'react';

export function AssetForm() {
  const [priceSource, setPriceSource] = useState<'auto' | 'manual'>('auto');
  const [manualPrice, setManualPrice] = useState('');

  return (
    <form className="space-y-6">
      {/* Tipo de ativo */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Tipo de Ativo
        </label>
        <select className="w-full bg-[#111827] border border-white/10 rounded-lg p-3">
          <option value="acao">Ação</option>
          <option value="fii">Fundo Imobiliário (FII)</option>
          <option value="etf">ETF</option>
          <option value="renda_fixa">Renda Fixa</option>
          <option value="cripto">Criptomoeda</option>
        </select>
      </div>

      {/* Ticker */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Ticker / Código
        </label>
        <input
          type="text"
          placeholder="Ex: PETR4, MXRF11, BTC-BRL"
          className="w-full bg-[#111827] border border-white/10 rounded-lg p-3"
        />
      </div>

      {/* Fonte do preço */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Atualização de Preço
        </label>
        
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="priceSource"
              value="auto"
              checked={priceSource === 'auto'}
              onChange={(e) => setPriceSource('auto')}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-white">Automático</div>
              <div className="text-sm text-zinc-400">
                Preço atualizado automaticamente 3x ao dia via API
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="priceSource"
              value="manual"
              checked={priceSource === 'manual'}
              onChange={(e) => setPriceSource('manual')}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-white">Manual</div>
              <div className="text-sm text-zinc-400">
                Você controla e atualiza o preço quando quiser
              </div>
            </div>
          </label>
        </div>

        {priceSource === 'manual' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Preço Atual
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value)}
              className="w-full bg-[#111827] border border-white/10 rounded-lg p-3"
            />
          </div>
        )}
      </div>

      {/* Quantidade */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Quantidade
        </label>
        <input
          type="number"
          step="0.0001"
          placeholder="0"
          className="w-full bg-[#111827] border border-white/10 rounded-lg p-3"
        />
      </div>

      {/* Preço médio */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Preço Médio de Compra
        </label>
        <input
          type="number"
          step="0.01"
          placeholder="0,00"
          className="w-full bg-[#111827] border border-white/10 rounded-lg p-3"
        />
      </div>

      {/* Data de compra */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Data de Compra
        </label>
        <input
          type="date"
          className="w-full bg-[#111827] border border-white/10 rounded-lg p-3"
        />
      </div>

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Observações (opcional)
        </label>
        <textarea
          rows={3}
          placeholder="Ex: Compra parcelada, estratégia de longo prazo..."
          className="w-full bg-[#111827] border border-white/10 rounded-lg p-3"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-3 font-medium transition-colors"
      >
        Adicionar Ativo
      </button>
    </form>
  );
}
```

### Edição Rápida de Preço

```typescript
// components/investments/quick-price-edit.tsx
'use client';

import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

export function QuickPriceEdit({ position }: { position: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newPrice, setNewPrice] = useState(position.manual_price || '');

  const handleSave = async () => {
    // Atualizar preço manual
    await updateManualPrice(position.id, parseFloat(newPrice));
    setIsEditing(false);
  };

  if (!position.is_manual_price) {
    return (
      <div className="text-sm text-zinc-400">
        Preço automático
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.01"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          className="w-24 bg-[#111827] border border-white/10 rounded px-2 py-1 text-sm"
          autoFocus
        />
        <button
          onClick={handleSave}
          className="p-1 hover:bg-green-500/10 text-green-400 rounded"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="p-1 hover:bg-red-500/10 text-red-400 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-mono">
        R$ {position.manual_price.toFixed(2)}
      </span>
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 hover:bg-blue-500/10 text-blue-400 rounded"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  );
}
```

### Ajuste de Quantidade

```typescript
// components/investments/quantity-adjuster.tsx
'use client';

export function QuantityAdjuster({ position }: { position: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newQuantity, setNewQuantity] = useState(position.quantidade);

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <h4 className="text-sm font-medium text-zinc-300 mb-3">
        Ajustar Posição
      </h4>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Quantidade Atual
          </label>
          <input
            type="number"
            step="0.0001"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded-lg p-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Preço Médio
          </label>
          <input
            type="number"
            step="0.01"
            defaultValue={position.preco_medio}
            className="w-full bg-[#111827] border border-white/10 rounded-lg p-2 text-sm"
          />
        </div>

        <button
          onClick={() => handleUpdate(position.id, newQuantity)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-2 text-sm font-medium transition-colors"
        >
          Atualizar
        </button>
      </div>
    </div>
  );
}
```

---

## 📅 Fases de Implementação

### **FASE 1: MVP - Fundação (2 semanas)**

#### Semana 1: Backend e Infraestrutura

**Dia 1-2: Banco de Dados**
- [ ] Criar schema completo no Supabase
- [ ] Configurar RLS policies
- [ ] Criar views úteis
- [ ] Testar permissões

**Dia 3-4: Edge Function**
- [ ] Criar função de atualização de preços
- [ ] Implementar integração com Brapi
- [ ] Adicionar logs e monitoramento
- [ ] Configurar cron jobs

**Dia 5: API Routes**
- [ ] POST `/api/investments/assets` - Cadastrar ativo
- [ ] GET `/api/investments/portfolio` - Listar carteira
- [ ] PUT `/api/investments/positions/:id` - Atualizar posição
- [ ] DELETE `/api/investments/positions/:id` - Excluir posição
- [ ] GET `/api/investments/summary` - Resumo financeiro

#### Semana 2: Frontend

**Dia 6-7: Páginas Base**
- [ ] `/dashboard/investimentos` - Página principal
- [ ] `/dashboard/investimentos/carteira` - Lista de ativos
- [ ] `/dashboard/investimentos/novo` - Cadastro de ativo
- [ ] Integração com verificação de plano premium

**Dia 8-9: Componentes**
- [ ] `AssetCard` - Card de ativo individual
- [ ] `AssetForm` - Formulário de cadastro
- [ ] `PortfolioSummary` - Resumo da carteira
- [ ] `PremiumGate` - Bloqueio para plano free

**Dia 10: Dashboard Integration**
- [ ] Card "Patrimônio Investido" no dashboard principal
- [ ] Card "Rentabilidade Total"
- [ ] Mini gráfico de distribuição

#### Entregáveis da Fase 1:
- ✅ Cadastro de ações e FIIs
- ✅ Atualização automática de preços 3x/dia
- ✅ Opção manual para qualquer ativo
- ✅ Cálculo de patrimônio e rentabilidade
- ✅ Integração com planos premium
- ✅ Dashboard básico

---

### **FASE 2: Proventos e Criptos (1 semana)**

**Dia 11-12: Proventos**
- [ ] Tabela de dividendos funcional
- [ ] Formulário de cadastro de provento
- [ ] Página `/dashboard/investimentos/proventos`
- [ ] Cálculo de rentabilidade incluindo proventos
- [ ] Relatório de proventos recebidos

**Dia 13-14: Criptomoedas**
- [ ] Suporte a BTC-BRL, ETH-BRL
- [ ] Atualização 6x/dia para criptos
- [ ] Filtros por tipo de ativo
- [ ] Gráfico de distribuição por tipo

**Dia 15: Melhorias UX**
- [ ] Loading states
- [ ] Error handling
- [ ] Mensagens de sucesso/erro
- [ ] Tooltips explicativos

#### Entregáveis da Fase 2:
- ✅ Gestão completa de proventos
- ✅ Suporte a criptomoedas
- ✅ Relatórios de dividendos
- ✅ UX polida

---

### **FASE 3: Evolução e Relatórios (1 semana)**

**Dia 16-17: Histórico**
- [ ] Tabela `price_history` (opcional)
- [ ] Gráfico de evolução do patrimônio
- [ ] Comparação com período anterior
- [ ] Exportação de dados

**Dia 18-19: Renda Fixa**
- [ ] Suporte a CDB, LCI, Tesouro (manual)
- [ ] Cálculo de rentabilidade por vencimento
- [ ] Alertas de vencimento

**Dia 20: Relatórios Avançados**
- [ ] Relatório de rentabilidade por ativo
- [ ] Relatório de distribuição
- [ ] Exportação PDF
- [ ] Comparação com CDI/IPCA

#### Entregáveis da Fase 3:
- ✅ Histórico de evolução
- ✅ Renda fixa
- ✅ Relatórios avançados
- ✅ Exportações

---

### **FASE 4: Otimizações e Extras (contínuo)**

**Melhorias Futuras:**
- [ ] Alertas de preço
- [ ] Metas de investimento
- [ ] Rebalanceamento de carteira
- [ ] Análise de diversificação
- [ ] Integração com IR (opcional)
- [ ] App mobile (React Native)

---

## 🔒 Segurança e RLS

### ⚠️ PRINCÍPIOS CRÍTICOS DE SEGURANÇA

#### **1. NUNCA Expor Dados Sensíveis no Frontend**

**❌ PROIBIDO expor:**
- Chaves de API (Brapi token)
- Service Role Key do Supabase
- Dados de outros usuários
- Logs internos do sistema
- Informações de infraestrutura

**✅ PERMITIDO expor:**
- Dados do próprio usuário (via RLS)
- Preços públicos de ativos
- Metadados não sensíveis

#### **2. Isolamento Total de Dados**

**Regra de Ouro:** Um usuário NUNCA pode ver dados de outro usuário

**Implementação:**
- ✅ RLS habilitado em TODAS as tabelas
- ✅ Verificação de `auth.uid()` em todas as policies
- ✅ Queries sempre filtradas por `usuario_id`
- ✅ API routes validam autenticação antes de qualquer operação

**Exemplo de Query Segura:**
```typescript
// ❌ ERRADO - Expõe todos os dados
const { data } = await supabase
  .from('investment_positions')
  .select('*');

// ✅ CORRETO - Filtra por usuário autenticado
const { data } = await supabase
  .from('investment_positions')
  .select('*')
  .eq('usuario_id', user.id);
```

#### **3. Validações em Múltiplas Camadas**

**Frontend (UX):**
- Validação de formulários
- Feedback imediato ao usuário
- Prevenção de inputs inválidos

**Backend (Segurança):**
- Validação de tipos
- Validação de ranges (quantidade > 0, preço > 0)
- Verificação de permissões
- Sanitização de inputs

**Database (Integridade):**
- Constraints (CHECK, NOT NULL, UNIQUE)
- Foreign Keys
- Triggers de validação

#### **4. Proteção Contra Ataques Comuns**

**SQL Injection:**
- ✅ Usar Supabase client (prepared statements automáticos)
- ❌ NUNCA concatenar strings em queries

**XSS (Cross-Site Scripting):**
- ✅ React escapa HTML automaticamente
- ✅ Sanitizar inputs de usuário
- ❌ NUNCA usar `dangerouslySetInnerHTML` com dados de usuário

**CSRF (Cross-Site Request Forgery):**
- ✅ Supabase Auth protege automaticamente
- ✅ Tokens de sessão em cookies httpOnly

**Rate Limiting:**
- ✅ Limitar requests por usuário
- ✅ Monitorar uso anormal
- ✅ Bloquear IPs suspeitos

#### **5. Segurança de API Externa (Brapi)**

**Token Management:**
```typescript
// ❌ ERRADO - Token no frontend
const response = await fetch(`https://brapi.dev/api/quote/PETR4?token=${BRAPI_TOKEN}`);

// ✅ CORRETO - Token apenas no backend (Edge Function)
// Frontend chama API interna, que chama Brapi com token seguro
const response = await fetch('/api/investments/update-prices');
```

**Variáveis de Ambiente:**
```bash
# .env.local (NUNCA commitar)
BRAPI_TOKEN=seu_token_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_key_aqui

# Usar apenas em Edge Functions (servidor)
Deno.env.get('BRAPI_TOKEN')
```

#### **6. Auditoria e Monitoramento**

**Logs de Segurança:**
- Tentativas de acesso não autorizado
- Mudanças em dados sensíveis
- Falhas de autenticação
- Uso anormal de API

**Alertas Automáticos:**
- Múltiplas tentativas de acesso negado
- Uso de API acima do normal
- Erros críticos no sistema

### Princípios de Segurança (Resumo)

1. **Isolamento de Dados:**
   - Cada usuário vê apenas suas posições
   - Ativos são compartilhados (preços centralizados)
   - Proventos são privados por posição
   - RLS garante isolamento no nível do banco

2. **Validações em Camadas:**
   - Frontend: UX e feedback
   - Backend: Segurança e lógica de negócio
   - Database: Integridade e constraints
   - Quantidade > 0, Preço médio > 0, Datas válidas

3. **Proteção de Credenciais:**
   - Tokens apenas no servidor
   - Variáveis de ambiente nunca commitadas
   - Service Role Key apenas em Edge Functions
   - Anon Key no frontend (limitado por RLS)

4. **Auditoria Completa:**
   - Logs de todas as chamadas de API
   - Histórico de alterações (via triggers)
   - Monitoramento de uso e anomalias
   - Alertas automáticos para atividades suspeitas

### Políticas RLS Críticas

```sql
-- Usuário só vê suas posições
CREATE POLICY "user_own_positions"
    ON investment_positions
    FOR ALL
    USING (auth.uid() = usuario_id);

-- Usuário só vê seus proventos
CREATE POLICY "user_own_dividends"
    ON investment_dividends
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM investment_positions
            WHERE id = investment_dividends.position_id
            AND usuario_id = auth.uid()
        )
    );

-- Ativos são públicos (leitura)
CREATE POLICY "assets_public_read"
    ON investment_assets
    FOR SELECT
    USING (true);

-- Apenas service_role modifica ativos
CREATE POLICY "assets_service_only"
    ON investment_assets
    FOR ALL
    USING (auth.role() = 'service_role');
```

---

## ✅ Testes e Validação

### Checklist de Testes

#### Testes de Funcionalidade:
- [ ] Cadastro de ativo com preço automático
- [ ] Cadastro de ativo com preço manual
- [ ] Edição de quantidade e preço médio
- [ ] Exclusão de posição
- [ ] Cadastro de provento
- [ ] Cálculo correto de rentabilidade
- [ ] Atualização automática de preços
- [ ] Fallback quando API falha

#### Testes de Segurança:
- [ ] Usuário A não vê posições do usuário B
- [ ] Plano free não acessa módulo
- [ ] Limite de ativos por plano respeitado
- [ ] RLS funcionando corretamente

#### Testes de Performance:
- [ ] Carregamento da carteira < 500ms
- [ ] Atualização de preços < 5s
- [ ] Dashboard não trava com muitos ativos

#### Testes de API:
- [ ] Limite de 15k requests não ultrapassado
- [ ] Logs de API funcionando
- [ ] Fallback ativado quando necessário
- [ ] Cron jobs executando nos horários corretos

---

## 📊 Monitoramento

### Métricas Importantes

1. **Uso de API:**
   - Requests por dia/mês
   - Taxa de sucesso/erro
   - Tempo de resposta médio

2. **Adoção do Módulo:**
   - Usuários ativos no módulo
   - Ativos cadastrados por usuário
   - Proventos registrados

3. **Performance:**
   - Tempo de carregamento de páginas
   - Tempo de atualização de preços
   - Erros de API

### Dashboard de Monitoramento

```sql
-- Query: Uso mensal de API
SELECT 
    DATE_TRUNC('day', created_at) as dia,
    COUNT(*) as total_requests,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as sucesso,
    SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as erro,
    AVG(response_time_ms) as tempo_medio_ms
FROM api_usage_log
WHERE api_name = 'brapi'
    AND created_at >= DATE_TRUNC('month', NOW())
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY dia DESC;

-- Query: Ativos mais populares
SELECT 
    a.ticker,
    a.name,
    COUNT(DISTINCT p.usuario_id) as total_usuarios,
    SUM(p.quantidade) as quantidade_total
FROM investment_assets a
JOIN investment_positions p ON a.id = p.asset_id
GROUP BY a.ticker, a.name
ORDER BY total_usuarios DESC
LIMIT 20;

-- Query: Usuários por plano usando investimentos
SELECT 
    pr.subscription_plan,
    COUNT(DISTINCT p.usuario_id) as total_usuarios,
    AVG(asset_count) as media_ativos
FROM investment_positions p
JOIN profiles pr ON p.usuario_id = pr.id
JOIN (
    SELECT usuario_id, COUNT(*) as asset_count
    FROM investment_positions
    GROUP BY usuario_id
) ac ON p.usuario_id = ac.usuario_id
GROUP BY pr.subscription_plan;
```

---

## 🚀 Próximos Passos

### Após Implementação do MVP:

1. **Validar com Usuários Beta:**
   - Selecionar 10-20 usuários premium
   - Coletar feedback detalhado
   - Iterar rapidamente

2. **Monitorar Métricas:**
   - Uso de API
   - Adoção do módulo
   - Conversão para premium

3. **Expandir Funcionalidades:**
   - Implementar Fase 2 e 3 baseado em demanda
   - Priorizar features mais pedidas

4. **Marketing:**
   - Anunciar novo módulo
   - Criar tutoriais
   - Destacar diferencial competitivo

---

## �️ Garantias de Não-Quebra

### **Princípio Fundamental: Zero Impacto no Sistema Existente**

#### **1. Banco de Dados - Isolamento Total**

**Novas Tabelas (não afetam existentes):**
- `investment_assets`
- `investment_positions`
- `investment_dividends`
- `api_usage_log`

**✅ ZERO modificações em tabelas existentes:**
- `transacoes` - Não tocada
- `lancamentos_futuros` - Não tocada
- `contas_bancarias` - Não tocada
- `categoria_transacoes` - Não tocada
- `cartoes_credito` - Não tocada
- `metas` - Não tocada

**Migrations Reversíveis:**
```sql
-- Todas as migrations terão rollback
-- Exemplo de estrutura:

-- UP Migration
CREATE TABLE investment_assets (...);

-- DOWN Migration (rollback)
DROP TABLE IF EXISTS investment_assets CASCADE;
```

#### **2. Código - Módulo Independente**

**Estrutura de Pastas (nova, isolada):**
```
src/
├── app/
│   └── dashboard/
│       └── investimentos/          # NOVO - não afeta rotas existentes
│           ├── page.tsx
│           ├── carteira/
│           ├── proventos/
│           └── novo/
├── components/
│   └── investments/                # NOVO - componentes isolados
│       ├── asset-card.tsx
│       ├── asset-form.tsx
│       └── portfolio-summary.tsx
├── hooks/
│   └── use-investments.ts          # NOVO - hooks isolados
└── lib/
    └── investments/                # NOVO - lógica isolada
        ├── calculations.ts
        └── api-client.ts
```

**✅ ZERO modificações em:**
- Hooks existentes (`use-transactions`, `use-accounts`, etc.)
- Componentes existentes (dashboard, cards, etc.)
- Rotas existentes
- Contextos existentes

**Apenas adições:**
- Novo item no menu lateral: "Investimentos"
- Novos cards no dashboard (opcionais, não substituem existentes)

#### **3. Integração com Planos - Extensão, não Modificação**

**Tabela `profiles` - Apenas leitura:**
```typescript
// Apenas LÊ o campo subscription_plan
const { data: profile } = await supabase
  .from('profiles')
  .select('subscription_plan')
  .eq('id', user.id)
  .single();

// NUNCA modifica
```

**Lógica de verificação isolada:**
```typescript
// lib/check-investment-access.ts
// Arquivo NOVO, não modifica verificações existentes
export async function checkInvestmentAccess() {
  // Lógica isolada
}
```

#### **4. API Routes - Namespace Isolado**

**Todas as rotas sob `/api/investments/*`:**
- `/api/investments/portfolio`
- `/api/investments/assets`
- `/api/investments/dividends`
- `/api/investments/summary`

**✅ ZERO conflito com rotas existentes:**
- `/api/transactions` - Não tocada
- `/api/accounts` - Não tocada
- `/api/cards` - Não tocada

#### **5. Edge Functions - Independentes**

**Nova função isolada:**
- `update-investment-prices` - Não interfere em nada existente

**Cron jobs isolados:**
- Novos schedules específicos para investimentos
- Não modificam crons existentes

#### **6. Testes de Não-Regressão**

**Checklist antes de cada deploy:**
- [ ] Dashboard principal carrega normalmente
- [ ] Transações funcionam (criar, editar, excluir)
- [ ] Contas bancárias funcionam
- [ ] Cartões de crédito funcionam
- [ ] Categorias funcionam
- [ ] Metas funcionam
- [ ] Relatórios funcionam
- [ ] Filtros (Pessoal/PJ) funcionam
- [ ] Agendamentos funcionam

**Testes automatizados (futuro):**
```typescript
// tests/non-regression.test.ts
describe('Módulo de Investimentos - Não Regressão', () => {
  it('não deve afetar transações existentes', async () => {
    // Testes aqui
  });
  
  it('não deve afetar contas bancárias', async () => {
    // Testes aqui
  });
});
```

#### **7. Rollback Plan**

**Se algo der errado, rollback em 3 passos:**

**Passo 1: Remover do menu**
```typescript
// src/components/layout/sidebar.tsx
// Comentar ou remover item "Investimentos"
```

**Passo 2: Desabilitar rotas**
```typescript
// src/app/dashboard/investimentos/page.tsx
export default function InvestmentsPage() {
  return <div>Módulo temporariamente desabilitado</div>;
}
```

**Passo 3: Rollback do banco (via MCP)**
```sql
-- Executar DOWN migration
DROP TABLE IF EXISTS investment_dividends CASCADE;
DROP TABLE IF EXISTS investment_positions CASCADE;
DROP TABLE IF EXISTS investment_assets CASCADE;
DROP TABLE IF EXISTS api_usage_log CASCADE;
```

**Sistema volta ao estado anterior em < 5 minutos**

#### **8. Monitoramento de Impacto**

**Métricas a observar:**
- Tempo de carregamento do dashboard (não deve aumentar)
- Erros em funcionalidades existentes (deve ser zero)
- Performance de queries existentes (não deve degradar)
- Uso de memória/CPU (não deve aumentar significativamente)

**Alertas automáticos:**
- Se tempo de carregamento > 2s
- Se taxa de erro > 1%
- Se uso de CPU > 80%

---

## �📝 Notas Finais

### Avisos Importantes:

⚠️ **Disclaimer para Usuários:**
> "Este módulo é uma ferramenta de acompanhamento de investimentos. Não oferecemos recomendações de investimento, análise técnica ou execução de ordens. Os preços são atualizados periodicamente e podem não refletir valores em tempo real. Sempre consulte sua corretora para informações oficiais."

⚠️ **Limitações Técnicas:**
- Preços atualizados 3x/dia (não é tempo real)
- API gratuita pode ter instabilidades
- Alguns ativos podem não estar disponíveis
- Criptomoedas têm menor precisão

⚠️ **Responsabilidades:**
- Usuário é responsável por manter dados atualizados
- Cálculos são estimativas, não valores oficiais
- Proventos devem ser cadastrados manualmente
- IR não é calculado automaticamente

---

## 📞 Contato e Suporte

Para dúvidas sobre a implementação:
- Documentação: `/docs/investments`
- Suporte técnico: suporte@granazap.com
- Issues: GitHub Issues

---

**Documento criado em:** Dezembro 2025  
**Última atualização:** Dezembro 2025  
**Versão:** 1.0  
**Status:** Pronto para implementação

---

## ✅ Aprovação

- [ ] Arquitetura revisada
- [ ] Schema do banco aprovado
- [ ] Integração com planos definida
- [ ] Limites de API configurados
- [ ] Fases de implementação acordadas
- [ ] Pronto para começar desenvolvimento

**Próximo passo:** Iniciar Fase 1 - Semana 1 - Dia 1 (Banco de Dados)
