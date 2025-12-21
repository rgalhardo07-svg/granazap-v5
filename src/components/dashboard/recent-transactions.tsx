"use client";

import Link from "next/link";
import { ShoppingCart, Briefcase, Home, Car, Coffee, DollarSign } from "lucide-react";
import { useTransactionsQuery } from "@/hooks/use-transactions-query";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";
import { cn } from "@/lib/utils";

export function RecentTransactions() {
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { transactions, loading } = useTransactionsQuery('month');

  // Pegar apenas as 5 mais recentes
  const recentTransactions = transactions.slice(0, 5);

  const locales = {
    pt: 'pt-BR',
    en: 'en-US',
    es: 'es-ES'
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locales[language], { day: '2-digit', month: 'short' });
  };

  // Ícone padrão baseado no tipo
  const getIcon = (tipo: string) => {
    return tipo === 'entrada' ? Briefcase : ShoppingCart;
  };

  if (loading) {
    return (
      <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">{t('dashboard.recent.title')}</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold">{t('dashboard.recent.title')}</h3>
        <Link
          href="/dashboard/transacoes"
          className="text-xs md:text-sm text-[#22C55E] hover:text-[#16A34A] font-medium transition-colors"
        >
          {t('dashboard.recent.viewAll')}
        </Link>
      </div>

      {/* Transactions List */}
      <div className="space-y-2 md:space-y-3">
        {recentTransactions.length === 0 ? (
          <p className="text-center text-zinc-500 py-8 text-sm">{t('dashboard.recent.empty')}</p>
        ) : (
          recentTransactions.map((transaction) => {
            const Icon = getIcon(transaction.tipo);
            return (
              <div
                key={transaction.id}
                className="flex items-center gap-3 md:gap-4 p-3 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer min-h-[60px]"
              >
                {/* Icon */}
                <div className={cn(
                  "p-2 rounded-lg flex-shrink-0",
                  transaction.tipo === "entrada" ? "bg-[#22C55E]/10" : "bg-white/5"
                )}>
                  <Icon className={cn(
                    "w-5 h-5",
                    transaction.tipo === "entrada" ? "text-[#22C55E]" : "text-zinc-400"
                  )} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-sm font-medium truncate">{transaction.descricao}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] md:text-xs font-medium bg-white/5 text-zinc-400 truncate max-w-[120px]">
                      {transaction.categoria?.descricao || t('dashboard.recent.noCategory')}
                    </span>
                    <span className="text-[10px] md:text-xs text-zinc-500 whitespace-nowrap">{formatDate(transaction.data)}</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p className={cn(
                    "text-sm md:text-sm font-semibold font-mono",
                    transaction.tipo === "entrada" ? "text-[#22C55E]" : "text-[#EF4444]"
                  )}>
                    {transaction.tipo === "entrada" ? "+" : "-"}{formatCurrency(Number(transaction.valor))}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
