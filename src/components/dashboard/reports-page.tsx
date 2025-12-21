"use client";

import { useMemo, useState } from "react";
import { useExportPDFNew } from "@/hooks/use-export-pdf-new";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart as PieChartIcon, 
  BarChart3,
  Download,
  Filter,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  LineChart as LineChartIcon,
  Receipt,
  CalendarClock,
  ArrowRightCircle
} from "lucide-react";
import { format, isAfter, isBefore, isSameDay, startOfDay, endOfDay } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";
import { useTransactionsQuery } from "@/hooks/use-transactions-query";
import { useFutureTransactionsQuery } from "@/hooks/use-future-transactions-query";
import { useAccounts } from "@/hooks/use-accounts";
import { usePeriodFilter } from "@/hooks/use-period-filter";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { cn } from "@/lib/utils";

const COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export function ReportsPage() {
  const { t, language } = useLanguage();
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const { period, customRange, setCustomDateRange, changePeriod } = usePeriodFilter();
  const { transactions, loading, stats } = useTransactionsQuery(period as any, customRange);
  const { filter: accountFilter } = useAccountFilter();
  
  // Hooks para previsão financeira
  const { transactions: futureTransactions, loading: loadingFuture } = useFutureTransactionsQuery();
  const { accounts } = useAccounts(accountFilter);

  const [showFilters, setShowFilters] = useState(false);
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const { exportReportToPDF } = useExportPDFNew();

  const handleApplyFilters = () => {
    if (startDateInput && endDateInput) {
      setCustomDateRange({ start: startDateInput, end: endDateInput });
      setShowFilters(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const periodLabel = period === 'custom' && customRange
        ? `${format(new Date(customRange.start), 'dd-MM-yyyy')}_${format(new Date(customRange.end), 'dd-MM-yyyy')}`
        : period === 'month'
        ? format(new Date(), 'MM-yyyy')
        : period === 'year'
        ? format(new Date(), 'yyyy')
        : format(new Date(), 'dd-MM-yyyy');
      
      const accountType = accountFilter === 'pessoal' ? 'Pessoal' : 'PJ';
      const filename = `Relatorio_${accountType}_${periodLabel}.pdf`;
      
      // Preparar dados para o novo hook
      const reportData = {
        stats,
        forecastData,
        incomeCategories,
        expenseCategories,
        topExpenses,
        evolutionData,
        period,
        customRange: customRange || undefined,
        accountFilter,
        formatCurrency
      };
      
      await exportReportToPDF(reportData, filename);
    } catch (error) {
    } finally {
      setIsExporting(false);
    }
  };

  // Calcular intervalo de datas selecionado (para filtrar lançamentos futuros)
  const dateRange = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    
    if (period === 'custom' && customRange) {
      start = new Date(customRange.start);
      end = new Date(customRange.end);
    } else {
      switch (period) {
        case 'day':
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case 'week':
          start.setDate(now.getDate() - 7);
          start.setHours(0, 0, 0, 0);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
      }
    }
    return { start, end };
  }, [period, customRange]);

  // Filtrar e calcular dados de previsão
  const forecastData = useMemo(() => {
    const startStr = dateRange.start.toISOString().split('T')[0];
    const endStr = dateRange.end.toISOString().split('T')[0];

    const filtered = futureTransactions.filter(t => {
      const tDate = t.data_prevista.split('T')[0];
      return tDate >= startStr && tDate <= endStr && t.status === 'pendente';
    });

    const pendingIncome = filtered
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + Number(t.valor), 0);

    const pendingExpense = filtered
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + Number(t.valor), 0);

    const currentBalance = accounts.reduce((sum, acc) => sum + acc.saldo_atual, 0);
    
    // Saldo Previsto = Saldo Atual + (Receitas Pendentes - Despesas Pendentes)
    // Nota: O saldo atual já considera transações realizadas. 
    // Se o filtro for passado, receitas pendentes serão 0 (ou deveriam ser).
    // Se for futuro, adicionamos o que falta acontecer.
    const projectedBalance = currentBalance + pendingIncome - pendingExpense;

    return {
      pendingIncome,
      pendingExpense,
      projectedBalance,
      currentBalance,
      incomes: filtered.filter(t => t.tipo === 'entrada'),
      expenses: filtered.filter(t => t.tipo === 'saida')
    };
  }, [futureTransactions, dateRange, accounts]);

  // Agrupar dados por mês/dia para o gráfico de evolução
  const evolutionData = useMemo(() => {
    const grouped = new Map();
    
    // Ordenar transações por data (antiga para nova)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    sortedTransactions.forEach(t => {
      // Se o período for 'day' ou 'week', agrupar por dia. Senão, por mês.
      const date = new Date(t.data);
      let key = "";
      let label = "";

      if (period === 'day' || period === 'week') {
         key = t.data.split('T')[0];
         label = format(date, 'dd/MM', { locale: ptBR });
      } else if (period === 'year') {
         key = format(date, 'yyyy-MM');
         label = format(date, 'MMM', { locale: ptBR });
      } else {
         key = t.data.split('T')[0];
         label = format(date, 'dd/MM', { locale: ptBR });
      }

      if (!grouped.has(key)) {
        grouped.set(key, { name: label, fullDate: key, Receitas: 0, Despesas: 0, Saldo: 0 });
      }
      
      const item = grouped.get(key);
      if (t.tipo === 'entrada') {
        item.Receitas += Number(t.valor);
      } else {
        item.Despesas += Number(t.valor);
      }
      item.Saldo = item.Receitas - item.Despesas;
    });

    return Array.from(grouped.values());
  }, [transactions, period]);

  // Dados acumulados para o gráfico de linha (Fluxo de Caixa)
  const cumulativeData = useMemo(() => {
    let accumulated = 0;
    return evolutionData.map(item => {
      accumulated += item.Saldo;
      return {
        ...item,
        Acumulado: accumulated
      };
    });
  }, [evolutionData]);

  // Top 5 maiores despesas
  const topExpenses = useMemo(() => {
    return transactions
      .filter(t => t.tipo === 'saida')
      .sort((a, b) => Number(b.valor) - Number(a.valor))
      .slice(0, 5);
  }, [transactions]);

  // Agrupar dados por categoria
  const getCategoryData = (type: 'entrada' | 'saida') => {
    const categoryMap = new Map();
    
    transactions
      .filter(t => t.tipo === type)
      .forEach(t => {
        const name = t.categoria?.descricao || 'Outros';
        const current = categoryMap.get(name) || 0;
        categoryMap.set(name, current + Number(t.valor));
      });

    return Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  };

  const incomeCategories = useMemo(() => getCategoryData('entrada'), [transactions]);
  const expenseCategories = useMemo(() => getCategoryData('saida'), [transactions]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{t('reports.title')}</h1>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1",
              accountFilter === 'pessoal' 
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
            )}>
              {accountFilter === 'pessoal' ? '👤 Pessoal' : '🏢 PJ'}
            </span>
          </div>
          <p className="text-zinc-400 text-sm mt-1">
            {t('reports.description')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting || loading}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
              "bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D]",
              "text-white shadow-lg shadow-[#22C55E]/20",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
              "min-w-[140px]"
            )}
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm">Exportando...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="text-sm">Exportar PDF</span>
              </>
            )}
          </button>

          {/* Filters */}
          <div className="flex items-center gap-2 bg-[#111827] p-1 rounded-lg border border-white/10">
            {(['month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => changePeriod(p)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  period === p
                    ? "bg-white/10 text-white" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                {p === 'month' ? t('reports.month') : t('reports.year')}
              </button>
            ))}
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                period === 'custom'
                  ? "bg-[#22C55E]/20 text-[#22C55E]" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Calendar className="w-4 h-4" />
              <span>{t('reports.periodLabel')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Picker Panel */}
      {showFilters && (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium text-zinc-400">{t('reports.startDate')}</label>
              <input
                type="date"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
                className="w-full h-10 px-4 rounded-lg bg-[#0A0F1C] border border-white/10 text-white focus:outline-none focus:border-[#22C55E] [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium text-zinc-400">{t('reports.endDate')}</label>
              <input
                type="date"
                value={endDateInput}
                onChange={(e) => setEndDateInput(e.target.value)}
                className="w-full h-10 px-4 rounded-lg bg-[#0A0F1C] border border-white/10 text-white focus:outline-none focus:border-[#22C55E] [color-scheme:dark]"
              />
            </div>
            <button
              onClick={handleApplyFilters}
              disabled={!startDateInput || !endDateInput}
              className="px-6 h-10 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('reports.apply')}
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-16 h-16 md:w-24 md:h-24 text-[#22C55E]" />
          </div>
          <div className="relative z-10">
            <div className="text-xs md:text-sm text-zinc-400 mb-2 flex items-center gap-2">
              <div className="p-1.5 bg-[#22C55E]/10 rounded-lg">
                <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 text-[#22C55E]" />
              </div>
              {t('reports.totalIncome')}
            </div>
            <p className="text-2xl md:text-3xl font-bold font-mono text-white">
              {formatCurrency(stats.income)}
            </p>
            <p className="text-[10px] md:text-xs text-zinc-500 mt-1">
              {stats.incomeCount} {t('reports.transactionsRegistered')}
            </p>
          </div>
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-xl p-4 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingDown className="w-16 h-16 md:w-24 md:h-24 text-[#EF4444]" />
          </div>
          <div className="relative z-10">
            <div className="text-xs md:text-sm text-zinc-400 mb-2 flex items-center gap-2">
              <div className="p-1.5 bg-[#EF4444]/10 rounded-lg">
                <ArrowDownRight className="w-3 h-3 md:w-4 md:h-4 text-[#EF4444]" />
              </div>
              {t('reports.totalExpenses')}
            </div>
            <p className="text-2xl md:text-3xl font-bold font-mono text-white">
              {formatCurrency(stats.expenses)}
            </p>
            <p className="text-[10px] md:text-xs text-zinc-500 mt-1">
              {stats.expensesCount} {t('reports.transactionsRegistered')}
            </p>
          </div>
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-xl p-4 md:p-6 relative overflow-hidden sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="w-16 h-16 md:w-24 md:h-24 text-blue-500" />
          </div>
          <div className="relative z-10">
            <div className="text-xs md:text-sm text-zinc-400 mb-2 flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <Wallet className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
              </div>
              {t('reports.periodBalance')}
            </div>
            <p className={cn(
              "text-2xl md:text-3xl font-bold font-mono",
              stats.balance >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"
            )}>
              {formatCurrency(stats.balance)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] md:text-xs text-zinc-500">
                {t('reports.savings')}:
              </span>
              <span className={cn(
                "text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full",
                stats.savingsRate >= 0 ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[#EF4444]/10 text-[#EF4444]"
              )}>
                {stats.savingsRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Evolution Chart */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-zinc-400" />
            {t('reports.incomeVsExpenses')}
          </h3>
          <div className="w-full" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={evolutionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717A', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717A', fontSize: 12 }}
                  tickFormatter={(val) => `${getCurrencySymbol()}${val/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number, name: string) => {
                    const translatedName = name === 'Receitas' ? t('reports.income') : t('reports.expenses');
                    return [formatCurrency(value), translatedName];
                  }}
                />
                <Legend 
                  formatter={(value: string) => value === 'Receitas' ? t('reports.income') : t('reports.expenses')}
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <Bar dataKey="Receitas" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cumulative Flow Chart */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-zinc-400" />
            {t('reports.cumulativeCashFlow')}
          </h3>
          <div className="w-full" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={cumulativeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717A', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717A', fontSize: 12 }}
                  tickFormatter={(val) => `${getCurrencySymbol()}${val/1000}k`}
                />
                <Tooltip 
                  cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area 
                  type="monotone" 
                  dataKey="Acumulado" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorAcumulado)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Forecast Section */}
      <div className="pt-8 border-t border-white/10">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <CalendarClock className="w-6 h-6 text-blue-500" />
          {t('reports.forecast')} ({t('reports.noPending').replace('Nenhum lançamento pendente', 'Pendentes')})
        </h2>
        
        {/* Forecast Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
           {/* Total a Receber */}
           <div className="bg-[#111827] border border-white/5 rounded-xl p-6 relative overflow-hidden">
             <div className="relative z-10">
                <div className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                  <div className="p-1.5 bg-[#22C55E]/10 rounded-lg">
                    <ArrowUpRight className="w-4 h-4 text-[#22C55E]" />
                  </div>
                  {t('reports.toReceive')}
                </div>
                <p className="text-3xl font-bold font-mono text-[#22C55E]">
                  {formatCurrency(forecastData.pendingIncome)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {format(dateRange.start, 'dd/MM/yyyy')} - {format(dateRange.end, 'dd/MM/yyyy')}
                </p>
             </div>
           </div>

           {/* Total a Pagar */}
           <div className="bg-[#111827] border border-white/5 rounded-xl p-6 relative overflow-hidden">
             <div className="relative z-10">
                <div className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                  <div className="p-1.5 bg-[#EF4444]/10 rounded-lg">
                    <ArrowDownRight className="w-4 h-4 text-[#EF4444]" />
                  </div>
                  {t('reports.toPay')}
                </div>
                <p className="text-3xl font-bold font-mono text-[#EF4444]">
                  {formatCurrency(forecastData.pendingExpense)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {format(dateRange.start, 'dd/MM/yyyy')} - {format(dateRange.end, 'dd/MM/yyyy')}
                </p>
             </div>
           </div>

           {/* Saldo Previsto */}
           <div className="bg-[#111827] border border-white/5 rounded-xl p-6 relative overflow-hidden">
             <div className="relative z-10">
                <div className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <Wallet className="w-4 h-4 text-blue-500" />
                  </div>
                  {t('reports.projectedBalance')}
                </div>
                <p className={cn(
                  "text-3xl font-bold font-mono",
                  forecastData.projectedBalance >= 0 ? "text-blue-500" : "text-[#EF4444]"
                )}>
                  {formatCurrency(forecastData.projectedBalance)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {t('reports.projectedFormula')}
                </p>
             </div>
           </div>
        </div>

        {/* Forecast Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receitas Pendentes */}
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6 flex flex-col h-[400px]">
             <div className="flex justify-between items-center mb-4">
               <div>
                 <h3 className="text-lg font-semibold text-white">{t('reports.pendingIncomeTitle')}</h3>
                 <p className="text-sm text-zinc-400">{t('reports.toReceiveLabel')}</p>
               </div>
               <span className="px-2 py-1 bg-[#22C55E]/10 text-[#22C55E] text-xs rounded border border-[#22C55E]/20">
                 {t('reports.incomeLabel')}
               </span>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
               {forecastData.incomes.map((item) => (
                 <div key={item.id} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 flex justify-between items-center">
                   <div className="flex flex-col gap-1">
                     <span className="text-sm font-medium text-white line-clamp-1">{item.descricao}</span>
                     <div className="flex items-center gap-2 text-xs text-zinc-500">
                       <span>{format(new Date(item.data_prevista), "dd/MM/yyyy", { locale: ptBR })}</span>
                       <span className="px-1.5 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
                         {item.categoria?.descricao || 'Outros'}
                       </span>
                     </div>
                   </div>
                   <span className="text-sm font-bold text-[#22C55E] whitespace-nowrap">
                     {formatCurrency(item.valor)}
                   </span>
                 </div>
               ))}
               
               {forecastData.incomes.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
                    <Receipt className="w-8 h-8 opacity-50" />
                    <p className="text-sm">{t('reports.noPendingIncome')}</p>
                  </div>
               )}
             </div>
          </div>

          {/* Despesas Pendentes */}
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6 flex flex-col h-[400px]">
             <div className="flex justify-between items-center mb-4">
               <div>
                 <h3 className="text-lg font-semibold text-white">{t('reports.pendingExpensesTitle')}</h3>
                 <p className="text-sm text-zinc-400">{t('reports.toPayLabel')}</p>
               </div>
               <span className="px-2 py-1 bg-[#EF4444]/10 text-[#EF4444] text-xs rounded border border-[#EF4444]/20">
                 {t('reports.expenseLabel')}
               </span>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
               {forecastData.expenses.map((item) => (
                 <div key={item.id} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 flex justify-between items-center">
                   <div className="flex flex-col gap-1">
                     <span className="text-sm font-medium text-white line-clamp-1">{item.descricao}</span>
                     <div className="flex items-center gap-2 text-xs text-zinc-500">
                       <span>{format(new Date(item.data_prevista), "dd/MM/yyyy", { locale: ptBR })}</span>
                       <span className="px-1.5 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20">
                         {item.categoria?.descricao || 'Outros'}
                       </span>
                     </div>
                   </div>
                   <span className="text-sm font-bold text-[#EF4444] whitespace-nowrap">
                     {formatCurrency(item.valor)}
                   </span>
                 </div>
               ))}

               {forecastData.expenses.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
                    <Receipt className="w-8 h-8 opacity-50" />
                    <p className="text-sm">{t('reports.noPendingExpense')}</p>
                  </div>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Category Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income Categories */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-zinc-400" />
            {t('reports.incomeOrigin')}
          </h3>
          
          <div className="w-full relative" style={{ height: '256px' }}>
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Pie
                  data={incomeCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {incomeCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-zinc-400 font-bold text-xl">{stats.income > 0 ? '100%' : '0%'}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-60 custom-scrollbar pr-2">
            {incomeCategories.map((cat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-zinc-400">{cat.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{formatCurrency(cat.value)}</p>
                  <p className="text-xs text-zinc-500">
                    {stats.income > 0 ? ((cat.value / stats.income) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            ))}
            {incomeCategories.length === 0 && (
              <p className="text-center text-zinc-500 py-4 text-sm">{t('reports.noIncomeData')}</p>
            )}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-zinc-400" />
            {t('reports.expenseDestination')}
          </h3>
          
          <div className="w-full relative" style={{ height: '256px' }}>
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-[#EF4444] font-bold text-xl">{stats.expenses > 0 ? '100%' : '0%'}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-60 custom-scrollbar pr-2">
            {expenseCategories.map((cat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-zinc-400">{cat.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{formatCurrency(cat.value)}</p>
                  <p className="text-xs text-zinc-500">
                    {stats.expenses > 0 ? ((cat.value / stats.expenses) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            ))}
            {expenseCategories.length === 0 && (
              <p className="text-center text-zinc-500 py-4 text-sm">{t('reports.noExpenseData')}</p>
            )}
          </div>
        </div>

        {/* Top Expenses List */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#EF4444]" />
            {t('reports.topExpenses')}
          </h3>
          
          <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar space-y-3 pr-2">
            {topExpenses.map((expense) => (
              <div key={expense.id} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-white line-clamp-1">
                    {expense.descricao}
                  </span>
                  <span className="text-sm font-bold text-[#EF4444] whitespace-nowrap">
                    {formatCurrency(expense.valor)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-500">
                  <span>{format(new Date(expense.data), "dd/MM/yyyy", { locale: ptBR })}</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20">
                    {expense.categoria?.descricao || 'Outros'}
                  </span>
                </div>
              </div>
            ))}
            
            {topExpenses.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
                <Receipt className="w-8 h-8 opacity-50" />
                <p className="text-sm">{t('reports.noExpensesInPeriod')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
