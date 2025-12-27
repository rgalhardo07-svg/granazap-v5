"use client";

import { useState, useEffect } from "react";
import { Plus, CreditCard as CreditCardIcon, Eye, EyeOff } from "lucide-react";
import { useCreditCards } from "@/hooks/use-credit-cards";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { createClient } from "@/lib/supabase/client";
import { CreditCardModal } from "./credit-card-modal";
import { CreditCardItem } from "./credit-card-item";
import { DeleteCardModal } from "./delete-card-modal";
import { cn } from "@/lib/utils";
import type { CreditCard } from "@/hooks/use-credit-cards";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";
import { InfoCard } from "@/components/ui/info-card";
import { EmptyStateEducational } from "@/components/ui/empty-state-educational";

export function CardsPage() {
  const { t, language } = useLanguage();
  const { formatCurrency: formatCurrencyFromContext } = useCurrency();
  const { filter: accountFilter } = useAccountFilter();
  const [showInactive, setShowInactive] = useState(false);
  const { cards, loading } = useCreditCards(showInactive);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);
  const [mounted, setMounted] = useState(false);

  const locales = {
    pt: 'pt-BR',
    en: 'en-US',
    es: 'es-ES'
  };

  const handleAddNew = () => {
    setCardToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (card: CreditCard) => {
    setCardToEdit(card);
    setIsModalOpen(true);
  };

  const handleDelete = (card: CreditCard) => {
    setCardToDelete(card);
    setIsDeleteModalOpen(true);
  };

  const handleReactivate = async (card: CreditCard) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('cartoes_credito')
        .update({ ativo: true })
        .eq('id', card.id);

      if (error) throw error;

      // Disparar evento para atualizar lista
      window.dispatchEvent(new Event('creditCardsChanged'));
    } catch (error) {
      console.error('Error reactivating card:', error);
    }
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setCardToEdit(null);
  };

  const handleDeleteSuccess = () => {
    setIsDeleteModalOpen(false);
    setCardToDelete(null);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setCardToEdit(null);
  };

  const handleDeleteClose = () => {
    setIsDeleteModalOpen(false);
    setCardToDelete(null);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatCurrency = formatCurrencyFromContext;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-white">{t('cards.title')}</h1>
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
            {t('cards.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg transition-all font-medium text-sm border",
              showInactive
                ? "bg-zinc-700 border-zinc-600 text-white"
                : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
            )}
            title={showInactive ? "Ocultar inativos" : "Mostrar inativos"}
          >
            {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {showInactive ? "Mostrando inativos" : "Apenas ativos"}
            </span>
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-purple-500 hover:bg-purple-600 active:scale-95 text-white rounded-lg transition-all font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('cards.newCard')}</span>
            <span className="sm:hidden">{t('cards.new')}</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {!mounted || loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-[#111827] border border-white/5 rounded-xl h-80" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <EmptyStateEducational
          icon={CreditCardIcon}
          title={t('cards.emptyStateTitle')}
          description={t('cards.emptyStateDescription')}
          whatIs={t('cards.emptyStateWhatIs')}
          howToUse={[
            { step: 1, text: t('cards.emptyStateStep1') },
            { step: 2, text: t('cards.emptyStateStep2') },
            { step: 3, text: 'Configure o dia de fechamento (quando a fatura fecha)' },
            { step: 4, text: 'Configure o dia de vencimento (quando você deve pagar)' },
            { step: 5, text: 'Vincule a uma conta bancária para pagar a fatura automaticamente' }
          ]}
          example='Exemplo: Seu cartão fecha dia 10 e vence dia 17. Se você comprar algo dia 5, vai para a fatura que fecha dia 10. Se comprar dia 12, vai para a próxima fatura (fecha dia 10 do mês seguinte).'
          actionButton={{
            label: '+ Cadastrar Primeiro Cartão',
            onClick: handleAddNew
          }}
        />
      ) : (
        <>
          {/* Info Card - Dica sobre Cartões */}
          <InfoCard
            title={t('creditCards.infoCardTitle')}
            description={t('creditCards.infoCardDescription')}
            tips={[
              t('creditCards.infoCardTip1'),
              t('creditCards.infoCardTip2'),
              t('creditCards.infoCardTip3'),
              t('creditCards.infoCardTip4'),
            ]}
            storageKey="credit-cards-tip"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <CreditCardItem
                key={card.id}
                card={card}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReactivate={handleReactivate}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      <CreditCardModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        cardToEdit={cardToEdit}
      />

      {/* Delete Modal */}
      <DeleteCardModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteClose}
        onSuccess={handleDeleteSuccess}
        card={cardToDelete}
      />
    </div>
  );
}
