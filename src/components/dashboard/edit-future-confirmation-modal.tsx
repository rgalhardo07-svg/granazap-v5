"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Loader2, Edit2, Calendar, Repeat } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

interface EditFutureConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (editType: 'single' | 'future') => void;
  transaction: any;
}

export function EditFutureConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  transaction
}: EditFutureConfirmationModalProps) {
  const { t } = useLanguage();
  const [editType, setEditType] = useState<'single' | 'future'>('single');

  if (!transaction) return null;

  const isParcelado = String(transaction.parcelamento) === 'true';
  const isRecorrente = transaction.recorrente;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('future.updateRepeated')}
      className="max-w-lg"
    >
      <div className="space-y-6">
        {/* Alert */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-400">
            <span className="font-semibold">{t('common.attention')}:</span> {t('future.editSeriesMessage')}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Apenas Esta */}
          <button
            onClick={() => setEditType('single')}
            className={cn(
              "w-full text-left p-4 rounded-lg border-2 transition-all",
              editType === 'single'
                ? "border-[#22C55E] bg-[#22C55E]/10"
                : "border-white/10 hover:border-white/20 hover:bg-white/5"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                editType === 'single' ? "bg-[#22C55E]/20" : "bg-white/5"
              )}>
                <Edit2 className={cn(
                  "w-5 h-5",
                  editType === 'single' ? "text-[#22C55E]" : "text-zinc-400"
                )} />
              </div>
              <div className="flex-1">
                <p className={cn(
                  "font-semibold mb-1",
                  editType === 'single' ? "text-[#22C55E]" : "text-white"
                )}>
                  {t('future.onlyThisOne')}
                </p>
                <p className="text-xs text-zinc-400">
                  {t('future.onlyThisDesc')}
                </p>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1",
                editType === 'single' ? "border-[#22C55E]" : "border-white/20"
              )}>
                {editType === 'single' && (
                  <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
                )}
              </div>
            </div>
          </button>

          {/* Esta e as Próximas */}
          <button
            onClick={() => setEditType('future')}
            className={cn(
              "w-full text-left p-4 rounded-lg border-2 transition-all",
              editType === 'future'
                ? "border-[#22C55E] bg-[#22C55E]/10"
                : "border-white/10 hover:border-white/20 hover:bg-white/5"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                editType === 'future' ? "bg-[#22C55E]/20" : "bg-white/5"
              )}>
                <Calendar className={cn(
                  "w-5 h-5",
                  editType === 'future' ? "text-[#22C55E]" : "text-zinc-400"
                )} />
              </div>
              <div className="flex-1">
                <p className={cn(
                  "font-semibold mb-1",
                  editType === 'future' ? "text-[#22C55E]" : "text-white"
                )}>
                  Esta e as Próximas
                </p>
                <p className="text-xs text-zinc-400">
                  Modifica esta transação e todas as futuras da série
                </p>
                {isParcelado && (
                  <p className="text-xs text-yellow-500 mt-1">
                    ⚠️ Importante: As datas de vencimento não serão alteradas
                  </p>
                )}
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1",
                editType === 'future' ? "border-[#22C55E]" : "border-white/20"
              )}>
                {editType === 'future' && (
                  <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
          <Button
            onClick={onClose}
            className="px-6 bg-transparent border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(editType)}
            className="px-6 bg-[#22C55E] hover:bg-[#16A34A] text-white font-medium"
          >
            Continuar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
