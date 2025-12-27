import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Detecta automaticamente storage disponível (localStorage, cookies, etc)
        detectSessionInUrl: true,
        // Persiste sessão mesmo após refresh
        persistSession: true,
        // Auto-refresh token antes de expirar
        autoRefreshToken: true,
        // Tenta recuperar sessão de storage
        storageKey: 'supabase.auth.token',
      },
      global: {
        headers: {
          'x-client-info': 'granazap-web',
        },
      },
    }
  )
}
