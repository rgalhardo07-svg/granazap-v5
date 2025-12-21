"use client";

import { useState } from "react";
import {
  Plus, Target, TrendingUp, Trophy, Calendar, Loader2, Pencil, Trash2, Copy,
  Car, Home, ShoppingCart, Utensils, Plane, Gamepad2, Heart, Smartphone,
  GraduationCap, Briefcase, Gift, Music, Coffee, Shirt, AlertCircle, ArrowUpCircle, ArrowDownCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { useGoals, Goal } from "@/hooks/use-goals";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { AddGoalModal } from "./add-goal-modal";
import { EditGoalModal } from "./edit-goal-modal";
import { DeleteGoalModal } from "./delete-goal-modal";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";
import { InfoCard } from "@/components/ui/info-card";
import { EmptyStateEducational } from "@/components/ui/empty-state-educational";

// Mapeamento de ícones
const IconMap: Record<string, any> = {
  'utensils': Utensils,
  'car': Car,
  'home': Home,
  'shopping-cart': ShoppingCart,
  'plane': Plane,
  'gamepad-2': Gamepad2,
  'heart': Heart,
  'smartphone': Smartphone,
  'graduation-cap': GraduationCap,
  'briefcase': Briefcase,
  'gift': Gift,
  'music': Music,
  'coffee': Coffee,
  'shirt': Shirt,
  'alert-circle': AlertCircle,
  'default': Target
};

export default function GoalsPage() {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { profile } = useUser();
  const { filter: accountFilter } = useAccountFilter();
  const { goals, loading } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  // Estado para duplicar meta
  const [duplicateData, setDuplicateData] = useState<{
    nome: string;
    tipo_meta: string;
    valor_limite: string;
    categoria_id: string;
    data_inicio: string;
    data_fim: string;
  } | null>(null);

  // Calcular totais (Focando em Despesas para os cards de resumo)
  const activeGoals = goals.filter(g => g.status === 'active');
  const expenseGoals = goals.filter(g => !g.isIncomeGoal);
  const incomeGoals = goals.filter(g => g.isIncomeGoal);

  // Total que pode ser gasto vs Total Gasto (Apenas Despesas)
  const totalLimit = expenseGoals.reduce((acc, goal) => acc + goal.valor_limite, 0);
  const totalSpent = expenseGoals.reduce((acc, goal) => acc + goal.currentAmount, 0);
  const totalProgress = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  // Totais de Receita
  const totalIncomeLimit = incomeGoals.reduce((acc, goal) => acc + goal.valor_limite, 0);
  const totalIncomeRealized = incomeGoals.reduce((acc, goal) => acc + goal.currentAmount, 0);
  const totalIncomeProgress = totalIncomeLimit > 0 ? (totalIncomeRealized / totalIncomeLimit) * 100 : 0;

  const handleDeleteClick = (goal: Goal) => {
    setGoalToDelete(goal);
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('metas_orcamento')
        .delete()
        .eq('id', goalToDelete.id);

      if (error) throw error;
      window.location.reload();
    } catch (error) {
    } finally {
      setGoalToDelete(null);
    }
  };

  const handleDuplicate = (goal: Goal) => {
    // Lógica Robusta de Data (Sem Timezone issues)
    // Pega a string "YYYY-MM-DD" e processa manualmente
    const [y, m] = goal.data_inicio.split('-').map(Number);

    // Calcula próximo mês
    let nextMonth = m + 1;
    let nextYear = y;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }

    // Formata para YYYY-MM-DD
    const nextMonthStr = String(nextMonth).padStart(2, '0');

    // Data Início: Sempre dia 01
    const finalStart = `${nextYear}-${nextMonthStr}-01`;

    // Data Fim: Último dia do mês calculado
    // new Date(ano, mês, 0) retorna o último dia do mês anterior ao índice fornecido.
    // Como nextMonth é 1-12 e o Date usa 0-11, nextMonth já serve como o índice do "próximo" mês para pegar o dia 0.
    // Ex: nextMonth = 1 (Janeiro). new Date(2026, 1, 0) pega dia 0 de Fevereiro = 31 de Janeiro.
    const lastDay = new Date(nextYear, nextMonth, 0).getDate();
    const finalEnd = `${nextYear}-${nextMonthStr}-${String(lastDay).padStart(2, '0')}`;

    setDuplicateData({
      nome: goal.nome,
      tipo_meta: goal.tipo_meta,
      valor_limite: String(goal.valor_limite),
      categoria_id: goal.categoria_id ? String(goal.categoria_id) : "",
      data_inicio: finalStart,
      data_fim: finalEnd
    });

    setIsModalOpen(true);
  };

  const renderIcon = (iconKey?: string) => {
    if (!iconKey) return <Target className="w-5 h-5 text-white" />;
    // Remove prefixo 'lucide-' se existir e converte para lowercase
    const key = iconKey.replace('lucide-', '').toLowerCase();
    const IconComponent = IconMap[key] || IconMap['default'];
    return <IconComponent className="w-5 h-5 text-white" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <Target className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
              {t('goals.title')}
            </h1>
            <span className={cn(
              "px-2 md:px-3 py-1 rounded-full text-xs font-semibold border",
              accountFilter === 'pessoal'
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-purple-500/10 text-purple-400 border-purple-500/20"
            )}>
              {accountFilter === 'pessoal' ? `👤 ${t('sidebar.personal')}` : `🏢 ${t('sidebar.pj')}`}
            </span>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">{t('goals.description')}</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all active:scale-95 shadow-lg shadow-blue-900/20 text-sm"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          {t('goals.newGoal')}
        </button>
      </div>

      {/* Resumo Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1 - Receita */}
        <div className="bg-[#111827] border border-white/5 p-4 md:p-5 rounded-xl">
          <div className="flex items-center gap-3 md:gap-4 mb-3">
            <div className="p-2 md:p-3 bg-emerald-500/10 rounded-xl flex-shrink-0">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-zinc-400 truncate">{t('goals.totalIncome')}</p>
              <h3 className="text-lg md:text-xl font-bold text-white truncate">
                {formatCurrency(totalIncomeRealized)}
              </h3>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                style={{ width: `${Math.min(totalIncomeProgress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] md:text-xs">
              <span className="text-zinc-500 truncate">{t('goals.valueLimit')}: {formatCurrency(totalIncomeLimit)}</span>
              <span className="text-emerald-400 flex-shrink-0">{totalIncomeProgress.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Card 2 - Gasto */}
        <div className="bg-[#111827] border border-white/5 p-4 md:p-5 rounded-xl">
          <div className="flex items-center gap-3 md:gap-4 mb-3">
            <div className="p-2 md:p-3 bg-red-500/10 rounded-xl flex-shrink-0">
              <ArrowDownCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-zinc-400 truncate">{t('goals.totalSpent')}</p>
              <h3 className="text-lg md:text-xl font-bold text-white truncate">
                {formatCurrency(totalSpent)}
              </h3>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${totalProgress > 100 ? 'bg-red-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(totalProgress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] md:text-xs">
              <span className="text-zinc-500 truncate">{t('goals.totalBudget')}</span>
              <span className="text-red-400 flex-shrink-0">{totalProgress.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Card 3 - Orçamento */}
        <div className="bg-[#111827] border border-white/5 p-4 md:p-5 rounded-xl flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-blue-500/10 rounded-xl flex-shrink-0">
            <Target className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-zinc-400 truncate">{t('goals.valueLimit')}</p>
            <h3 className="text-lg md:text-xl font-bold text-white truncate">
              {formatCurrency(totalLimit)}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">{t('goals.totalBudget')}</p>
          </div>
        </div>

        {/* Card 4 - Metas Ativas */}
        <div className="bg-[#111827] border border-white/5 p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 rounded-xl">
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-zinc-400">{t('goals.activeGoals')}</p>
            <h3 className="text-xl font-bold text-white">
              {activeGoals.length}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">{incomeGoals.length} {t('transactions.income')} • {expenseGoals.length} {t('transactions.expenses')}</p>
          </div>
        </div>
      </div>

      {/* Info Card - Dica sobre Metas */}
      {goals.length > 0 && (
        <InfoCard
          title={t('goals.infoCardTitle')}
          description={t('goals.infoCardDescription')}
          tips={[
            t('goals.infoCardTip1'),
            t('goals.infoCardTip2'),
            t('goals.infoCardTip3'),
            t('goals.infoCardTip4'),
          ]}
          storageKey="goals-tip"
        />
      )}

      {/* Lista de Metas */}
      {goals.length === 0 ? (
        <EmptyStateEducational
          icon={Target}
          title={t('goals.emptyStateTitle')}
          description={t('goals.emptyStateDescription')}
          whatIs={t('goals.emptyStateWhatIs')}
          howToUse={[
            { step: 1, text: t('goals.emptyStateStep1') },
            { step: 2, text: t('goals.emptyStateStep2') },
            { step: 3, text: t('goals.emptyStateStep3') },
            { step: 4, text: t('goals.emptyStateStep4') },
            { step: 5, text: t('goals.emptyStateStep5') }
          ]}
          example={t('goals.emptyStateExample')}
          actionButton={{
            label: t('goals.createFirstGoal'),
            onClick: () => setIsModalOpen(true)
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {goals.map((goal) => {
            const isIncome = goal.isIncomeGoal;
            const progress = (goal.currentAmount / goal.valor_limite) * 100;
            const remaining = goal.valor_limite - goal.currentAmount;

            // Para receita: sucesso se passar da meta
            // Para despesa: falha se passar da meta (isOverBudget)
            const isOverBudget = !isIncome && remaining < 0;
            const isIncomeSuccess = isIncome && goal.currentAmount >= goal.valor_limite;

            // Cores dinâmicas
            let themeColor = 'blue';
            if (isIncome) {
              themeColor = 'emerald'; // Receita = Verde
            } else if (isOverBudget) {
              themeColor = 'red'; // Despesa Estourada = Vermelho
            }

            // Mapeando cores do Tailwind dinamicamente (precisa ser explícito para o compilador não purgar)
            const bgClass = isIncome ? 'bg-emerald-500/10' : (isOverBudget ? 'bg-red-500/10' : 'bg-blue-500/10');
            const textClass = isIncome ? 'text-emerald-500' : (isOverBudget ? 'text-red-500' : 'text-blue-500');
            const borderClass = isIncome ? 'border-emerald-500/20' : (isOverBudget ? 'border-red-500/20' : 'border-blue-500/20');
            const barBgClass = isIncome ? 'bg-emerald-500' : (isOverBudget ? 'bg-red-500' : 'bg-blue-500');

            return (
              <div key={goal.id} className="group bg-[#111827] border border-white/5 hover:border-white/10 p-5 rounded-xl transition-all hover:translate-y-[-2px] relative overflow-hidden">

                {/* Background Glow Efeito */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${themeColor}-500/5 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none`} />

                {/* Badge de Tipo */}
                <div className="absolute top-4 left-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border",
                    isIncome
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  )}>
                    {isIncome ? t('transactions.income') : t('transactions.expenses')}
                  </span>
                </div>

                {/* Ações (Editar/Excluir/Duplicar) */}
                <div className="absolute top-4 right-4 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={() => handleDuplicate(goal)}
                    className="p-2 bg-[#0A0F1C] border border-white/5 hover:bg-blue-900/20 text-zinc-400 hover:text-blue-400 rounded-lg transition-colors shadow-lg"
                    title={t('goals.duplicate')}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingGoal(goal)}
                    className="p-2 bg-[#0A0F1C] border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors shadow-lg"
                    title={t('common.edit')}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(goal)}
                    className="p-2 bg-[#0A0F1C] border border-white/5 hover:bg-red-900/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors shadow-lg"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-6 flex items-start gap-4 mb-4 pr-10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 ${bgClass} ${textClass} shadow-inner`}>
                    {renderIcon(goal.categoria?.icon_key)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-zinc-500 mb-0.5 uppercase tracking-wider">{goal.categoria?.descricao || t('goals.generalExpense')}</p>
                    <h3 className="text-white font-semibold truncate text-lg leading-tight" title={goal.nome}>
                      {goal.nome}
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">{isIncome ? t('goals.realized') : t('goals.spent')}</p>
                      <span className={`text-lg font-bold ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
                        {formatCurrency(goal.currentAmount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 mb-1">{t('goals.valueLimit')}</p>
                      <span className="text-sm font-medium text-zinc-400">
                        {formatCurrency(goal.valor_limite)}
                      </span>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-[#0A0F1C] border border-white/5 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${barBgClass}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <Calendar className="w-3 h-3" />
                      <span>{t('goals.endDate')}: {new Date(goal.data_fim).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <span className={isIncomeSuccess ? 'text-emerald-400 font-medium' : (isOverBudget ? 'text-red-400 font-medium' : 'text-blue-400 font-medium')}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>

                  <div className={`pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs`}>
                    <span className="text-zinc-500">
                      {isIncome
                        ? (remaining > 0 ? t('goals.remaining') : t('goals.exceeded'))
                        : (remaining >= 0 ? t('goals.remaining') : t('goals.exceeded'))}
                    </span>
                    <span className={`font-mono font-medium ${isIncome
                      ? (remaining <= 0 ? 'text-emerald-400' : 'text-zinc-400')
                      : (remaining < 0 ? 'text-red-400' : 'text-emerald-400')
                      }`}>
                      {formatCurrency(Math.abs(remaining))}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddGoalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDuplicateData(null);
        }}
        onSuccess={() => window.location.reload()}
        initialData={duplicateData}
      />

      <EditGoalModal
        isOpen={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        onSuccess={() => window.location.reload()}
        goal={editingGoal}
      />

      <DeleteGoalModal
        isOpen={!!goalToDelete}
        onClose={() => setGoalToDelete(null)}
        onConfirm={confirmDelete}
        goalName={goalToDelete?.nome || 'Meta'}
      />
    </div>
  );
}
