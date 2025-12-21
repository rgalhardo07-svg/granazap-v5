"use client";

import { useEffect, useState } from "react";
import { Lock, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";

export function SubscriptionLockModal() {
  const { t } = useLanguage();
  const [isLocked, setIsLocked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar cookie de status injetado pelo middleware
    const checkStatus = () => {
      const cookies = document.cookie.split(';');
      const statusCookie = cookies.find(c => c.trim().startsWith('subscription_status='));
      
      if (statusCookie && statusCookie.includes('expired')) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    };

    checkStatus();
    
    // Opcional: Intervalo para checar se o cookie mudou (ex: login em outra aba)
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl relative overflow-hidden text-center animate-in fade-in zoom-in duration-300">
        
        {/* Glow Effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <Lock className="w-8 h-8 text-red-500" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Acesso Expirado</h2>
          <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
            Sua assinatura do plano chegou ao fim. Para continuar gerenciando suas finanças e acessando seus dados, renove seu plano agora mesmo.
          </p>

          <div className="w-full space-y-3">
            <Button 
              onClick={() => router.push('/planos')}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              <Crown className="w-4 h-4 mr-2" />
              Ver Planos Disponíveis
              <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
            </Button>
            
            <p className="text-xs text-zinc-500 mt-4">
              {t('success.dataSafe')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
