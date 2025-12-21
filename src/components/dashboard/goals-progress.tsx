"use client";

import { Target, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoals } from "@/hooks/use-goals";
import { useTransactionsQuery } from "@/hooks/use-transactions-query";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";
import { useRouter } from "next/navigation";

export function GoalsProgress() {
  const { t } = useLanguage();
  const { getCurrencySymbol } = useCurrency();
  const { goals, loading } = useGoals();
  const { transactions } = useTransactionsQuery('month');
  const router = useRouter();

  // Cores para as metas
  const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Calcular valor gasto/economizado para cada meta
  const getGoalProgress = (goal: any) => {
    if (goal.tipo_meta === 'categoria' && goal.categoria_id) {
      // Somar despesas da categoria
      const spent = transactions
        .filter(t => t.tipo === 'saida' && t.categoria_id === goal.categoria_id)
        .reduce((sum, t) => sum + Number(t.valor), 0);
      return { current: spent, target: Number(goal.valor_limite) };
    } else if (goal.tipo_meta === 'economia') {
      // Calcular economia (receitas - despesas)
      const income = transactions.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + Number(t.valor), 0);
      const expenses = transactions.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + Number(t.valor), 0);
      const saved = income - expenses;
      return { current: saved, target: Number(goal.valor_limite) };
    } else {
      // Meta geral - total de despesas
      const totalExpenses = transactions
        .filter(t => t.tipo === 'saida')
        .reduce((sum, t) => sum + Number(t.valor), 0);
      return { current: totalExpenses, target: Number(goal.valor_limite) };
    }
  };

  // Formatar valor
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `${getCurrencySymbol()} ${(value / 1000).toFixed(1)}K`;
    }
    return `${getCurrencySymbol()} ${value}`;
  };

  if (loading) {
    return (
      <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">{t('dashboard.goals.title')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">{t('dashboard.goals.title')}</h3>
        <button 
          onClick={() => router.push('/dashboard/metas')}
          className="text-sm text-[#22C55E] hover:text-[#16A34A] font-medium transition-colors"
        >
          {t('dashboard.recent.viewAll')}
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {goals.length === 0 ? (
          <div className="col-span-full text-center text-zinc-500 py-8">
            {t('dashboard.goals.empty')}
          </div>
        ) : (
          goals.map((goal, index) => {
            const progress = getGoalProgress(goal);
            const percentage = Math.min((progress.current / progress.target) * 100, 100);
            const color = colors[index % colors.length];
            
            return (
              <div
                key={goal.id}
                className="bg-[#0A0F1C] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Target className="w-6 h-6" style={{ color }} />
                </div>

                {/* Name */}
                <h4 className="text-sm font-semibold mb-3 truncate">{goal.nome}</h4>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>

                {/* Values */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">
                    {formatCurrency(progress.current)} / {formatCurrency(progress.target)}
                  </span>
                  <span className="font-semibold" style={{ color }}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Add Goal Card */}
        <button 
          onClick={() => router.push('/dashboard/metas')}
          className="bg-[#0A0F1C] border border-dashed border-white/10 rounded-xl p-4 hover:border-[#22C55E]/50 hover:bg-[#22C55E]/5 transition-colors flex flex-col items-center justify-center min-h-[180px]"
        >
          <div className="w-12 h-12 rounded-lg bg-[#22C55E]/10 flex items-center justify-center mb-3">
            <Plus className="w-6 h-6 text-[#22C55E]" />
          </div>
          <span className="text-sm font-medium text-zinc-400">{t('dashboard.goals.add')}</span>
        </button>
      </div>
    </div>
  );
}
