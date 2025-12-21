"use client";

import { useState } from "react";
import { Plus, CreditCard as CreditCardIcon } from "lucide-react";
import { useCreditCards } from "@/hooks/use-credit-cards";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { CreditCardModal } from "./credit-card-modal";
import { CreditCardItem } from "./credit-card-item";
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
  const { cards, loading } = useCreditCards();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | null>(null);

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

  const handleSuccess = () => {
    setIsModalOpen(false);
    setCardToEdit(null);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setCardToEdit(null);
  };

  const formatCurrency = formatCurrencyFromContext;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{t('cards.title')}</h1>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold",
              accountFilter === 'pessoal'
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
            )}>
              {accountFilter === 'pessoal' ? `👤 ${t('sidebar.personal')}` : `🏢 ${t('sidebar.pj')}`}
            </span>
          </div>
          <p className="text-zinc-400 text-sm mt-1">
            {t('cards.description')}
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('cards.newCard')}
        </button>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
}
