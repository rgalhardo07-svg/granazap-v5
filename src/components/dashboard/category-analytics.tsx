"use client";

import { useMemo } from "react";
import { useTransactionsQuery } from "@/hooks/use-transactions-query";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";
import { usePeriodFilter } from "@/hooks/use-period-filter";
import { TrendingUp, TrendingDown } from "lucide-react";

export function CategoryAnalytics() {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { period } = usePeriodFilter();
  const { transactions, loading } = useTransactionsQuery(period);

  const categoryData = useMemo(() => {
    const expenseMap = new Map<string, number>();
    const incomeMap = new Map<string, number>();

    transactions.forEach(transaction => {
      const categoryName = transaction.categoria?.descricao || 'Sem Categoria';
      const value = Number(transaction.valor);

      if (transaction.tipo === 'saida') {
        const current = expenseMap.get(categoryName) || 0;
        expenseMap.set(categoryName, current + value);
      } else {
        const current = incomeMap.get(categoryName) || 0;
        incomeMap.set(categoryName, current + value);
      }
    });

    const expenseTotal = Array.from(expenseMap.values()).reduce((sum, val) => sum + val, 0);
    const incomeTotal = Array.from(incomeMap.values()).reduce((sum, val) => sum + val, 0);

    const expenses = Array.from(expenseMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: expenseTotal > 0 ? ((value / expenseTotal) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.value - a.value);

    const incomes = Array.from(incomeMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: incomeTotal > 0 ? ((value / incomeTotal) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.value - a.value);

    return { expenses, incomes, expenseTotal, incomeTotal };
  }, [transactions]);

  if (loading) {
    return (
      <div className="bg-[#111827] border border-white/5 rounded-xl p-6 animate-pulse">
        <div className="h-80" />
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-6">{t('dashboard.categoryAnalysis.title')}</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Despesas por Categoria */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h4 className="text-sm font-semibold text-red-400">{t('dashboard.categoryAnalysis.expenses')}</h4>
            <span className="ml-auto text-sm font-mono text-zinc-400">
              {formatCurrency(categoryData.expenseTotal)}
            </span>
          </div>

          <div className="space-y-3">
            {categoryData.expenses.length === 0 ? (
              <p className="text-center text-zinc-500 py-4 text-sm">
                {t('dashboard.categoryAnalysis.noExpenses')}
              </p>
            ) : (
              categoryData.expenses.map((cat, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">{cat.name}</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold font-mono text-white">
                        {formatCurrency(cat.value)}
                      </p>
                      <p className="text-xs text-zinc-500">{cat.percentage}%</p>
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Receitas por Categoria */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h4 className="text-sm font-semibold text-green-400">{t('dashboard.categoryAnalysis.income')}</h4>
            <span className="ml-auto text-sm font-mono text-zinc-400">
              {formatCurrency(categoryData.incomeTotal)}
            </span>
          </div>

          <div className="space-y-3">
            {categoryData.incomes.length === 0 ? (
              <p className="text-center text-zinc-500 py-4 text-sm">
                {t('dashboard.categoryAnalysis.noIncome')}
              </p>
            ) : (
              categoryData.incomes.map((cat, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">{cat.name}</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold font-mono text-white">
                        {formatCurrency(cat.value)}
                      </p>
                      <p className="text-xs text-zinc-500">{cat.percentage}%</p>
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
