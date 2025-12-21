"use client";

import { useRouter } from "next/navigation";
import { Check, Zap, Crown, Calendar, CalendarDays } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { format, addYears, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLanguage } from "@/contexts/language-context";

export function SubscriptionCard() {
  const { t } = useLanguage();
  const { profile } = useUser();
  const router = useRouter();
  const isPro = profile?.plano === 'pro' || profile?.plano === 'vitalicio';
  
  // Calcular datas
  const startDate = profile?.created_at ? parseISO(profile.created_at) : new Date();
  
  // Tentar encontrar a data de renovação em várias colunas possíveis
  const rawDate = profile?.data_final_plano || // Nome correto vindo do log
                 profile?.data_fim_plano || 
                 profile?.data_validade || 
                 profile?.validade || 
                 profile?.expira_em || 
                 profile?.data_renovacao;

  const renewalDate = rawDate ? parseISO(rawDate) : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white">{t('settings.yourPlan')}</h3>
        <p className="text-sm text-zinc-400">{t('settings.manageSubscription')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cartão do Plano Atual */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Crown className="w-24 h-24 rotate-12" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isPro ? "bg-purple-500/10 text-purple-400" : "bg-[#22C55E]/10 text-[#22C55E]"
              )}>
                {isPro ? <Crown className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm text-zinc-400">{t('settings.currentPlan')}</p>
                <h4 className="text-xl font-bold text-white capitalize">
                  {profile?.plano || 'Gratuito'}
                </h4>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-[#22C55E]" />
                <span>Lançamentos ilimitados</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-[#22C55E]" />
                <span>Gestão de contas PJ e PF</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-[#22C55E]" />
                <span>Relatórios avançados</span>
              </div>
              {isPro && (
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-purple-400" />
                  <span>Suporte prioritário</span>
                </div>
              )}
            </div>

            {!isPro && (
              <button 
                onClick={() => router.push('/planos')}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Fazer Upgrade para PRO
              </button>
            )}
          </div>
        </div>

        {/* Detalhes da Assinatura */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6 flex flex-col justify-center">
          <h4 className="font-medium text-white mb-6">{t('settings.subscriptionDetails')}</h4>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/5 rounded-lg">
                <Calendar className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">{t('settings.memberSince')}</p>
                <p className="text-white font-medium mt-0.5">
                  {format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/5 rounded-lg">
                <CalendarDays className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">{t('settings.nextRenewal')}</p>
                <p className="text-white font-medium mt-0.5">
                  {renewalDate 
                    ? format(renewalDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : profile?.plano === 'vitalicio' ? t('settings.lifetime') : "Indeterminado"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
