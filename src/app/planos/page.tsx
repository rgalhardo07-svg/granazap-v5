"use client";

import { usePlans } from "@/hooks/use-plans";
import { Check, Shield, Star, Zap, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useBranding } from "@/contexts/branding-context";

export default function PlansPage() {
  const { plans, loading } = usePlans();
  const { settings } = useBranding();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0F1C]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 text-sm">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0A0F1C] to-[#0A0F1C] flex flex-col relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10 flex-1 flex flex-col justify-center">
        
        {/* Header */}
        <div className="text-center space-y-6 max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
            <Crown className="w-4 h-4" />
            <span>Assinatura Premium</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Escolha o plano ideal para <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">sua liberdade financeira</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Desbloqueie todo o potencial do {settings.appName}. Gerencie suas finanças sem limites, compartilhe com sua família e tenha insights poderosos.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {plans.map((plan, index) => {
            if (!plan.ativo) return null;
            const recursos = typeof plan.recursos === 'string' 
              ? JSON.parse(plan.recursos) 
              : plan.recursos || [];

            const isPopular = plan.destaque;

            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={plan.id}
                className={`
                  relative rounded-2xl p-8 border transition-all duration-300 group
                  ${isPopular 
                    ? 'bg-[#111827] border-blue-500/50 shadow-2xl shadow-blue-900/20 scale-100 md:scale-105 z-10' 
                    : 'bg-[#111827]/50 border-white/5 hover:border-white/10 hover:bg-[#111827]'}
                `}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                    <Star className="w-3 h-3 fill-current" />
                    Mais Escolhido
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-2">{plan.nome}</h3>
                  <p className="text-sm text-zinc-400 h-10">{plan.descricao}</p>
                  
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-sm text-zinc-400 font-medium">R$</span>
                    <span className="text-4xl font-bold text-white tracking-tight">
                      {Number(plan.valor).toFixed(2).replace('.', ',').split(',')[0]}
                    </span>
                    <span className="text-xl font-bold text-zinc-400">
                      ,{Number(plan.valor).toFixed(2).split('.')[1]}
                    </span>
                    <span className="text-sm text-zinc-500 ml-1">
                      /{plan.tipo_periodo === 'mensal' ? 'mês' : 
                        plan.tipo_periodo === 'trimestral' ? 'trimestre' : 
                        plan.tipo_periodo === 'anual' ? 'ano' : 'período'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {recursos.map((recurso: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-full p-1 ${isPopular ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-zinc-400'}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-sm text-zinc-300">{recurso}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className={`
                    w-full h-12 text-base font-medium rounded-xl transition-all duration-300
                    ${isPopular 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40' 
                      : 'bg-white text-zinc-900 hover:bg-zinc-200'}
                  `}
                  onClick={() => window.location.href = plan.link_checkout || '#'}
                >
                  {isPopular ? 'Quero este plano' : 'Assinar agora'}
                  <ArrowRight className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>

                {plan.tipo_periodo === 'anual' && (
                   <p className="text-xs text-center text-green-400 mt-4 font-medium">
                     Economize 20% em comparação ao mensal
                   </p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-20 text-center border-t border-white/5 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Pagamento seguro
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Acesso imediato
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Garantia de 7 dias
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
