"use client";

import { useState } from "react";
import { Bell, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { usePeriodFilter, type PeriodFilter } from "@/hooks/use-period-filter";
import { useLanguage } from "@/contexts/language-context";
import { TransactionModal } from "@/components/dashboard/transaction-modal";
import { UserFilter } from "@/components/dashboard/user-filter";

export function DashboardHeader() {
  const { period, changePeriod } = usePeriodFilter();
  const { profile } = useUser();
  const { t, language } = useLanguage();
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'receita' | 'despesa'>('despesa');

  const locales = {
    pt: 'pt-BR',
    en: 'en-US',
    es: 'es-ES'
  };

  // Pegar primeiro nome do usuário
  const userName = profile?.nome ? profile.nome.split(' ')[0] : "Usuário";
  const currentMonth = new Date().toLocaleDateString(locales[language], { month: 'long', year: 'numeric' });

  return (
    <header className="border-b border-white/5 bg-[#111827] px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Greeting */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {t('header.hello')}, {userName}! 👋
          </h1>
          <p className="text-sm text-zinc-400 mt-1 capitalize">{currentMonth}</p>
        </div>

        {/* Center: Filters */}
        <div className="flex items-center gap-3">
          {/* User Filter */}
          <UserFilter />
          
          {/* Period Selector */}
          <div className="flex gap-2 p-1 bg-[#0A0F1C] rounded-lg">
            {(["day", "week", "month", "year"] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => changePeriod(p)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize",
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {p === "day" && t('header.period.day')}
                {p === "week" && t('header.period.week')}
                {p === "month" && t('header.period.month')}
                {p === "year" && t('header.period.year')}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full" />
          </button>

          {/* New Transaction */}
          <div className="relative">
            <Button 
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('header.new')}
            </Button>

            {/* Quick Menu Dropdown */}
            {showQuickMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowQuickMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-[#1F2937] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setTransactionType('despesa');
                      setTransactionModalOpen(true);
                      setShowQuickMenu(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{t('modal.newExpense')}</div>
                      <div className="text-xs text-zinc-400">{t('header.quickAddExpense')}</div>
                    </div>
                  </button>
                  
                  <div className="h-px bg-white/5" />
                  
                  <button
                    onClick={() => {
                      setTransactionType('receita');
                      setTransactionModalOpen(true);
                      setShowQuickMenu(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{t('modal.newIncome')}</div>
                      <div className="text-xs text-zinc-400">{t('header.quickAddIncome')}</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        type={transactionType}
        onSuccess={() => {
          setTransactionModalOpen(false);
          // Disparar evento para atualizar dados
          window.dispatchEvent(new CustomEvent('transactionsChanged'));
        }}
      />
    </header>
  );
}
