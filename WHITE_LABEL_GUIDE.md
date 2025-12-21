# 🎨 Guia White-Label - GranaZap

Este documento explica como o sistema foi estruturado para suportar customização white-label e como implementar o painel administrativo no futuro.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura Atual](#estrutura-atual)
3. [Configurações Customizáveis](#configurações-customizáveis)
4. [Implementação Futura](#implementação-futura)
5. [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 Visão Geral

O sistema foi desenvolvido com arquitetura white-label, permitindo que cada cliente customize:

- ✅ Cores e tema visual
- ✅ Textos e mensagens
- ✅ Logo e branding
- ✅ Idiomas
- ✅ Provedores de login social
- ✅ Validações de formulários

---

## 📁 Estrutura Atual

### Arquivos de Configuração

```
src/
├── config/
│   └── branding.ts          # Configurações centralizadas de branding
├── app/
│   ├── globals.css          # Variáveis CSS customizáveis
│   ├── page.tsx             # Página de login
│   └── cadastro/
│       └── page.tsx         # Página de cadastro
└── components/
    ├── auth/
    │   ├── login-form.tsx   # Formulário de login
    │   └── signup-form.tsx  # Formulário de cadastro
    └── ui/
        ├── button.tsx       # Botão customizável
        ├── input.tsx        # Input customizável
        └── checkbox.tsx     # Checkbox customizável
```

### CSS Variables (globals.css)

As cores principais são definidas como variáveis CSS:

```css
:root {
  --primary: 142.1 76.2% 36.3%; /* #22C55E - Verde */
  --ring: 142.1 76.2% 36.3%;
}

.dark {
  --primary: 142.1 76.2% 36.3%;
  --ring: 142.1 76.2% 36.3%;
}
```

---

## ⚙️ Configurações Customizáveis

### 1. Cores do Tema

**Arquivo:** `src/config/branding.ts`

```typescript
colors: {
  primary: "#22C55E",        // Cor principal
  primaryDark: "#16A34A",    // Variação escura
  primaryLight: "#4ADE80",   // Variação clara
  
  background: {
    main: "#0F172A",         // Background principal
    card: "#1E293B",         // Background dos cards
    gradient: {
      from: "#1E3A2F",       // Gradiente inicial
      via: "#0F172A",        // Gradiente meio
      to: "#0F172A",         // Gradiente final
    }
  }
}
```

### 2. Textos e Mensagens

Todos os textos são centralizados:

```typescript
texts: {
  login: {
    title: "Bem-vindo de volta",
    subtitle: "Entre com suas credenciais para continuar",
    buttonText: "Entrar",
    // ... mais textos
  },
  signup: {
    title: "Crie sua conta",
    subtitle: "Comece a gerenciar suas finanças hoje",
    // ... mais textos
  }
}
```

### 3. Branding

```typescript
brand: {
  name: "GranaZap",
  logoText: "G",
  tagline: "Transforme sua relação com o dinheiro...",
}
```

### 4. Validações

```typescript
forms: {
  validation: {
    password: {
      minLength: 6,
      message: "Senha deve ter pelo menos 6 caracteres"
    },
    // ... outras validações
  }
}
```

---

## 🚀 Implementação Futura

### Fase 1: Banco de Dados

Criar tabela de configurações:

```sql
CREATE TABLE tenant_branding (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  
  -- Cores
  primary_color VARCHAR(7),
  primary_dark VARCHAR(7),
  background_main VARCHAR(7),
  background_card VARCHAR(7),
  
  -- Branding
  brand_name VARCHAR(100),
  logo_url TEXT,
  tagline TEXT,
  
  -- Textos
  login_title VARCHAR(200),
  login_subtitle VARCHAR(200),
  signup_title VARCHAR(200),
  
  -- Configurações
  config JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Fase 2: API de Configuração

Criar endpoint para buscar configurações:

```typescript
// app/api/branding/route.ts
export async function GET(request: Request) {
  const tenantId = getTenantFromRequest(request);
  const branding = await db.query(
    'SELECT * FROM tenant_branding WHERE tenant_id = $1',
    [tenantId]
  );
  
  return Response.json(branding);
}
```

### Fase 3: Context Provider

Criar provider para disponibilizar configurações:

```typescript
// contexts/BrandingContext.tsx
'use client';

import { createContext, useContext } from 'react';
import { BrandingConfig } from '@/config/branding';

const BrandingContext = createContext<BrandingConfig | null>(null);

export function BrandingProvider({ 
  children, 
  config 
}: { 
  children: React.ReactNode;
  config: BrandingConfig;
}) {
  return (
    <BrandingContext.Provider value={config}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within BrandingProvider');
  }
  return context;
}
```

### Fase 4: Painel Admin

Criar interface para customização:

```typescript
// app/admin/branding/page.tsx
'use client';

export default function BrandingAdmin() {
  return (
    <div className="p-8">
      <h1>Customização de Marca</h1>
      
      {/* Seção de Cores */}
      <section>
        <h2>Cores</h2>
        <ColorPicker 
          label="Cor Primária"
          value={primaryColor}
          onChange={setPrimaryColor}
        />
      </section>
      
      {/* Seção de Textos */}
      <section>
        <h2>Textos</h2>
        <Input
          label="Título da Página de Login"
          value={loginTitle}
          onChange={setLoginTitle}
        />
      </section>
      
      {/* Seção de Logo */}
      <section>
        <h2>Logo</h2>
        <FileUpload
          accept="image/*"
          onUpload={handleLogoUpload}
        />
      </section>
    </div>
  );
}
```

---

## 💡 Exemplos de Uso

### Usando Configurações no Componente

```typescript
import { brandingConfig } from '@/config/branding';

export function LoginPage() {
  const { texts, colors } = brandingConfig;
  
  return (
    <div>
      <h1>{texts.login.title}</h1>
      <p>{texts.login.subtitle}</p>
      <Button style={{ backgroundColor: colors.primary }}>
        {texts.login.buttonText}
      </Button>
    </div>
  );
}
```

### Aplicando Cores Dinamicamente

```typescript
// Futuro: carregar do banco de dados
const branding = await fetchBranding(tenantId);

// Aplicar CSS variables
document.documentElement.style.setProperty(
  '--primary',
  branding.colors.primary
);
```

### Multi-tenancy

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const tenant = getTenantFromHostname(hostname);
  
  // Adicionar tenant ao request
  request.headers.set('x-tenant-id', tenant.id);
  
  return NextResponse.next();
}
```

---

## 🎨 Componentes Customizáveis

### Button

- ✅ Cores (primary, secondary, etc)
- ✅ Tamanhos
- ✅ Bordas arredondadas
- ✅ Sombras e efeitos

### Input

- ✅ Background e bordas
- ✅ Cores de focus
- ✅ Ícones
- ✅ Placeholders

### Checkbox

- ✅ Cores checked/unchecked
- ✅ Tamanho
- ✅ Bordas

---

## 📝 Checklist de Implementação

### Curto Prazo
- [x] Estrutura de configuração centralizada
- [x] CSS variables para cores
- [x] Componentes reutilizáveis
- [ ] Hook useBranding
- [ ] Context Provider

### Médio Prazo
- [ ] Banco de dados de configurações
- [ ] API de branding
- [ ] Upload de logo
- [ ] Preview em tempo real

### Longo Prazo
- [ ] Painel admin completo
- [ ] Multi-tenancy
- [ ] Temas pré-definidos
- [ ] Importar/Exportar configurações

---

## 🔧 Manutenção

### Adicionando Nova Cor

1. Adicionar em `branding.ts`:
```typescript
colors: {
  newColor: "#HEXCODE"
}
```

2. Adicionar CSS variable em `globals.css`:
```css
:root {
  --new-color: [HSL values];
}
```

3. Usar no Tailwind:
```typescript
className="bg-[var(--new-color)]"
```

### Adicionando Novo Texto

1. Adicionar em `branding.ts`:
```typescript
texts: {
  newSection: {
    newText: "Texto aqui"
  }
}
```

2. Usar no componente:
```typescript
const { texts } = brandingConfig;
<p>{texts.newSection.newText}</p>
```

---

## 📚 Recursos Adicionais

- [Tailwind CSS Variables](https://tailwindcss.com/docs/customizing-colors#using-css-variables)
- [Next.js Multi-tenancy](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Desenvolvido com ❤️ para ser totalmente customizável**
