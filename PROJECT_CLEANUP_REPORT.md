# 🧹 Relatório de Limpeza e Sincronização - GranaZap V5

**Data:** 21 de Dezembro de 2025  
**Objetivo:** Preparar projeto para produção com segurança e organização

---

## 📊 Análise Atual do Projeto

### **Banco de Dados (Via MCP Supabase)**

#### ✅ Tabelas Principais (14 tabelas)
1. `usuarios` - 3 registros
2. `categoria_trasacoes` - 27 registros
3. `transacoes` - 29 registros
4. `lancamentos_futuros` - 110 registros
5. `metas_orcamento` - 0 registros
6. `contas_bancarias` - 3 registros
7. `cartoes_credito` - 3 registros
8. `investment_assets` - 9 registros
9. `investment_positions` - 9 registros
10. `investment_dividends` - 0 registros
11. `usuarios_dependentes` - 0 registros
12. `api_usage_log` - 86 registros
13. `cdi_rates` - 4 registros
14. Tabelas auxiliares (planos_sistema, preferencias_notificacao, etc)

#### ✅ Migrations Aplicadas: **72 migrations**
- Última: `20251221014111_update_system_settings_rpc_add_favicon`
- Sistema de versionamento funcionando corretamente

#### ✅ Extensions Instaladas: **8 extensions**
- `pg_graphql` (1.5.11)
- `supabase_vault` (0.3.1)
- `uuid-ossp` (1.1)
- `pg_net` (0.19.5)
- `pg_cron` (1.6.4)
- `http` (1.6)
- `pgcrypto` (1.3)
- `pg_stat_statements` (1.11)

#### ✅ Edge Functions: **2 functions**
- `update-investment-prices` (v4)
- `update-cdi-rates` (v3)

---

## 🗑️ Arquivos para Remover/Organizar

### **Arquivos .MD de Documentação Temporária (12 arquivos)**
```
❌ REMOVER:
- FRONTEND_SECURITY_AUDIT.md (11KB)
- INVESTMENT_EDGE_FUNCTION_SETUP.md (7KB)
- INVESTMENT_FRONTEND_SUMMARY.md (8KB)
- INVESTMENT_MIGRATIONS_LOG.md (16KB)
- INVESTMENT_MODULE_PLAN.md (57KB)
- INVESTMENT_REVIEW.md (12KB)
- MIGRATION-TRANSFERENCIAS.md (2KB)
- SECURITY_ANALYSIS.md (6KB)

✅ MANTER:
- README.md (documentação principal)
- MOBILE_PWA_ROADMAP.md (roadmap ativo)
- SECURITY.md (políticas de segurança)
- WHITE_LABEL_GUIDE.md (guia de configuração)
```

### **Arquivos .SQL Soltos na Raiz (9 arquivos)**
```
❌ MOVER PARA /supabase/migrations/archive/:
- supabase-accounts.sql (2.7KB)
- supabase-add-category-keywords.sql (705B)
- supabase-add-category-type.sql (690B)
- supabase-add-column.sql (1.1KB)
- supabase-add-transferencia-flag.sql (844B)
- supabase-balance-trigger.sql (3.3KB)
- supabase-indexes.sql (2.2KB)
- supabase-team-access.sql (2.2KB)

⚠️ ANALISAR:
- supabase/setup.sql (3000+ linhas - DESATUALIZADO)
```

---

## 🎯 Estratégia de Sincronização do Schema

### **Problema Identificado:**
O arquivo `supabase/setup.sql` (3000+ linhas) está **desatualizado** e não reflete:
- 72 migrations aplicadas desde sua criação
- Novas tabelas (investimentos, cartões, contas)
- Novas colunas (idioma, moeda, keywords, etc)
- Novas functions e triggers

### **Solução Proposta: Arquitetura Modular**

```
supabase/
├── schema/
│   ├── 00_extensions.sql          # Extensions (pg_net, pg_cron, etc)
│   ├── 01_tables.sql              # CREATE TABLE statements
│   ├── 02_functions.sql           # Funções SQL
│   ├── 03_triggers.sql            # Triggers e automações
│   ├── 04_rls_policies.sql        # Políticas RLS
│   ├── 05_indexes.sql             # Índices de performance
│   ├── 06_cron_jobs.sql           # Jobs agendados
│   └── 07_seed_data.sql           # Dados iniciais
├── migrations/
│   ├── archive/                   # Migrations antigas (movidas)
│   └── [migrations atuais]
└── setup.sql                      # Importa todos os módulos
```

### **Vantagens:**
- ✅ Fácil manutenção e versionamento
- ✅ Não estoura limite de tokens
- ✅ Análise modular (arquivo por arquivo)
- ✅ Reutilizável em novos projetos
- ✅ Documentação clara por tipo de objeto

---

## 🔒 Checklist de Segurança para Produção

### **1. Variáveis de Ambiente**
- [ ] `.env` não commitado no Git
- [ ] Secrets do Supabase protegidos
- [ ] API keys em variáveis de ambiente

### **2. RLS (Row Level Security)**
- [x] Todas as 14 tabelas com RLS habilitado
- [x] Políticas testadas e funcionando
- [x] Funções com SECURITY DEFINER protegidas

### **3. Autenticação**
- [x] Sign-up público desabilitado (apenas admin cria usuários)
- [x] Integração com auth.users funcionando
- [x] Triggers de vinculação ativos

### **4. Performance**
- [x] Índices criados para foreign keys
- [x] Índices para consultas frequentes
- [x] Cron jobs otimizados

### **5. Backup e Recuperação**
- [ ] Backup automático configurado no Supabase
- [ ] Plano de recuperação documentado
- [ ] Testes de restore realizados

---

## 📋 Plano de Ação

### **Fase 1: Limpeza Imediata** ⏱️ 10min
1. Remover 8 arquivos .md temporários
2. Mover 8 arquivos .sql para `/supabase/migrations/archive/`
3. Limpar arquivos de build temporários

### **Fase 2: Extração do Schema Atual** ⏱️ 30min
1. Extrair DDL de todas as 14 tabelas
2. Extrair todas as funções SQL
3. Extrair triggers e RLS policies
4. Extrair índices e constraints

### **Fase 3: Criação da Estrutura Modular** ⏱️ 20min
1. Criar pasta `/supabase/schema/`
2. Gerar 7 arquivos modulares
3. Criar `setup.sql` master que importa tudo

### **Fase 4: Validação** ⏱️ 15min
1. Testar setup.sql em banco limpo
2. Comparar com banco de produção
3. Documentar diferenças (se houver)

### **Fase 5: Deploy Checklist** ⏱️ 10min
1. Revisar variáveis de ambiente
2. Confirmar RLS ativo
3. Testar autenticação
4. Verificar Edge Functions

---

## 🚀 Próximos Passos

**Aguardando sua aprovação para:**
1. Executar Fase 1 (limpeza de arquivos)
2. Iniciar extração do schema via MCP
3. Gerar estrutura modular

**Tempo estimado total:** ~1h30min
