import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        // Redirecionar para login com mensagem de erro
        return NextResponse.redirect(new URL('/?error=auth_error', request.url));
      }
      
      // Sucesso! Redirecionar para dashboard
      return NextResponse.redirect(new URL(next, request.url));
    } catch (error) {
      // Em caso de erro, redirecionar para login
      return NextResponse.redirect(new URL('/?error=callback_error', request.url));
    }
  }

  // Se não tem código, redirecionar para login
  return NextResponse.redirect(new URL('/', request.url));
}
