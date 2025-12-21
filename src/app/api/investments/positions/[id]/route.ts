import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidUUID } from '@/lib/investments/validation';
import type { UpdatePositionInput } from '@/types/investments';

// ==============================================================================
// PUT /api/investments/positions/[id] - Atualizar posição
// ==============================================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Validar ID
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Parse do body
    const body: UpdatePositionInput = await request.json();

    // Validações básicas
    if (body.quantidade !== undefined && body.quantidade <= 0) {
      return NextResponse.json(
        { error: 'Quantidade deve ser maior que zero' },
        { status: 400 }
      );
    }

    if (body.preco_medio !== undefined && body.preco_medio <= 0) {
      return NextResponse.json(
        { error: 'Preço médio deve ser maior que zero' },
        { status: 400 }
      );
    }

    if (body.manual_price !== undefined && body.manual_price <= 0) {
      return NextResponse.json(
        { error: 'Preço manual deve ser maior que zero' },
        { status: 400 }
      );
    }

    // Atualizar posição (RLS garante que só atualiza se for do usuário)
    const { data: position, error } = await supabase
      .from('investment_positions')
      .update(body)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Posição não encontrada' },
          { status: 404 }
        );
      }
      console.error('❌ Erro ao atualizar posição:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar posição' },
        { status: 500 }
      );
    }

    return NextResponse.json({ position });

  } catch (error) {
    console.error('❌ Erro na API /api/investments/positions/[id]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ==============================================================================
// DELETE /api/investments/positions/[id] - Excluir posição
// ==============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Validar ID
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Excluir posição (RLS garante que só exclui se for do usuário)
    const { error } = await supabase
      .from('investment_positions')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Posição não encontrada' },
          { status: 404 }
        );
      }
      console.error('❌ Erro ao excluir posição:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir posição' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Erro na API /api/investments/positions/[id]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
