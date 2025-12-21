"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { Plus, Search, Filter, Download, Pencil, Trash2, Loader2, Calendar } from "lucide-react";
import { useTransactionsQuery } from "@/hooks/use-transactions-query";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { usePeriodFilter } from "@/hooks/use-period-filter";
import { cn } from "@/lib/utils";
import { TableSkeleton, CardSkeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import dynamic from 'next/dynamic';
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";
import { InfoCard } from "@/components/ui/info-card";

// Dynamic imports
const TransactionModal = dynamic(() => import("./transaction-modal").then(mod => mod.TransactionModal));
const DeleteTransactionModal = dynamic(() => import("./delete-transaction-modal").then(mod => mod.DeleteTransactionModal));

interface TransactionPageProps {
  type: 'receita' | 'despesa';
  title: string;
}

export function TransactionPage({ type, title }: TransactionPageProps) {
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { period, customRange, setCustomDateRange } = usePeriodFilter();
  const { transactions, loading, refetch } = useTransactionsQuery(period as any, customRange);
  const { filter: accountFilter } = useAccountFilter();

  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm); // Otimização de busca

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const locales = {
    pt: 'pt-BR',
    en: 'en-US',
    es: 'es-ES'
  };

  // Title and Description derived from type for translation
  const pageTitle = type === 'receita' ? t('transactions.income') : t('transactions.expenses');
  const pageDesc = type === 'receita' ? t('transactions.manageIncome') : t('transactions.manageExpenses');
  const newButtonText = type === 'receita' ? t('transactions.newIncome') : t('transactions.newExpense');

  const accentColor = type === 'receita' ? 'bg-primary hover:bg-primary/90' : 'bg-red-500 hover:bg-red-600';
  const badgeColor = type === 'receita'
    ? 'bg-primary/10 text-primary'
    : 'bg-red-500/10 text-red-500';

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = type === 'receita' ? t.tipo === 'entrada' : t.tipo === 'saida';
      const searchLower = deferredSearchTerm.toLowerCase();
      const matchesSearch = t.descricao.toLowerCase().includes(searchLower) ||
        t.categoria?.descricao.toLowerCase().includes(searchLower);
      return matchesType && matchesSearch;
    });
  }, [transactions, type, deferredSearchTerm]);

  const totalValue = useMemo(() =>
    filteredTransactions.reduce((acc, t) => acc + Number(t.valor), 0),
    [filteredTransactions]
  );

  // Paginação
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handleEdit = (transaction: any) => {
    setTransactionToEdit(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (transaction: any) => {
    setTransactionToDelete(transaction);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;

    try {
      setDeletingId(transactionToDelete.id);
      const supabase = createClient();
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', transactionToDelete.id);

      if (error) throw error;

      refetch();
      setIsDeleteModalOpen(false);
      setTransactionToDelete(null);
    } catch (error) {
      alert(t('validation.errorDeleting'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSuccess = () => {
    refetch(); // Atualiza via React Query
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTransactionToEdit(null);
  };

  const handleApplyFilters = () => {
    if (startDate && endDate) {
      setCustomDateRange({ start: startDate, end: endDate });
      setShowFilters(false);
    }
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setShowFilters(false);
    // Voltar para o período padrão (mês)
    window.dispatchEvent(new CustomEvent('periodFilterChange', { detail: 'month' }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-zinc-800/50 rounded animate-pulse" />
            <div className="h-4 w-32 bg-zinc-800/50 rounded animate-pulse" />
          </div>
        </div>

        {/* Stats Card Skeleton */}
        <CardSkeleton />

        {/* Table Skeleton */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <TableSkeleton rows={10} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-white">{pageTitle}</h1>
            <span className={cn(
              "px-2 md:px-3 py-1 rounded-full text-xs font-semibold",
              accountFilter === 'pessoal'
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
            )}>
              {accountFilter === 'pessoal' ? `👤 ${t('sidebar.personal')}` : `🏢 ${t('sidebar.pj')}`}
            </span>
          </div>
          <p className="text-zinc-400 text-xs md:text-sm mt-1">
            {pageDesc}
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button className="flex items-center gap-2 px-3 md:px-4 py-2 min-h-[44px] bg-[#111827] text-zinc-300 rounded-lg hover:bg-white/5 transition-colors border border-white/5 text-xs md:text-sm font-medium">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.export')}</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className={cn(
              "flex items-center gap-2 px-3 md:px-4 py-2 min-h-[44px] text-white rounded-lg transition-colors text-xs md:text-sm font-medium",
              accentColor
            )}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{newButtonText}</span>
            <span className="sm:hidden">{type === 'receita' ? t('header.new') : t('header.new')}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4 md:p-6">
          <p className="text-xs md:text-sm text-zinc-400 mb-2">{t('transactions.totalMonth')}</p>
          <p className={cn(
            "text-xl md:text-2xl font-bold font-mono",
            type === 'receita' ? "text-[#22C55E]" : "text-[#EF4444]"
          )}>
            {formatCurrency(totalValue)}
          </p>
        </div>
      </div>

      {/* Onboarding InfoCard - Despesas */}
      {type === 'despesa' && (
        <InfoCard
          title={t('expenses.infoCardTitle')}
          description={t('expenses.infoCardDescription')}
          tips={[
            t('expenses.infoCardTip1'),
            t('expenses.infoCardTip2'),
            t('expenses.infoCardTip3'),
          ]}
          storageKey="expenses-onboarding"
        />
      )}

      {/* Onboarding InfoCard - Receitas */}
      {type === 'receita' && (
        <InfoCard
          title={t('income.infoCardTitle')}
          description={t('income.infoCardDescription')}
          tips={[
            t('income.infoCardTip1'),
            t('income.infoCardTip2'),
            t('income.infoCardTip3'),
          ]}
          storageKey="income-onboarding"
        />
      )}

      {/* Filters & Search */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 bg-[#111827] border border-white/5 rounded-xl p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder={t('common.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#22C55E]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border text-sm font-medium",
              showFilters
                ? "bg-[#22C55E] text-white border-[#22C55E]"
                : "bg-[#0A0F1C] text-zinc-300 border-white/10 hover:bg-white/5"
            )}
          >
            <Filter className="w-4 h-4" />
            <span>{t('common.filters')}</span>
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('filters.advanced')}
              </h3>
              <button
                onClick={() => {
                  // Reset filters
                  setShowFilters(false);
                }}
                className="text-sm text-zinc-400 hover:text-white"
              >
                {t('filters.clear')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">{t('filters.startDate')}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg bg-[#0A0F1C] border border-white/10 text-white focus:outline-none focus:border-[#22C55E] [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">{t('filters.endDate')}</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg bg-[#0A0F1C] border border-white/10 text-white focus:outline-none focus:border-[#22C55E] [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleApplyFilters}
                disabled={!startDate || !endDate}
                className={cn(
                  "px-4 py-2 text-sm text-white rounded-lg transition-colors font-medium",
                  accentColor,
                  (!startDate || !endDate) && "opacity-50 cursor-not-allowed"
                )}
              >
                {t('filters.apply')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="text-left py-4 px-6 text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.description')}</th>
                <th className="text-left py-4 px-6 text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.category')}</th>
                <th className="text-left py-4 px-6 text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.date')}</th>
                <th className="text-right py-4 px-6 text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.amount')}</th>
                <th className="text-center py-4 px-6 text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.status')}</th>
                <th className="text-right py-4 px-6 text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-white/5 rounded w-32" /></td>
                    <td className="py-4 px-6"><div className="h-4 bg-white/5 rounded w-24" /></td>
                    <td className="py-4 px-6"><div className="h-4 bg-white/5 rounded w-24" /></td>
                    <td className="py-4 px-6"><div className="h-4 bg-white/5 rounded w-20 ml-auto" /></td>
                    <td className="py-4 px-6"><div className="h-4 bg-white/5 rounded w-16 mx-auto" /></td>
                    <td className="py-4 px-6"><div className="h-4 bg-white/5 rounded w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    {t('common.noTransactions')}
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 text-sm text-white font-medium">
                      {transaction.descricao}
                    </td>
                    <td className="py-4 px-6 text-sm text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white/20" />
                        {transaction.categoria?.descricao || t('dashboard.recent.noCategory')}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-zinc-400">
                      {(() => {
                        const dateStr = transaction.data.split('T')[0];
                        const [year, month, day] = dateStr.split('-');
                        const date = new Date(Number(year), Number(month) - 1, Number(day));
                        return date.toLocaleDateString(locales[language]);
                      })()}
                    </td>
                    <td className={cn(
                      "py-4 px-6 text-sm font-medium font-mono text-right",
                      type === 'receita' ? "text-[#22C55E]" : "text-[#EF4444]"
                    )}>
                      {formatCurrency(transaction.valor)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        badgeColor
                      )}>
                        {type === 'receita' ? t('status.received') : t('status.paid')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          title={t('common.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(transaction)}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title={t('common.delete')}
                          disabled={deletingId === transaction.id}
                        >
                          {deletingId === transaction.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
            <div className="text-sm text-zinc-400">
              {t('pagination.showing')} {startIndex + 1} {t('pagination.to')} {Math.min(endIndex, filteredTransactions.length)} {t('pagination.of')} {filteredTransactions.length} {t('pagination.transactions')}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                  currentPage === 1
                    ? "bg-white/5 text-zinc-600 cursor-not-allowed"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {t('pagination.previous')}
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  // Mostrar apenas páginas próximas
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                          currentPage === page
                            ? type === 'receita'
                              ? "bg-[#22C55E] text-white"
                              : "bg-red-500 text-white"
                            : "bg-white/10 text-zinc-400 hover:bg-white/20 hover:text-white"
                        )}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="text-zinc-600">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                  currentPage === totalPages
                    ? "bg-white/5 text-zinc-600 cursor-not-allowed"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {t('pagination.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        type={type}
        transactionToEdit={transactionToEdit}
      />

      <DeleteTransactionModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTransactionToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        transaction={transactionToDelete}
        isDeleting={deletingId !== null}
      />
    </div>
  );
}
