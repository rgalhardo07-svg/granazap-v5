"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useScheduledPayments } from "@/hooks/use-scheduled-payments";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";

export function UpcomingPayments() {
  const { t, language } = useLanguage();
  const { formatCurrency: formatCurrencyFromContext } = useCurrency();
  const { payments, loading } = useScheduledPayments();

  const locales = {
    pt: 'pt-BR',
    en: 'en-US',
    es: 'es-ES'
  };

  // Calcular dias até o vencimento
  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    const dueDate = new Date(dateString);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Determinar urgência baseado nos dias
  const getUrgency = (daysUntil: number): "high" | "medium" | "low" => {
    if (daysUntil <= 5) return "high";
    if (daysUntil <= 15) return "medium";
    return "low";
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const daysUntil = getDaysUntil(dateString);
    const formattedDate = date.toLocaleDateString(locales[language], { day: '2-digit', month: 'short' });
    return `${formattedDate} • ${daysUntil} ${t('dashboard.upcoming.days')}`;
  };

  // Formatar valor
  const formatCurrency = formatCurrencyFromContext;

  const urgencyColors = {
    high: "bg-[#EF4444]",
    medium: "bg-[#F59E0B]",
    low: "bg-[#22C55E]",
  };

  if (loading) {
    return (
      <div className="bg-[#111827] border border-white/5 rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold">{t('dashboard.upcoming.title')}</h3>
        </div>
        <div className="space-y-2 md:space-y-3">
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
        <h3 className="text-base md:text-lg font-semibold">{t('dashboard.upcoming.title')}</h3>
        <Link
          href="/dashboard/agendados"
          className="text-xs md:text-sm text-[#22C55E] hover:text-[#16A34A] font-medium transition-colors"
        >
          {t('dashboard.upcoming.manage')}
        </Link>
      </div>

      {/* Payments List */}
      <div className="space-y-2 md:space-y-3">
        {payments.length === 0 ? (
          <p className="text-center text-zinc-500 py-8 text-sm">{t('dashboard.upcoming.empty')}</p>
        ) : (
          payments.map((payment) => {
            const daysUntil = getDaysUntil(payment.data_prevista);
            const urgency = getUrgency(daysUntil);
            
            return (
              <div
                key={payment.id}
                className="flex items-center gap-3 md:gap-4 p-3 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer min-h-[60px]"
              >
                {/* Urgency Indicator */}
                <div className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  urgencyColors[urgency]
                )} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{payment.descricao}</p>
                  <p className="text-[10px] md:text-xs text-zinc-500 mt-1">{formatDate(payment.data_prevista)}</p>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold font-mono text-white">
                    {formatCurrency(Number(payment.valor))}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {payments.length > 0 && (
        <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-zinc-400">{t('dashboard.upcoming.total30days')}</span>
            <span className="text-base md:text-lg font-bold font-mono text-white">
              {formatCurrency(payments.reduce((acc, p) => acc + Number(p.valor), 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
