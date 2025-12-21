import { createClient } from '@/lib/supabase/client';

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  userId?: string;
}

/**
 * Realiza login do usuário
 */
export async function loginUser(data: LoginData): Promise<LoginResult> {
  try {
    const supabase = createClient();

    // Fazer login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      // Traduzir erros comuns
      if (authError.message.includes('Invalid login credentials')) {
        return {
          success: false,
          error: 'Email ou senha incorretos'
        };
      }

      if (authError.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: 'Por favor, confirme seu email antes de fazer login'
        };
      }

      return {
        success: false,
        error: authError.message
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Erro ao fazer login'
      };
    }

    // Registrar último acesso (opcional, pode ser feito via trigger também)
    try {
      await supabase.rpc('registrar_acesso_usuario');
    } catch (error) {
      // Não falha o login
    }

    return {
      success: true,
      userId: authData.user.id
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao fazer login. Tente novamente.'
    };
  }
}

/**
 * Realiza logout do usuário
 */
export async function logoutUser(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch (error) {
    // Ignora erro no logout
  }
}

/**
 * Verifica se o usuário está autenticado
 */
export async function getCurrentUser() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}
