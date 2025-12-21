"use client";

import { useTransactionsQuery } from "@/hooks/use-transactions-query";
import { useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";
import { usePeriodFilter } from "@/hooks/use-period-filter";

// Custom Tooltip para o gráfico de barras
const CustomTooltip = ({ active, payload, label, formatCurrency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1F2937] border border-white/10 p-3 rounded-lg shadow-xl">
        <p className="text-zinc-300 font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-zinc-400">{entry.name}:</span>
            <span className="text-white font-mono">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ChartsSection() {
  const { t, language } = useLanguage();
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const { period } = usePeriodFilter();
  const { transactions, loading } = useTransactionsQuery(period);

  // Processar dados para o gráfico de fluxo de caixa (últimos 7 dias)
  const cashFlowData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const locales = {
      pt: 'pt-BR',
      en: 'en-US',
      es: 'es-ES'
    };

    return last7Days.map(date => {
      const dayName = date.toLocaleDateString(locales[language], { weekday: 'short' });
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTransactions = transactions.filter(t => t.data === dateStr);
      const income = dayTransactions
        .filter(t => t.tipo === 'entrada')
        .reduce((sum, t) => sum + Number(t.valor), 0);
      const expense = dayTransactions
        .filter(t => t.tipo === 'saida')
        .reduce((sum, t) => sum + Number(t.valor), 0);

      return {
        name: dayName.charAt(0).toUpperCase() + dayName.slice(1, 3),
        [t('dashboard.stats.income')]: income,
        [t('dashboard.stats.expenses')]: expense,
      };
    });
  }, [transactions, language, t]);

  // Processar dados para despesas por categoria
  const expensesByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    transactions
      .filter(transaction => transaction.tipo === 'saida')
      .forEach(transaction => {
        const categoryName = transaction.categoria?.descricao || t('dashboard.recent.noCategory');
        const current = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, current + Number(transaction.valor));
      });

    const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);
    
    // Cores para categorias
    const colors = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    
    return Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categorias
  }, [transactions, t]);

  const totalExpenses = expensesByCategory.reduce((acc, cat) => acc + cat.value, 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111827] border border-white/5 rounded-xl p-6 h-80 animate-pulse" />
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6 h-80 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Cash Flow Chart */}
      <div className="lg:col-span-2 bg-[#111827] border border-white/5 rounded-xl p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6">{t('dashboard.charts.cashFlow')}</h3>
        
        <div className="w-full h-[200px] md:h-[256px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlowData} barGap={4}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717A', fontSize: 11 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717A', fontSize: 11 }} 
                tickFormatter={(value) => `${getCurrencySymbol()}${value}`}
                width={60}
              />
              <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
              <Bar 
                dataKey={t('dashboard.stats.income')}
                name={t('dashboard.stats.income')}
                fill="#22C55E" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={40} 
              />
              <Bar 
                dataKey={t('dashboard.stats.expenses')}
                name={t('dashboard.stats.expenses')}
                fill="#EF4444" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={40} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 md:gap-6 mt-4 md:mt-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
            <span className="text-xs md:text-sm text-zinc-400">{t('dashboard.stats.income')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
            <span className="text-xs md:text-sm text-zinc-400">{t('dashboard.stats.expenses')}</span>
          </div>
        </div>
      </div>

      {/* Expenses by Category */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-4 md:p-6 flex flex-col">
        <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6">{t('dashboard.charts.expensesByCategory')}</h3>
        
        {/* Donut Chart */}
        <div className="flex-1 relative" style={{ minHeight: '200px', height: '200px' }}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={expensesByCategory}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {expensesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#1F2937] border border-white/10 p-2 rounded-lg shadow-xl">
                        <p className="text-white font-medium text-sm">{data.name}</p>
                        <p className="text-zinc-400 text-xs">
                          {formatCurrency(data.value)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg md:text-xl font-bold font-mono">
              {totalExpenses >= 1000 
                ? `${getCurrencySymbol()} ${(totalExpenses / 1000).toFixed(1)}K` 
                : `${getCurrencySymbol()} ${totalExpenses}`}
            </span>
            <span className="text-[10px] md:text-xs text-zinc-500">{t('dashboard.charts.total')}</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="mt-4 md:mt-6 space-y-2 md:space-y-3">
          {expensesByCategory.map((cat, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs md:text-sm text-zinc-400 truncate" title={cat.name}>
                  {cat.name}
                </span>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-xs md:text-sm font-semibold font-mono">
                  {formatCurrency(cat.value)}
                </p>
                <p className="text-[10px] md:text-xs text-zinc-500">{cat.percentage}%</p>
              </div>
            </div>
          ))}
          
          {expensesByCategory.length === 0 && (
            <div className="text-center text-zinc-500 py-4 text-xs md:text-sm">
              {t('dashboard.charts.noExpenses')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
