import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateCreatePosition } from '@/lib/investments/validation';
import type { CreatePositionInput } from '@/types/investments';

// ==============================================================================
// GET /api/investments/positions - Listar posições do usuário
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

    // Buscar posições usando a view que já tem todos os cálculos
    const { data: positions, error } = await supabase
      .from('v_positions_detailed')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('tipo_conta', tipoConta)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar posições:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar posições' },
        { status: 500 }
      );
    }

    return NextResponse.json({ positions });

  } catch (error) {
    console.error('❌ Erro na API /api/investments/positions:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ==============================================================================
// POST /api/investments/positions - Criar nova posição
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
    const body: CreatePositionInput = await request.json();

    // Validar input
    const validation = validateCreatePosition(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.errors },
        { status: 400 }
      );
    }

    // Verificar se já existe posição para este ativo
    const { data: existingPosition } = await supabase
      .from('investment_positions')
      .select('id')
      .eq('usuario_id', user.id)
      .eq('asset_id', body.asset_id)
      .single();

    if (existingPosition) {
      return NextResponse.json(
        { error: 'Você já possui uma posição neste ativo' },
        { status: 409 }
      );
    }

    // Criar posição
    const { data: position, error } = await supabase
      .from('investment_positions')
      .insert({
        ...body,
        usuario_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar posição:', error);
      return NextResponse.json(
        { error: 'Erro ao criar posição' },
        { status: 500 }
      );
    }

    return NextResponse.json({ position }, { status: 201 });

  } catch (error) {
    console.error('❌ Erro na API /api/investments/positions:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
