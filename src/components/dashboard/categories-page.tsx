"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Tag, TrendingUp, TrendingDown } from "lucide-react";
import * as Icons from "lucide-react";
import { useCategoriesQuery } from "@/hooks/use-categories-query";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { cn } from "@/lib/utils";
import { CategoryModal } from "./category-modal";
import { DeleteCategoryModal } from "./delete-category-modal";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import { InfoCard } from "@/components/ui/info-card";
import { EmptyStateEducational } from "@/components/ui/empty-state-educational";

export function CategoriesPage() {
  const { t } = useLanguage();
  const { filter: accountFilter } = useAccountFilter();
  const { categories: allCategories, loading } = useCategoriesQuery();
  
  // Filtrar categorias por tipo (incluindo 'ambos')
  const incomeCategories = allCategories.filter(c => c.tipo === 'entrada' || c.tipo === 'ambos');
  const expenseCategories = allCategories.filter(c => c.tipo === 'saida' || c.tipo === 'ambos');
  const loadingIncome = loading;
  const loadingExpense = loading;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<'entrada' | 'saida'>('entrada');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const getIconComponent = (iconName: string | null | undefined) => {
    if (!iconName) return Tag;
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Tag;
  };

  const handleEdit = (category: any, type: 'entrada' | 'saida') => {
    setCategoryToEdit({ ...category, tipo: type });
    setSelectedType(type);
    setIsModalOpen(true);
  };

  const handleAddNew = (type: 'entrada' | 'saida') => {
    setCategoryToEdit(null);
    setSelectedType(type);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (category: any, type: 'entrada' | 'saida') => {
    setCategoryToDelete({ ...category, tipo: type });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      setDeletingId(categoryToDelete.id);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('delete_category_safe', { p_category_id: categoryToDelete.id });

      if (error) throw error;

      if (data && !data.success) {
        alert(`Erro ao deletar categorias: ${data.error}`);
        return;
      }

      if (data && data.success) {
        const { transacoes_afetadas, lancamentos_afetados } = data;
        const total = transacoes_afetadas + lancamentos_afetados;
        
        if (total > 0) {
          alert(`Categoria deletada com sucesso! ${total} registro(s) foram atualizados para "Sem Categoria".`);
        }
      }

      window.dispatchEvent(new CustomEvent('categoriesChanged'));
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      alert('Erro ao deletar categorias: ' + (error as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSuccess = () => {
    window.dispatchEvent(new CustomEvent('categoriesChanged'));
    setIsModalOpen(false);
    setCategoryToEdit(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCategoryToEdit(null);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-white">{t('categories.title')}</h1>
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
            {t('categories.description')}
          </p>
        </div>
      </div>

      {/* Info Card Educativo */}
      {(incomeCategories.length > 0 || expenseCategories.length > 0) && (
        <InfoCard
          title={t('categories.infoCardTitle')}
          description={t('categories.infoCardDescription')}
          tips={[
            t('categories.infoCardTip1'),
            t('categories.infoCardTip2'),
            t('categories.infoCardTip3'),
            "Categorias são usadas em transações, metas e relatórios"
          ]}
          storageKey="categories-tip"
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-zinc-400 mb-2">{t('categories.incomeTitle')}</p>
              <p className="text-2xl md:text-3xl font-bold text-[#22C55E]">
                {incomeCategories.length}
              </p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-[#22C55E]" />
            </div>
          </div>
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-zinc-400 mb-2">{t('categories.expenseTitle')}</p>
              <p className="text-2xl md:text-3xl font-bold text-red-500">
                {expenseCategories.length}
              </p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Categorias de Receitas */}
      <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#22C55E]" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-white">{t('transactions.income')}</h2>
              <p className="text-xs text-zinc-400">{t('categories.incomeTitle')}</p>
            </div>
          </div>
          <button
            onClick={() => handleAddNew('entrada')}
            className="flex items-center gap-2 px-3 md:px-4 py-2 min-h-[44px] bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-lg transition-colors text-xs md:text-sm font-medium w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('categories.newCategory')}</span>
            <span className="sm:hidden">{t('categories.new')}</span>
          </button>
        </div>

        <div className="p-6">
          {loadingIncome ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white/5 rounded-lg h-24" />
              ))}
            </div>
          ) : incomeCategories.length === 0 ? (
            <EmptyStateEducational
              icon={TrendingUp}
              title="Nenhuma Categoria de Receita"
              description="Crie categorias para organizar suas fontes de renda e entender de onde vem seu dinheiro!"
              whatIs="Categorias de receita são classificações para o dinheiro que ENTRA. Exemplos: Salário, Freelance, Investimentos, Vendas, Aluguel recebido, etc. Elas ajudam você a visualizar suas fontes de renda."
              howToUse={[
                { step: 1, text: 'Clique em "+ Nova Categoria" no canto superior direito' },
                { step: 2, text: 'Digite um nome descritivo (ex: "Salário", "Freelance")' },
                { step: 3, text: 'Escolha um ícone que represente a categoria' },
                { step: 4, text: 'Adicione palavras-chave para facilitar a identificação automática' },
                { step: 5, text: 'Use a categoria ao registrar suas receitas' }
              ]}
              example='Exemplo: Crie "Salário" para seu trabalho fixo, "Freelance" para trabalhos extras, e "Investimentos" para rendimentos de aplicações. Assim você vê quanto vem de cada fonte!'
              actionButton={{
                label: '+ Criar Primeira Categoria de Receita',
                onClick: () => handleAddNew('entrada')
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomeCategories.map((category) => {
                const IconComponent = getIconComponent(category.icon_key);
                return (
                  <div
                    key={category.id}
                    className="group bg-[#0A0F1C] border border-white/10 rounded-lg p-4 hover:border-[#22C55E]/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-[#22C55E]" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{category.descricao}</h3>
                          <p className="text-xs text-zinc-500">{t('categories.incomeType')}</p>
                        </div>
                      </div>
                    </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(category, 'entrada')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors text-sm"
                    >
                      <Pencil className="w-3 h-3" />
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(category, 'entrada')}
                      disabled={deletingId === category.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors text-sm"
                    >
                      {deletingId === category.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3" />
                          {t('common.delete')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Categorias de Despesas */}
      <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{t('transactions.expenses')}</h2>
              <p className="text-xs text-zinc-400">{t('categories.expenseTitle')}</p>
            </div>
          </div>
          <button
            onClick={() => handleAddNew('saida')}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t('categories.newCategory')}
          </button>
        </div>

        <div className="p-6">
          {loadingExpense ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white/5 rounded-lg h-24" />
              ))}
            </div>
          ) : expenseCategories.length === 0 ? (
            <EmptyStateEducational
              icon={TrendingDown}
              title="Nenhuma Categoria de Despesa"
              description="Crie categorias para organizar seus gastos e saber exatamente para onde seu dinheiro está indo!"
              whatIs="Categorias de despesa são classificações para o dinheiro que SAI. Exemplos: Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, etc. Elas são essenciais para controlar gastos e criar metas de orçamento."
              howToUse={[
                { step: 1, text: 'Clique em "+ Nova Categoria" no canto superior direito' },
                { step: 2, text: 'Digite um nome descritivo (ex: "Alimentação", "Transporte")' },
                { step: 3, text: 'Escolha um ícone que represente a categoria' },
                { step: 4, text: 'Adicione palavras-chave (ex: "mercado", "uber", "gasolina")' },
                { step: 5, text: 'Use a categoria ao registrar suas despesas e criar metas' }
              ]}
              example='Exemplo: Crie "Alimentação" para mercado e restaurantes, "Transporte" para Uber e gasolina, "Moradia" para aluguel e contas. Depois você pode criar metas de quanto quer gastar em cada uma!'
              actionButton={{
                label: '+ Criar Primeira Categoria de Despesa',
                onClick: () => handleAddNew('saida')
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseCategories.map((category) => {
                const IconComponent = getIconComponent(category.icon_key);
                return (
                  <div
                    key={category.id}
                    className="group bg-[#0A0F1C] border border-white/10 rounded-lg p-4 hover:border-red-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{category.descricao}</h3>
                          <p className="text-xs text-zinc-500">{t('categories.expenseType')}</p>
                        </div>
                      </div>
                    </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(category, 'saida')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors text-sm"
                    >
                      <Pencil className="w-3 h-3" />
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(category, 'saida')}
                      disabled={deletingId === category.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors text-sm"
                    >
                      {deletingId === category.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3" />
                          {t('common.delete')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        type={selectedType}
        categoryToEdit={categoryToEdit}
      />

      <DeleteCategoryModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        category={categoryToDelete}
        isDeleting={deletingId !== null}
      />
    </div>
  );
}
