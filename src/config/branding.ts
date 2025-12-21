/**
 * White-label Branding Configuration
 * 
 * Este arquivo centraliza todas as configurações de marca/branding
 * que podem ser customizadas pelo admin no futuro.
 * 
 * Para implementar o painel admin, estas configurações devem ser
 * movidas para um banco de dados e carregadas dinamicamente.
 */

export const brandingConfig = {
  // Informações da Marca
  brand: {
    name: "GranaZap",
    logoText: "G", // Inicial para o logo
    tagline: "Transforme sua relação com o dinheiro e alcance seus objetivos financeiros",
    taglineSignup: "A melhor decisão que tomei para organizar minhas finanças",
  },

  // Cores do Tema (CSS Variables) - APENAS COMO FALLBACK
  colors: {
    primary: "var(--primary)", // Verde principal
    primaryDark: "var(--primary-dark)", // Verde escuro (se existir)
    primaryLight: "var(--primary-light)", // Verde claro
    
    background: {
      main: "#0F172A", // Background principal
      card: "#1E293B", // Background dos cards
      gradient: {
        from: "#1E3A2F", // Início do gradiente (verde escuro)
        via: "#0F172A", // Meio do gradiente
        to: "#0F172A", // Fim do gradiente
      }
    },

    text: {
      primary: "#FFFFFF", // Texto principal
      secondary: "#A1A1AA", // Texto secundário (zinc-400)
      muted: "#71717A", // Texto muted (zinc-500)
    },

    border: {
      default: "rgba(255, 255, 255, 0.1)", // Borda padrão
      focus: "var(--primary)", // Borda no focus
    }
  },

  // Textos Customizáveis
  texts: {
    login: {
      title: "Bem-vindo de volta",
      subtitle: "Entre com suas credenciais para continuar",
      buttonText: "Entrar",
      buttonLoading: "Entrando...",
      forgotPassword: "Esqueceu a senha?",
      noAccount: "Não tem uma conta?",
      signupLink: "Cadastre-se",
      rememberMe: "Lembrar de mim",
      orContinueWith: "ou continue com",
    },
    signup: {
      title: "Crie sua conta",
      subtitle: "Comece a gerenciar suas finanças hoje",
      buttonText: "Criar conta",
      buttonLoading: "Criando conta...",
      hasAccount: "Já possui uma conta?",
      loginLink: "Entrar",
      orSignupWith: "ou cadastre-se com",
      acceptTerms: "Eu aceito os",
      termsOfUse: "Termos de Uso",
      and: "e a",
      privacyPolicy: "Política de Privacidade",
    },
    benefits: {
      title: "Comece sua jornada financeira",
      subtitle: "Junte-se a milhares de usuários que já transformaram suas finanças",
      items: [
        {
          title: "Controle Total",
          description: "Gerencie todas as suas contas em um só lugar"
        },
        {
          title: "Insights Inteligentes",
          description: "Receba recomendações personalizadas"
        },
        {
          title: "Segurança Garantida",
          description: "Seus dados protegidos com criptografia"
        }
      ]
    },
    stats: {
      users: {
        value: "50K+",
        label: "Usuários"
      },
      rating: {
        value: "4.9",
        label: "Avaliação"
      },
      uptime: {
        value: "99.9%",
        label: "Uptime"
      }
    }
  },

  // Configurações de Formulários
  forms: {
    fields: {
      email: {
        label: "Email",
        placeholder: "seu@email.com"
      },
      password: {
        label: "Senha",
        placeholder: "Digite sua senha"
      },
      confirmPassword: {
        label: "Confirmar senha",
        placeholder: "Digite a senha novamente"
      },
      fullName: {
        label: "Nome completo",
        placeholder: "Seu nome completo"
      },
      phone: {
        label: "Telefone",
        placeholder: "(00) 00000-0000",
        optional: true
      }
    },
    validation: {
      email: {
        invalid: "Email inválido"
      },
      password: {
        minLength: 6,
        message: "Senha deve ter pelo menos 6 caracteres"
      },
      fullName: {
        minLength: 3,
        message: "Nome deve ter pelo menos 3 caracteres"
      },
      phone: {
        minLength: 10,
        message: "Telefone inválido"
      }
    }
  },

  // Idiomas Disponíveis
  languages: [
    { code: "pt", label: "PT", active: true },
    { code: "es", label: "ES", active: false },
    { code: "en", label: "EN", active: false }
  ],

  // Provedores de Login Social
  socialProviders: {
    google: {
      enabled: true,
      label: "Google"
    },
    apple: {
      enabled: true,
      label: "Apple"
    }
  },

  // Animações
  animations: {
    enabled: true,
    duration: {
      fast: 0.3,
      normal: 0.6,
      slow: 0.8
    }
  }
};

// Tipo para TypeScript
export type BrandingConfig = typeof brandingConfig;
