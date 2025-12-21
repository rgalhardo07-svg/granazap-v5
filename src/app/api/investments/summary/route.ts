import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ==============================================================================
// GET /api/investments/summary - Resumo da carteira de investimentos
// ==============================================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Parâmetros de query
    const { searchParams } = new URL(request.url);
    const tipoConta = searchParams.get('tipo_conta') || 'pessoal';

    // Buscar resumo da carteira
    const { data: portfolioSummary, error: summaryError } = await supabase
      .from('v_portfolio_summary')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('tipo_conta', tipoConta)
      .single();

    // Se não houver dados, retornar resumo vazio
    if (summaryError && summaryError.code === 'PGRST116') {
      return NextResponse.json({
        summary: {
          total_ativos: 0,
          valor_investido: 0,
          valor_atual: 0,
          lucro_prejuizo: 0,
          rentabilidade_percentual: 0,
        },
        byType: [],
        totalDividends: 0,
      });
    }

    if (summaryError) {
      console.error('❌ Erro ao buscar resumo:', summaryError);
      return NextResponse.json(
        { error: 'Erro ao buscar resumo' },
        { status: 500 }
      );
    }

    // Buscar distribuição por tipo de ativo
    const { data: positions, error: positionsError } = await supabase
      .from('v_positions_detailed')
      .select('asset_type, valor_investido, valor_atual')
      .eq('usuario_id', user.id)
      .eq('tipo_conta', tipoConta);

    if (positionsError) {
      console.error('❌ Erro ao buscar posições:', positionsError);
    }

    // Calcular distribuição por tipo
    const typeMap = new Map<string, { invested: number; currentValue: number; count: number }>();
    
    positions?.forEach((pos: any) => {
      const current = typeMap.get(pos.asset_type) || { invested: 0, currentValue: 0, count: 0 };
      typeMap.set(pos.asset_type, {
        invested: current.invested + Number(pos.valor_investido),
        currentValue: current.currentValue + Number(pos.valor_atual),
        count: current.count + 1,
      });
    });

    const totalValue = portfolioSummary.valor_atual || 0;
    const byType = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      invested: data.invested,
      currentValue: data.currentValue,
      percentage: totalValue > 0 ? (data.currentValue / totalValue) * 100 : 0,
    })).sort((a, b) => b.currentValue - a.currentValue);

    // Buscar total de dividendos
    const { data: dividendsData, error: dividendsError } = await supabase
      .from('v_dividends_summary')
      .select('valor_total_proventos')
      .eq('usuario_id', user.id)
      .eq('tipo_conta', tipoConta);

    if (dividendsError) {
      console.error('⚠️ Erro ao buscar dividendos:', dividendsError);
    }

    const totalDividends = dividendsData?.reduce(
      (sum: number, d: any) => sum + (Number(d.valor_total_proventos) || 0), 
      0
    ) || 0;

    return NextResponse.json({
      summary: portfolioSummary,
      byType,
      totalDividends,
    });

  } catch (error) {
    console.error('❌ Erro na API /api/investments/summary:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
