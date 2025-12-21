import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  
  // Rotas públicas que não precisam de auth ou verificação de plano
  // /planos agora é pública!
  if (!isDashboardRoute && !isAdminRoute) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Se não tem usuário, redireciona para login
  if (!user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // --- Lógica de Bloqueio por Plano Expirado ---
  // (Não precisa mais verificar isPlansRoute pois /planos é pública)
  // 1. Buscar perfil do usuário
  const { data: profile } = await supabase
    .from('usuarios')
    .select('plano, data_final_plano, status, is_admin')
    .eq('auth_user', user.id)
    .single()

  if (profile) {
    // Admin nunca é bloqueado
    if (!profile.is_admin) {
      let isAccessAllowed = false;

      // 1. Verificar expiração do próprio usuário
      if (profile.data_final_plano) {
        const expirationDate = new Date(profile.data_final_plano);
        const now = new Date();
        if (expirationDate > now) {
          isAccessAllowed = true;
        }
      }

      // 2. Se não permitido pelo plano pessoal, verificar se é Dependente com Pai ativo
      if (!isAccessAllowed) {
        const { data: dependency } = await supabase
          .from('usuarios_dependentes')
          .select('usuario_principal_id, status, convite_status')
          .eq('auth_user_id', user.id)
          .eq('status', 'ativo')
          .eq('convite_status', 'aceito')
          .single();

        if (dependency) {
          // Verificar plano do Pai
          const { data: parentProfile } = await supabase
            .from('usuarios')
            .select('data_final_plano, status')
            .eq('id', dependency.usuario_principal_id)
            .single();
          
          if (parentProfile && parentProfile.status === 'ativo' && parentProfile.data_final_plano) {
            const parentExpiration = new Date(parentProfile.data_final_plano);
            const now = new Date();
            if (parentExpiration > now) {
              isAccessAllowed = true;
            }
          }
        }
      }

      // Se após todas as verificações ainda não tiver acesso ->
      // Marca cookie para o frontend saber que deve bloquear
      if (!isAccessAllowed) {
         response.cookies.set('subscription_status', 'expired')
      } else {
         // Garante que não tenha o cookie se estiver permitido
         response.cookies.delete('subscription_status')
      }
    }
  }

  // Se está tentando acessar rota admin, verificar se é admin
  if (isAdminRoute) {
    const { data: profile } = await supabase
      .from('usuarios')
      .select('is_admin')
      .eq('auth_user', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
