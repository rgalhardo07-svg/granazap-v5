"use client";

import { useState } from "react";
import { 
  MessageCircle, 
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Info,
  Zap,
  BookOpen,
  Send
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useUser } from "@/hooks/use-user";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { useBranding } from "@/contexts/branding-context";
import { cn } from "@/lib/utils";

export function WhatsAppAgentPage() {
  const { t } = useLanguage();
  const { profile } = useUser();
  const { data: whatsappConfig } = useWhatsAppConfig();
  const { settings } = useBranding();
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Extrair número do WhatsApp da URL configurada no admin
  const extractPhoneFromUrl = (url: string) => {
    if (!url) return '';
    // Tenta extrair número de diferentes formatos de URL do WhatsApp
    const patterns = [
      /wa\.me\/(\d+)/, // https://wa.me/5591986122789
      /api\.whatsapp\.com\/send\?phone=(\d+)/, // https://api.whatsapp.com/send?phone=5591986122789
      /whatsapp\.com\/send\?phone=(\d+)/, // https://whatsapp.com/send?phone=5591986122789
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    
    return '';
  };

  const agentPhoneClean = extractPhoneFromUrl(whatsappConfig?.whatsapp_contact_url || '');
  const formatPhone = (phone: string) => {
    if (!phone || phone.length < 10) return '';
    // Formato: +55 (XX) XXXXX-XXXX ou +55 (XX) XXXX-XXXX
    if (phone.length === 13) {
      // Formato com 9 dígitos (celular)
      return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
    } else if (phone.length === 12) {
      // Formato com 8 dígitos (fixo)
      return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 8)}-${phone.slice(8)}`;
    }
    // Fallback: retorna com + na frente
    return `+${phone}`;
  };
  const agentPhone = formatPhone(agentPhoneClean);

  // Dados do usuário e app
  const userName = profile?.nome?.split(' ')[0] || 'Usuário';
  const userPhone = profile?.celular || '';
  const appName = settings.appName || 'GranaZap';

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(agentPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (!whatsappConfig?.whatsapp_contact_url) return;
    const message = encodeURIComponent(`Olá! Sou ${userName} e gostaria de usar o assistente do ${appName}.`);
    const url = whatsappConfig.whatsapp_contact_url.includes('?') 
      ? `${whatsappConfig.whatsapp_contact_url}&text=${message}`
      : `${whatsappConfig.whatsapp_contact_url}?text=${message}`;
    window.open(url, '_blank');
  };

  const features = [
    {
      title: "Registrar Despesas",
      description: "Adicione gastos já realizados",
      examples: [
        "Gastei 230 no mercado",
        "Comprei 85 reais de remédio",
        "Gastei 80 no supermercado com cartão de débito Nubank",
        "Almocei no restaurante 45 reais, alimentação",
        "Recebi 5000 de salário na conta Nubank",
        "Gastei 95 de Uber transporte",
        "Comprei material de escritório 120 na empresa"
      ]
    },
    {
      title: "Registrar Receitas",
      description: "Adicione entradas de dinheiro",
      examples: [
        "Recebi 3500 de salário",
        "Entrou 800 de freelance no perfil empresarial",
        "Recebi 260 de comissão de vendas na empresa",
        "Recebi 180 de reembolso do plano de saúde",
        "Vendi um produto por 450 reais na empresa",
        "Recebi aluguel 1500",
        "Entrou 1200 de consultoria na conta empresarial"
      ]
    },
    {
      title: "Consultar Extrato",
      description: "Veja seus gastos e receitas",
      examples: [
        "Quero ver minhas despesas",
        "Extrato do mês da empresa",
        "Gastos de hoje",
        "Despesas da semana no perfil empresarial",
        "Quanto gastei em alimentação este mês?",
        "Minhas receitas de ontem na empresa",
        "Gastos com transporte dos últimos 7 dias"
      ]
    },
    {
      title: "Ver Saldo e Relatórios",
      description: "Acompanhe suas finanças",
      examples: [
        "Qual meu saldo?",
        "Resumo financeiro da empresa",
        "Relatório de novembro",
        "Balanço do mês na conta empresarial",
        "Como estão minhas finanças?"
      ]
    },
    {
      title: "Lançamentos Futuros",
      description: "Gerencie contas a pagar e recorrentes",
      examples: [
        "Tenho IPTU de 70 reais vence dia 10/01/2026 e são 3 parcelas",
        "Comprei notebook de 3000 em 12 parcelas no crédito Nubank",
        "Agendar 1500 na conta Bradesco PJ para dia 10",
        "Tenho Netflix mensal recorrente de 29,90 e data final é 10/01/2027",
        "Aluguel recorrente 1200 todo dia 5"
      ]
    },
    {
      title: "Cartões (Débito e Crédito)",
      description: "Use cartões e controle faturas",
      examples: [
        "Gastei 80 no supermercado com cartão de débito Nubank",
        "Comprei roupa 150 no crédito Nubank",
        "Gastei 300 parcelado em 3x no cartão de crédito Itaú",
        "Qual a fatura atual do cartão Nubank?",
        "Quanto tenho de limite disponível no Itaú?"
      ]
    },
    {
      title: "Excluir e Gerenciar",
      description: "Exclua transações e gerencie dados",
      examples: [
        "Excluir transação 12345",
        "Cancelar lançamento 67890",
        "Remover última transação"
      ]
    }
  ];

  if (!whatsappConfig?.whatsapp_enabled) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <MessageCircle className="w-16 h-16 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-semibold text-zinc-400">Assistente WhatsApp Indisponível</h3>
          <p className="text-sm text-zinc-500">O assistente não está habilitado no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-xl">
              <MessageCircle className="w-6 h-6 text-green-500" />
            </div>
            Assistente WhatsApp
          </h1>
          <p className="text-zinc-400 text-sm mt-2">
            Gerencie suas finanças pelo WhatsApp com inteligência artificial
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 rounded-2xl p-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-xs font-medium text-green-400">Powered by AI</span>
            </div>
            
            <h2 className="text-3xl font-bold text-white">
              Olá, {userName}!
            </h2>
            
            <p className="text-zinc-300 leading-relaxed">
              Converse com nosso assistente inteligente e gerencie suas finanças de forma simples e rápida pelo WhatsApp.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleOpenWhatsApp}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 group"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Iniciar Conversa</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={handleCopyPhone}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium border border-white/10 transition-all flex items-center justify-center gap-2"
              >
                {copiedPhone ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Número Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Número</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-[#0A0F1C] border border-white/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Info className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="font-semibold text-white">Informações de Contato</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Número do Assistente</p>
                {agentPhone ? (
                  <p className="text-lg font-mono font-bold text-green-400">{agentPhone}</p>
                ) : whatsappConfig?.whatsapp_contact_url ? (
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">Configurado via URL</p>
                    <p className="text-xs text-zinc-500 break-all">{whatsappConfig.whatsapp_contact_url}</p>
                  </div>
                ) : (
                  <p className="text-sm text-yellow-400">Não configurado no painel admin</p>
                )}
              </div>
              
              <div className="h-px bg-white/5" />
              
              <div>
                <p className="text-xs text-zinc-500 mb-1">Seu Número Cadastrado</p>
                {userPhone ? (
                  <p className="text-sm font-medium text-white">{userPhone}</p>
                ) : (
                  <p className="text-sm text-zinc-500 italic">Cadastre seu telefone no perfil</p>
                )}
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
                <p className="text-xs text-blue-300 leading-relaxed">
                  💡 <strong>Dica:</strong> Salve o número do assistente como "{appName}" na sua agenda para não perder as mensagens!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Info about Personal/PJ */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-400 mb-2">Entenda como funciona Pessoal vs PJ</h3>
            <div className="space-y-2 text-sm text-zinc-300">
              <p>
                <strong className="text-white">Padrão (Pessoal):</strong> Quando você não especificar, todas as transações vão para a conta <strong>Pessoal</strong>.
              </p>
              <p>
                <strong className="text-white">PJ/Empresa:</strong> Use palavras como <span className="text-blue-300 font-medium">"empresa"</span>, <span className="text-blue-300 font-medium">"PJ"</span>, <span className="text-blue-300 font-medium">"negócio"</span>, <span className="text-blue-300 font-medium">"empresarial"</span> para lançar na conta PJ.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h2 className="text-xl font-bold text-white">O que você pode fazer</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="bg-[#111827] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all group"
            >
              <h3 className="font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-zinc-400 mb-4">{feature.description}</p>
              
              <div className="space-y-2">
                {feature.examples.map((example, i) => (
                  <div 
                    key={i}
                    className="flex items-start gap-2 text-xs text-zinc-500 bg-[#0A0F1C] rounded-lg px-3 py-2 border border-white/5"
                  >
                    <Send className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>"{example}"</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-bold text-white">Como Funciona</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-xl font-bold text-green-400">1</span>
            </div>
            <h3 className="font-semibold text-white">Salve o Contato</h3>
            <p className="text-sm text-zinc-400">
              Adicione o número do assistente na sua agenda do celular
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-xl font-bold text-blue-400">2</span>
            </div>
            <h3 className="font-semibold text-white">Inicie a Conversa</h3>
            <p className="text-sm text-zinc-400">
              Clique no botão acima ou envie uma mensagem diretamente
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-xl font-bold text-purple-400">3</span>
            </div>
            <h3 className="font-semibold text-white">Converse Naturalmente</h3>
            <p className="text-sm text-zinc-400">
              Fale como se estivesse conversando com um amigo
            </p>
          </div>
        </div>
      </div>

      {/* Practical Tips Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h2 className="text-xl font-bold text-white">💡 Dicas Importantes</h2>
        </div>

        {/* Transaction Types */}
        <div className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🔹</span>
            Entenda a Diferença: Gastei vs Paguei vs Tenho que Pagar
          </h3>
          
          <div className="space-y-4">
            <div className="bg-[#0A0F1C] rounded-lg p-4 border border-white/5">
              <h4 className="font-semibold text-green-400 mb-2">✅ "GASTEI" - Transação Imediata (Já Aconteceu)</h4>
              <p className="text-sm text-zinc-400 mb-3">Use quando você acabou de fazer uma compra AGORA:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#111827] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>"Gastei 50 no mercado"</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#111827] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>"Comprei 150 na farmácia"</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#111827] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>"Recebi 3000 de salário"</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0A0F1C] rounded-lg p-4 border border-white/5">
              <h4 className="font-semibold text-blue-400 mb-2">📅 "TENHO QUE PAGAR" - Agendamento Futuro</h4>
              <p className="text-sm text-zinc-400 mb-3">Use para pagamentos que vão acontecer no futuro:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#111827] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>"Tenho que pagar 1500 de aluguel dia 10"</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#111827] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>"Agendar conta de luz de 200 para dia 15"</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#111827] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>"Preciso pagar 500 de dentista semana que vem"</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0A0F1C] rounded-lg p-4 border border-white/5">
              <h4 className="font-semibold text-purple-400 mb-2">✔️ "PAGUEI" - Confirmar Pagamento Agendado</h4>
              <p className="text-sm text-zinc-400 mb-3">Use para confirmar algo que estava agendado:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#111827] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>"Paguei o aluguel hoje"</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#111827] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>"Quitei a parcela 2 do IPTU"</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#111827] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>"Efetuei o pagamento da internet"</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credit vs Debit */}
        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">💳</span>
            Cartão de Débito vs Crédito
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[#0A0F1C] rounded-lg p-4 border border-white/5">
              <h4 className="font-semibold text-green-400 mb-2">Débito - Desconta Agora</h4>
              <p className="text-xs text-zinc-400 mb-3">Registra imediatamente e desconta do saldo:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#111827] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>"Gastei 80 no supermercado com cartão de débito Nubank"</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#111827] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>"Comprei 45 na farmácia débito Itaú"</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0A0F1C] rounded-lg p-4 border border-white/5">
              <h4 className="font-semibold text-orange-400 mb-2">Crédito - Fica em Aberto</h4>
              <p className="text-xs text-zinc-400 mb-3">Fica em aberto até pagar a fatura:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#111827] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span>"Comprei 250 de roupas no crédito Nubank"</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#111827] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span>"Gastei 180 no restaurante com cartão de crédito Itaú"</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Installments */}
        <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Parcelamento em Cartão de Crédito
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-zinc-300 bg-[#0A0F1C] rounded-lg px-4 py-3 border border-white/5">
              <Send className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
              <span>"Comprei notebook de 3000 em 12 parcelas no crédito Nubank"</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-zinc-300 bg-[#0A0F1C] rounded-lg px-4 py-3 border border-white/5">
              <Send className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
              <span>"Parcelei 600 em 6x no cartão de crédito Itaú"</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-zinc-300 bg-[#0A0F1C] rounded-lg px-4 py-3 border border-white/5">
              <Send className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
              <span>"Compra de 1200 dividida em 10 parcelas crédito Inter"</span>
            </div>
          </div>
        </div>

        {/* Bank Account Specific */}
        <div className="bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🏦</span>
            Transações em Conta Bancária Específica
          </h3>
          
          <p className="text-sm text-zinc-400 mb-3">Mencione a conta para vincular a transação:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-zinc-300 bg-[#0A0F1C] rounded-lg px-4 py-3 border border-white/5">
              <Send className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
              <span>"Recebi 5000 de salário na conta Nubank"</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-zinc-300 bg-[#0A0F1C] rounded-lg px-4 py-3 border border-white/5">
              <Send className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
              <span>"Gastei 800 de aluguel pela conta Itaú"</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-zinc-300 bg-[#0A0F1C] rounded-lg px-4 py-3 border border-white/5">
              <Send className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
              <span>"Agendar 1500 na conta Bradesco PJ para dia 10"</span>
            </div>
          </div>
        </div>

        {/* Recurring Payments */}
        <div className="bg-gradient-to-br from-pink-500/10 via-pink-500/5 to-transparent border border-pink-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🔄</span>
            Lançamentos Recorrentes
          </h3>
          
          <p className="text-sm text-zinc-400 mb-3">Configure pagamentos que se repetem todo mês:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-zinc-300 bg-[#0A0F1C] rounded-lg px-4 py-3 border border-white/5">
              <Send className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
              <span>"Aluguel de 1500 todo dia 10 até 31/12/2025"</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-zinc-300 bg-[#0A0F1C] rounded-lg px-4 py-3 border border-white/5">
              <Send className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
              <span>"Salário de 5000 recorrente até dezembro de 2025"</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-zinc-300 bg-[#0A0F1C] rounded-lg px-4 py-3 border border-white/5">
              <Send className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
              <span>"Internet empresa 800 mensal de janeiro a junho"</span>
            </div>
          </div>
        </div>

        {/* Queries and Reports */}
        <div className="bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-transparent border border-yellow-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📈</span>
            Consultas e Relatórios Avançados
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-yellow-400 text-sm">Saldo de Contas:</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#0A0F1C] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <span>"Qual o saldo da conta Nubank?"</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#0A0F1C] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <span>"Saldo de todas as contas"</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-orange-400 text-sm">Fatura de Cartão:</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#0A0F1C] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span>"Qual a fatura do Nubank?"</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#0A0F1C] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span>"Valor da fatura de dezembro"</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-green-400 text-sm">Por Categoria:</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#0A0F1C] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>"Quanto gastei com alimentação este mês?"</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#0A0F1C] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>"Gastos com transporte em novembro"</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-blue-400 text-sm">Projeções Futuras:</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#0A0F1C] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>"Previsão de fluxo de caixa para os próximos 15 dias"</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-[#0A0F1C] rounded px-3 py-2">
                  <Send className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>"Quais parcelas faltam do notebook?"</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Available */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-5 text-center">
          <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-green-400" />
          </div>
          <h4 className="font-semibold text-white mb-2">IA Inteligente</h4>
          <p className="text-xs text-zinc-400">Reconhecimento automático de categorias e valores</p>
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-xl p-5 text-center">
          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-blue-400" />
          </div>
          <h4 className="font-semibold text-white mb-2">Respostas Rápidas</h4>
          <p className="text-xs text-zinc-400">Atendimento instantâneo 24 horas por dia</p>
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-xl p-5 text-center">
          <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-purple-400" />
          </div>
          <h4 className="font-semibold text-white mb-2">Multi-Conta</h4>
          <p className="text-xs text-zinc-400">Suporte para contas Pessoal e PJ separadas</p>
        </div>
      </div>
    </div>
  );
}
