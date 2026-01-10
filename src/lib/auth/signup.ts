import { createClient } from '@/lib/supabase/client';

export interface SignupData {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  acceptTerms: boolean;
}

export interface SignupResult {
  success: boolean;
  error?: string;
  userId?: string;
}

/**
 * Registra um novo usuário no sistema
 * 
 * Fluxo:
 * 1. Cria usuário no Supabase Auth
 * 2. Trigger automático cria registro em public.usuarios
 * 3. Registra consentimento LGPD
 */
export async function signupUser(data: SignupData): Promise<SignupResult> {
  try {
    const supabase = createClient();

    // Verificar se cadastros estão restritos apenas a usuários existentes
    const { data: config } = await supabase
      .from('configuracoes_sistema')
      .select('restringir_cadastro_usuarios_existentes')
      .eq('id', 1)
      .single();

    if (config?.restringir_cadastro_usuarios_existentes === true) {
      // Verificar se o email existe em usuarios_dependentes com convite pendente
      const { data: dependente } = await supabase
        .from('usuarios_dependentes')
        .select('id, email, convite_status')
        .eq('email', data.email.toLowerCase())
        .eq('convite_status', 'pendente')
        .maybeSingle();

      // Se não é dependente com convite pendente, bloquear cadastro
      if (!dependente) {
        return {
          success: false,
          error: 'CADASTRO_BLOQUEADO' // Código especial para o modal
        };
      }
      
      // Se é dependente, permitir continuar o cadastro
    }

    // Validações básicas
    if (!data.acceptTerms) {
      return {
        success: false,
        error: 'Você deve aceitar os termos de uso'
      };
    }

    if (data.password.length < 6) {
      return {
        success: false,
        error: 'A senha deve ter pelo menos 6 caracteres'
      };
    }

    // Verificar se email já existe
    const emailExists = await checkEmailExists(data.email);
    if (emailExists) {
      return {
        success: false,
        error: 'EMAIL_JA_CADASTRADO' // Código especial
      };
    }

    // Verificar se celular já existe (se fornecido)
    if (data.phone) {
      const phoneExists = await checkPhoneExists(data.phone);
      if (phoneExists) {
        return {
          success: false,
          error: 'CELULAR_JA_CADASTRADO' // Código especial
        };
      }
    }

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone || '',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (authError) {
      // Traduzir erros comuns
      if (authError.message.includes('already registered')) {
        return {
          success: false,
          error: 'Este email já está cadastrado'
        };
      }
      
      if (authError.message.includes('password')) {
        return {
          success: false,
          error: 'Senha muito fraca. Use pelo menos 6 caracteres'
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
        error: 'Erro ao criar usuário'
      };
    }

    // 2. O trigger link_existing_user_on_signup já criou o registro em usuarios
    // Vamos buscar o ID do usuário criado
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_user', authData.user.id)
      .single();

    if (usuarioError || !usuario) {
      // Não falha o cadastro, pois o usuário foi criado no auth
    }

    // 3. Registrar consentimento LGPD (se o usuário foi criado)
    if (usuario?.id) {
      try {
        await supabase.from('consentimentos_usuarios').insert({
          usuario_id: usuario.id,
          tipo_consentimento: 'termos_uso',
          versao_politica: '1.0',
          status: true,
          ip_origem: null // Pode adicionar detecção de IP se necessário
        });
      } catch (error) {
        // Não falha o cadastro
      }
    }

    return {
      success: true,
      userId: authData.user.id
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao criar conta. Tente novamente.'
    };
  }
}

/**
 * Verifica se um email já está cadastrado
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      return false;
    }

    return !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Verifica se um celular já está cadastrado
 */
export async function checkPhoneExists(phone: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Limpar formatação do telefone para comparação
    const cleanPhone = phone.replace(/\D/g, '');
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('celular')
      .eq('celular', cleanPhone)
      .maybeSingle();

    if (error) {
      return false;
    }

    return !!data;
  } catch (error) {
    return false;
  }
}
