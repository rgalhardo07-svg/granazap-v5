import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ==============================================================================
// Edge Function: update-investment-prices
// Atualiza preços de ativos via Brapi API
// ==============================================================================

const BRAPI_TOKEN = Deno.env.get("BRAPI_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface BrapiQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketPreviousClose: number;
  regularMarketTime: string;
}

interface BrapiResponse {
  results: BrapiQuote[];
  requestedAt: string;
  took: string;
}

interface UpdateResult {
  success: number;
  failed: number;
  errors: string[];
  updated: string[];
}

Deno.serve(async (req: Request) => {
  try {
    // Verificar método
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Método não permitido" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verificar variáveis de ambiente
    if (!BRAPI_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ Variáveis de ambiente não configuradas");
      return new Response(
        JSON.stringify({ error: "Configuração inválida" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase com service_role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("🚀 Iniciando atualização de preços...");

    // Buscar todos os ativos ativos que usam Brapi
    const { data: assets, error: assetsError } = await supabase
      .from("investment_assets")
      .select("id, ticker, type")
      .eq("is_active", true)
      .eq("source", "brapi");

    if (assetsError) {
      console.error("❌ Erro ao buscar ativos:", assetsError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar ativos" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!assets || assets.length === 0) {
      console.log("ℹ️ Nenhum ativo para atualizar");
      return new Response(
        JSON.stringify({ message: "Nenhum ativo para atualizar", success: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📊 ${assets.length} ativos encontrados`);

    // Agrupar tickers (máximo 10 por request para não exceder limite)
    const batchSize = 10;
    const result: UpdateResult = {
      success: 0,
      failed: 0,
      errors: [],
      updated: [],
    };

    for (let i = 0; i < assets.length; i += batchSize) {
      const batch = assets.slice(i, i + batchSize);
      const tickers = batch.map((a) => a.ticker).join(",");

      console.log(`🔄 Processando lote ${Math.floor(i / batchSize) + 1}: ${tickers}`);

      const startTime = Date.now();

      try {
        // Chamar Brapi API
        const brapiUrl = `https://brapi.dev/api/quote/${tickers}?token=${BRAPI_TOKEN}`;
        const brapiResponse = await fetch(brapiUrl);

        if (!brapiResponse.ok) {
          const errorText = await brapiResponse.text();
          console.error(`❌ Erro na API Brapi (${brapiResponse.status}):`, errorText);
          
          // Log do erro
          await supabase.from("api_usage_log").insert({
            api_name: "brapi",
            endpoint: `/api/quote/${tickers}`,
            tickers_count: batch.length,
            status: brapiResponse.status === 429 ? "rate_limit" : "error",
            response_time_ms: Date.now() - startTime,
            error_message: `HTTP ${brapiResponse.status}: ${errorText.substring(0, 200)}`,
          });

          result.failed += batch.length;
          result.errors.push(`Lote ${tickers}: ${brapiResponse.status}`);
          continue;
        }

        const data: BrapiResponse = await brapiResponse.json();
        const responseTime = Date.now() - startTime;

        // Log de sucesso
        await supabase.from("api_usage_log").insert({
          api_name: "brapi",
          endpoint: `/api/quote/${tickers}`,
          tickers_count: batch.length,
          status: "success",
          response_time_ms: responseTime,
        });

        console.log(`✅ Resposta recebida em ${responseTime}ms`);

        // Atualizar cada ativo
        for (const quote of data.results) {
          const asset = batch.find((a) => a.ticker === quote.symbol);
          if (!asset) continue;

          const { error: updateError } = await supabase
            .from("investment_assets")
            .update({
              current_price: quote.regularMarketPrice,
              previous_close: quote.regularMarketPreviousClose,
              last_updated: new Date().toISOString(),
            })
            .eq("id", asset.id);

          if (updateError) {
            console.error(`❌ Erro ao atualizar ${quote.symbol}:`, updateError);
            result.failed++;
            result.errors.push(`${quote.symbol}: ${updateError.message}`);
          } else {
            console.log(`✅ ${quote.symbol}: R$ ${quote.regularMarketPrice}`);
            result.success++;
            result.updated.push(quote.symbol);
          }
        }

        // Aguardar 1 segundo entre lotes para não sobrecarregar API
        if (i + batchSize < assets.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Erro ao processar lote ${tickers}:`, error);
        result.failed += batch.length;
        result.errors.push(`${tickers}: ${error.message}`);

        // Log do erro
        await supabase.from("api_usage_log").insert({
          api_name: "brapi",
          endpoint: `/api/quote/${tickers}`,
          tickers_count: batch.length,
          status: "error",
          response_time_ms: Date.now() - startTime,
          error_message: error.message.substring(0, 200),
        });
      }
    }

    console.log(`🎉 Atualização concluída: ${result.success} sucesso, ${result.failed} falhas`);

    return new Response(
      JSON.stringify({
        message: "Atualização concluída",
        ...result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Erro fatal:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
