"use client";

import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, ArrowLeftRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TransactionModal } from "./transaction-modal";
import { useLanguage } from "@/contexts/language-context";
import { usePathname } from "next/navigation";

export function FABButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'receita' | 'despesa'>('despesa');
  const { t } = useLanguage();
  const pathname = usePathname();
  
  // Hide FAB on Scheduled page (has its own + button in header)
  if (pathname === '/dashboard/agendados') {
    return null;
  }

  const handleAction = (type: 'receita' | 'despesa') => {
    setModalType(type);
    setShowModal(true);
    setIsOpen(false);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Menu */}
      <div className="md:hidden fixed bottom-20 right-4 z-50 flex flex-col-reverse items-end gap-3">
        {/* Action Buttons */}
        {isOpen && (
          <>
            {/* Nova Receita */}
            <button
              onClick={() => handleAction('receita')}
              className="flex items-center gap-3 bg-[#22C55E] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[#22C55E]/90 transition-all animate-in slide-in-from-bottom-2 duration-200"
            >
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">{t('modal.newIncome')}</span>
            </button>

            {/* Nova Despesa */}
            <button
              onClick={() => handleAction('despesa')}
              className="flex items-center gap-3 bg-[#EF4444] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[#EF4444]/90 transition-all animate-in slide-in-from-bottom-2 duration-200 delay-75"
            >
              <TrendingDown className="w-5 h-5" />
              <span className="font-medium">{t('modal.newExpense')}</span>
            </button>
          </>
        )}

        {/* Main FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300",
            isOpen
              ? "bg-zinc-700 rotate-45"
              : "bg-primary hover:bg-primary/90"
          )}
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type={modalType}
        onSuccess={() => {
          setShowModal(false);
          window.dispatchEvent(new CustomEvent('transactionsChanged'));
        }}
      />
    </>
  );
}
