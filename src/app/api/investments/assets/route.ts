import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateCreateAsset } from '@/lib/investments/validation';
import type { CreateAssetInput } from '@/types/investments';

// ==============================================================================
// POST /api/investments/assets - Criar ou buscar ativo
// ==============================================================================
export async function POST(request: NextRequest) {
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

    // Parse do body
    const body: CreateAssetInput = await request.json();

    // Validar input
    const validation = validateCreateAsset(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.errors },
        { status: 400 }
      );
    }

    // Normalizar ticker
    const ticker = body.ticker.toUpperCase().trim();

    // Verificar se ativo já existe
    const { data: existingAsset, error: searchError } = await supabase
      .from('investment_assets')
      .select('*')
      .eq('ticker', ticker)
      .eq('is_active', true)
      .single();

    if (existingAsset) {
      // Ativo já existe, retornar
      return NextResponse.json({
        asset: existingAsset,
        created: false,
      });
    }

    // Criar novo ativo (apenas service_role pode criar)
    // Como RLS bloqueia usuários comuns, vamos retornar erro pedindo para usar manual
    if (searchError && searchError.code === 'PGRST116') {
      // Não encontrado - usuário deve criar manualmente via admin
      return NextResponse.json(
        { 
          error: 'Ativo não encontrado',
          message: 'Este ativo ainda não está cadastrado. Use a opção "Manual" para adicionar.',
          ticker,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao buscar ativo' },
      { status: 500 }
    );

  } catch (error) {
    console.error('❌ Erro na API /api/investments/assets:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ==============================================================================
// GET /api/investments/assets - Listar ativos disponíveis
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
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    // Buscar ativos
    let query = supabase
      .from('investment_assets')
      .select('*')
      .eq('is_active', true)
      .order('ticker', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }

    if (search) {
      query = query.ilike('ticker', `%${search}%`);
    }

    const { data: assets, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar ativos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar ativos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ assets });

  } catch (error) {
    console.error('❌ Erro na API /api/investments/assets:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
