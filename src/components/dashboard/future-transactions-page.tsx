"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import { Plus, Search, Filter, Calendar, TrendingUp, TrendingDown, Loader2, Clock, CheckCircle2, XCircle, Repeat, CreditCard, Edit, Trash2, Settings } from "lucide-react";
import * as Icons from "lucide-react";
import { useFutureTransactionsQuery, useFutureTransactionMutations } from "@/hooks/use-future-transactions-query";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { usePeriodFilter } from "@/hooks/use-period-filter";
import { cn } from "@/lib/utils";
import { format, parseISO, isPast, isFuture, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TableSkeleton, CardSkeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";
import { InfoCard } from "@/components/ui/info-card";
import { EmptyStateEducational } from "@/components/ui/empty-state-educational";

// Dynamic imports para reduzir bundle inicial
const FutureTransactionModal = dynamic(() => import("./future-transaction-modal").then(mod => mod.FutureTransactionModal));
const EditFutureConfirmationModal = dynamic(() => import("./edit-future-confirmation-modal").then(mod => mod.EditFutureConfirmationModal));
const DeleteFutureConfirmationModal = dynamic(() => import("./delete-future-confirmation-modal").then(mod => mod.DeleteFutureConfirmationModal));
const ManageRecurrenceModal = dynamic(() => import("./manage-recurrence-modal").then(mod => mod.ManageRecurrenceModal));
const ConfirmPaymentModal = dynamic(() => import("./confirm-payment-modal").then(mod => mod.ConfirmPaymentModal));
const CancelPaymentModal = dynamic(() => import("./cancel-payment-modal").then(mod => mod.CancelPaymentModal));

type FilterType = 'todos' | 'entrada' | 'saida';
type FilterStatus = 'todos' | 'pendente' | 'pago' | 'cancelado';
type FilterRecurrence = 'todos' | 'unico' | 'recorrente' | 'parcelado';

export function FutureTransactionsPage() {
  const { t, language } = useLanguage();
  const { formatCurrency: formatCurrencyFromContext } = useCurrency();
  const { filter: accountFilter } = useAccountFilter();
  const { period } = usePeriodFilter();
  const { transactions, loading, isRefetching } = useFutureTransactionsQuery(period);
  const { invalidateAll } = useFutureTransactionMutations();
  
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm); // Busca deferida
  const [filterType, setFilterType] = useState<FilterType>('todos');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [filterRecurrence, setFilterRecurrence] = useState<FilterRecurrence>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only showing loading skeleton on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditConfirmModalOpen, setIsEditConfirmModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRecurrenceModalOpen, setIsRecurrenceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCreditCardWarningOpen, setIsCreditCardWarningOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [modalType, setModalType] = useState<'entrada' | 'saida'>('saida');
  const [editType, setEditType] = useState<'single' | 'future'>('single');

  const getIconComponent = (iconName: string | null | undefined) => {
    if (!iconName) return Icons.Tag;
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Tag;
  };

  // Filtrar transações usando deferredSearchTerm
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Filtro de busca
      const searchLower = deferredSearchTerm.toLowerCase();
      const matchesSearch = 
        transaction.descricao.toLowerCase().includes(searchLower) ||
        transaction.pagador_recebedor?.toLowerCase().includes(searchLower) ||
        transaction.categoria?.descricao.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Filtro de tipo
      if (filterType !== 'todos' && transaction.tipo !== filterType) return false;

      // Filtro de status
      if (filterStatus !== 'todos' && transaction.status !== filterStatus) return false;

      // Filtro de recorrência (parcelamento é TEXT no banco)
      const isParcelado = String(transaction.parcelamento) === 'true';
      if (filterRecurrence === 'unico' && (transaction.recorrente || isParcelado)) return false;
      if (filterRecurrence === 'recorrente' && !transaction.recorrente) return false;
      if (filterRecurrence === 'parcelado' && !isParcelado) return false;

      // Filtro de data: PRIORIDADE para range personalizado
      if (startDate && endDate) {
        // Se tem range personalizado, usa ele e ignora o período superior
        const transactionDate = new Date(transaction.data_prevista);
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (transactionDate < start || transactionDate > end) return false;
      } else {
        // Se NÃO tem range personalizado, aplica o filtro de período do topo
        const transactionDate = new Date(transaction.data_prevista);
        const now = new Date();
        let periodStart = new Date();
        let periodEnd = new Date();

        switch (period) {
          case 'day':
            periodStart.setHours(0, 0, 0, 0);
            periodEnd.setHours(23, 59, 59, 999);
            break;
          case 'week':
            const dayOfWeek = now.getDay();
            periodStart = new Date(now);
            periodStart.setDate(now.getDate() - dayOfWeek);
            periodStart.setHours(0, 0, 0, 0);
            periodEnd = new Date(periodStart);
            periodEnd.setDate(periodStart.getDate() + 6);
            periodEnd.setHours(23, 59, 59, 999);
            break;
          case 'month':
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
          case 'year':
            periodStart = new Date(now.getFullYear(), 0, 1);
            periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
        }

        if (transactionDate < periodStart || transactionDate > periodEnd) return false;
      }

      return true;
    });
  }, [transactions, deferredSearchTerm, filterType, filterStatus, filterRecurrence, startDate, endDate, period]);

  // Paginação
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Estatísticas - usar filteredTransactions em vez de transactions
  const stats = useMemo(() => {
    const pending = filteredTransactions.filter(t => t.status === 'pendente');
    const income = pending.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + Number(t.valor), 0);
    const expense = pending.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + Number(t.valor), 0);
    const overdue = pending.filter(t => isPast(parseISO(t.data_prevista)) && !isToday(parseISO(t.data_prevista)));

    return {
      totalPending: pending.length,
      totalIncome: income,
      totalExpense: expense,
      totalOverdue: overdue.length,
    };
  }, [filteredTransactions]);

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: { label: t('future.pending'), color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
      pago: { label: t('future.paid'), color: 'bg-green-500/10 text-green-500 border-green-500/30' },
      cancelado: { label: t('future.cancelled'), color: 'bg-red-500/10 text-red-500 border-red-500/30' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pendente;
    return (
      <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", badge.color)}>
        {badge.label}
      </span>
    );
  };

  const getDateStatus = (dateStr: string, status: string) => {
    if (status !== 'pendente') return null;
    
    const date = parseISO(dateStr);
    const daysUntil = differenceInDays(date, new Date());

    if (isPast(date) && !isToday(date)) {
      return { label: t('future.overdueLabel'), color: 'text-red-500', icon: XCircle };
    }
    if (isToday(date)) {
      return { label: t('common.today'), color: 'text-yellow-500', icon: Clock };
    }
    if (daysUntil <= 3) {
      return { label: `${daysUntil}d`, color: 'text-yellow-500', icon: Clock };
    }
    if (daysUntil <= 7) {
      return { label: `${daysUntil}d`, color: 'text-blue-500', icon: Calendar };
    }
    return null;
  };

  const formatCurrency = formatCurrencyFromContext;

  // Handlers
  const handleEdit = (transaction: any) => {
    const isParcelado = String(transaction.parcelamento) === 'true';
    const isRecorrente = transaction.recorrente;

    if (isRecorrente || isParcelado) {
      // Para recorrente ou parcelado, abrir modal de confirmação
      setSelectedTransaction(transaction);
      setIsEditConfirmModalOpen(true);
    } else {
      // Para único, editar direto
      setSelectedTransaction(transaction);
      setModalType(transaction.tipo);
      setIsCreateModalOpen(true);
    }
  };

  const handleEditConfirm = (selectedEditType: 'single' | 'future') => {
    // Armazenar o tipo de edição escolhido
    setEditType(selectedEditType);
    
    // Fechar modal de confirmação
    setIsEditConfirmModalOpen(false);
    
    // Abrir modal de edição com a transação selecionada
    if (selectedTransaction) {
      setModalType(selectedTransaction.tipo);
      setIsCreateModalOpen(true);
    }
  };

  const handleDelete = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmPayment = (transaction: any) => {
    // Verificar se é lançamento de cartão de crédito
    if (transaction.cartao_id) {
      setSelectedTransaction(transaction);
      setIsCreditCardWarningOpen(true);
      return;
    }
    
    setSelectedTransaction(transaction);
    setIsPaymentModalOpen(true);
  };

  const handleCancelPayment = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsCancelModalOpen(true);
  };

  const handleSuccess = () => {
    // Callback de sucesso para fechar modais e atualizar lista
    setIsCreateModalOpen(false);
    setIsEditConfirmModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsRecurrenceModalOpen(false);
    setIsPaymentModalOpen(false);
    setIsCancelModalOpen(false);
    setSelectedTransaction(null);
    
    // Invalidar cache do React Query para recarregar dados
    invalidateAll();
  };

  // Don't show skeleton on server to prevent hydration mismatch
  if (loading && !mounted) {
    return null;
  }

  if (loading && mounted) {
    return (
      <div className="space-y-3 md:space-y-6 pb-20 md:pb-0">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* Table Skeleton */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <TableSkeleton rows={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-white">{t('future.title')}</h1>
          <p className="text-zinc-400 text-xs md:text-sm mt-1">
            {t('future.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isRefetching && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="hidden sm:inline">{t('common.updating')}</span>
            </div>
          )}
          <button
            onClick={() => {
              setSelectedTransaction(null);
              setModalType('saida');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 h-10 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-lg font-medium transition-colors shadow-lg shadow-[#22C55E]/20"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nova</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-2.5 md:p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-zinc-500 truncate">Pendentes</p>
              <p className="text-base md:text-xl font-bold text-white">{stats.totalPending}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-xl p-2.5 md:p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-[#22C55E]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-zinc-500 truncate">A Receber</p>
              <p className="text-xs md:text-lg font-bold text-[#22C55E] truncate">{formatCurrency(stats.totalIncome)}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-xl p-2.5 md:p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-zinc-500 truncate">A Pagar</p>
              <p className="text-xs md:text-lg font-bold text-red-500 truncate">{formatCurrency(stats.totalExpense)}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-xl p-2.5 md:p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">{t('future.overdue')}</p>
              <p className="text-xl font-bold text-white">{stats.totalOverdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder={t('future.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#0A0F1C] border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 h-10 rounded-lg border transition-colors",
              showFilters
                ? "bg-[#22C55E]/10 border-[#22C55E] text-[#22C55E]"
                : "bg-[#0A0F1C] border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
            )}
          >
            <Filter className="w-4 h-4" />
            {t('future.filters')}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="space-y-4 mt-4 pt-4 border-t border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-zinc-500 mb-2 block">{t('common.type')}</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="w-full h-9 px-3 bg-[#0A0F1C] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="todos">{t('future.all')}</option>
                  <option value="entrada">{t('common.income')}</option>
                  <option value="saida">{t('common.expense')}</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-2 block">{t('common.status')}</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                  className="w-full h-9 px-3 bg-[#0A0F1C] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="todos">{t('future.all')}</option>
                  <option value="pendente">{t('future.pending')}</option>
                  <option value="pago">{t('future.paid')}</option>
                  <option value="cancelado">{t('future.cancelled')}</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-2 block">{t('future.recurrence')}</label>
                <select
                  value={filterRecurrence}
                  onChange={(e) => setFilterRecurrence(e.target.value as FilterRecurrence)}
                  className="w-full h-9 px-3 bg-[#0A0F1C] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="todos">{t('future.all')}</option>
                  <option value="unico">{t('future.unique')}</option>
                  <option value="recorrente">{t('future.recurrent')}</option>
                  <option value="parcelado">{t('future.installments')}</option>
                </select>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-500 mb-2 block">{t('future.startDate')}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-9 px-3 bg-[#0A0F1C] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#22C55E] [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-2 block">{t('future.endDate')}</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-9 px-3 bg-[#0A0F1C] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E] [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {(startDate || endDate || filterType !== 'todos' || filterStatus !== 'todos' || filterRecurrence !== 'todos') && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setFilterType('todos');
                    setFilterStatus('todos');
                    setFilterRecurrence('todos');
                  }}
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  {t('future.clearFilters')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Card - Onboarding sobre Agendamentos */}
      <InfoCard
        title={t('future.infoCardTitle')}
        description={t('future.infoCardDescription')}
        tips={[
          t('future.infoCardTip1'),
          t('future.infoCardTip2'),
          t('future.infoCardTip3'),
          "✅ Quando confirmar o pagamento, a transação vai para 'Despesas' automaticamente."
        ]}
        storageKey="scheduled-transactions-onboarding"
      />

      {/* Transactions List */}
      <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
        {paginatedTransactions.length === 0 ? (
          searchTerm || filterType !== 'todos' || filterStatus !== 'todos' || filterRecurrence !== 'todos' ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Calendar className="w-12 h-12 text-zinc-600 mb-3" />
              <p className="text-zinc-400 text-center">{t('future.noResults')}</p>
            </div>
          ) : (
            <EmptyStateEducational
              icon={Calendar}
              title="Nenhum Lançamento Futuro Cadastrado"
              description={t('future.emptyStateDescription')}
              whatIs="Lançamentos futuros são transações que você agenda para acontecer em datas específicas. Podem ser únicos (uma vez só), recorrentes (todo mês) ou parcelados (divididos em várias vezes)."
              howToUse={[
                { step: 1, text: 'Clique no botão "+ Nova" no canto superior direito' },
                { step: 2, text: 'Escolha se é uma Receita (dinheiro que vai entrar) ou Despesa (conta a pagar)' },
                { step: 3, text: 'Preencha descrição, valor, categoria e data prevista' },
                { step: 4, text: 'Marque como recorrente se for uma conta mensal (ex: aluguel)' },
                { step: 5, text: 'Quando a data chegar, confirme o pagamento para virar transação real' }
              ]}
              example='Exemplo: Você tem que pagar o aluguel todo dia 10. Crie um lançamento futuro "Aluguel" de R$ 1.500, marque como recorrente mensal, e o sistema vai te lembrar todo mês!'
              actionButton={{
                label: '+ Criar Primeiro Lançamento',
                onClick: () => {
                  setModalType('saida');
                  setIsCreateModalOpen(true);
                }
              }}
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0A0F1C] border-b border-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    {t('future.tableDescription')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    {t('future.tableCategory')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    {t('future.tableDueDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    {t('future.tableValue')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    {t('future.tableStatus')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    {t('future.tableType')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    {t('future.tableActions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedTransactions.map((transaction) => {
                  const IconComponent = getIconComponent(transaction.categoria?.icon_key);
                  const dateStatus = getDateStatus(transaction.data_prevista, transaction.status);
                  const isIncome = transaction.tipo === 'entrada';

                  return (
                    <tr key={transaction.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            isIncome ? "bg-[#22C55E]/10" : "bg-red-500/10"
                          )}>
                            <IconComponent className={cn(
                              "w-5 h-5",
                              isIncome ? "text-[#22C55E]" : "text-red-500"
                            )} />
                          </div>
                          <div>
                            <p className="text-white font-medium">{transaction.descricao}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {transaction.tipo_conta === 'pj' ? (
                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/30 font-medium">
                                  💼 PJ
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/30 font-medium">
                                  👤 {t('future.personal')}
                                </span>
                              )}
                              {transaction.recorrente && (
                                <span className="flex items-center gap-1 text-xs text-blue-400">
                                  <Repeat className="w-3 h-3" />
                                  {transaction.periodicidade}
                                </span>
                              )}
                              {transaction.cartao_id && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded border border-purple-500/30 font-medium">
                                  <CreditCard className="w-3 h-3" />
                                  {transaction.parcela_info ? 
                                    `${transaction.parcela_info.numero}/${transaction.parcela_info.total}x` : 
                                    'Cartão'}
                                </span>
                              )}
                              {!transaction.cartao_id && transaction.parcela_info && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-400 text-xs rounded border border-orange-500/30 font-medium">
                                  📊 {transaction.parcela_info.numero}/{transaction.parcela_info.total}x
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-zinc-400 text-sm">
                          {transaction.categoria?.descricao || 'Sem categoria'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm">
                            {format(parseISO(transaction.data_prevista), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          {dateStatus && (
                            <span className={cn("flex items-center gap-1 text-xs font-medium", dateStatus.color)}>
                              <dateStatus.icon className="w-3 h-3" />
                              {dateStatus.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "font-semibold",
                          isIncome ? "text-[#22C55E]" : "text-red-500"
                        )}>
                          {formatCurrency(Number(transaction.valor))}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isIncome ? (
                            <TrendingUp className="w-4 h-4 text-[#22C55E]" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-zinc-400 text-sm">
                            {isIncome ? t('common.income') : t('common.expense')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {transaction.status === 'pendente' ? (
                            <button 
                              onClick={() => handleConfirmPayment(transaction)}
                              className="p-2 hover:bg-[#22C55E]/10 text-[#22C55E] rounded-lg transition-colors"
                              title="Marcar como pago"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          ) : transaction.status === 'pago' && (
                            <button 
                              onClick={() => handleCancelPayment(transaction)}
                              className="p-2 hover:bg-yellow-500/10 text-yellow-500 rounded-lg transition-colors"
                              title={t('action.cancelPayment')}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {transaction.recorrente && transaction.status === 'pendente' && (
                            <button 
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setIsRecurrenceModalOpen(true);
                              }}
                              className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors"
                              title="Gerenciar recorrência"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          )}
                          {transaction.status === 'pendente' && (
                            <button 
                              onClick={() => handleEdit(transaction)}
                              className="p-2 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors"
                              title={t('action.edit')}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {transaction.status === 'pendente' && (
                            <button 
                              onClick={() => handleDelete(transaction)}
                              className="p-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg transition-colors"
                              title={t('action.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
            <p className="text-sm text-zinc-400">
              {t('future.showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('future.to')} {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} {t('future.of')} {filteredTransactions.length} {t('future.transactions')}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('future.previous')}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-8 h-8 rounded-lg transition-colors",
                    currentPage === page
                      ? "bg-[#22C55E] text-white"
                      : "border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('future.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <FutureTransactionModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedTransaction(null);
          setEditType('single');
        }}
        onSuccess={handleSuccess}
        type={modalType}
        transactionToEdit={selectedTransaction}
        editType={editType}
      />

      <EditFutureConfirmationModal
        isOpen={isEditConfirmModalOpen}
        onClose={() => {
          setIsEditConfirmModalOpen(false);
          setSelectedTransaction(null);
        }}
        onConfirm={handleEditConfirm}
        transaction={selectedTransaction}
      />

      <DeleteFutureConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTransaction(null);
        }}
        onSuccess={handleSuccess}
        transaction={selectedTransaction}
      />

      <ManageRecurrenceModal
        isOpen={isRecurrenceModalOpen}
        onClose={() => {
          setIsRecurrenceModalOpen(false);
          setSelectedTransaction(null);
        }}
        onSuccess={handleSuccess}
        transaction={selectedTransaction}
      />

      <ConfirmPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedTransaction(null);
        }}
        onSuccess={handleSuccess}
        transaction={selectedTransaction}
      />

      <CancelPaymentModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedTransaction(null);
        }}
        onSuccess={handleSuccess}
        transaction={selectedTransaction}
      />

      {/* Modal de Aviso - Lançamento de Cartão */}
      <Modal
        isOpen={isCreditCardWarningOpen}
        onClose={() => {
          setIsCreditCardWarningOpen(false);
          setSelectedTransaction(null);
        }}
        title="⚠️ Lançamento de Cartão de Crédito"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-200 text-sm leading-relaxed">
              Este é um lançamento de <strong>cartão de crédito</strong> e não pode ser marcado como pago individualmente.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-white font-medium flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              Como pagar esta despesa?
            </h3>
            
            <ol className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold mt-0.5">1.</span>
                <span>Acesse o menu <strong className="text-white">"Cartões"</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold mt-0.5">2.</span>
                <span>Selecione o cartão desta despesa</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold mt-0.5">3.</span>
                <span>Clique em <strong className="text-white">"Pagar Fatura"</strong></span>
              </li>
            </ol>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-200 text-xs leading-relaxed">
              <strong>💡 Dica:</strong> Ao pagar a fatura, todas as despesas do mês serão pagas de uma vez e o limite do cartão será atualizado automaticamente.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={() => {
                setIsCreditCardWarningOpen(false);
                setSelectedTransaction(null);
              }}
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white"
            >
              Entendi
            </Button>
            <Button
              type="button"
              onClick={() => {
                setIsCreditCardWarningOpen(false);
                setSelectedTransaction(null);
                window.location.href = '/dashboard/cartoes';
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Ir para Cartões
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
