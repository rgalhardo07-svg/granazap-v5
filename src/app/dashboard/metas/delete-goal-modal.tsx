"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface DeleteGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  goalName: string;
  loading?: boolean;
}

export function DeleteGoalModal({ isOpen, onClose, onConfirm, goalName, loading }: DeleteGoalModalProps) {
  const { t } = useLanguage();
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('goals.confirmDelete')}
      className="max-w-sm w-full p-0 overflow-hidden bg-[#111827] border border-white/10"
    >
      <div className="p-6 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        
        <h3 className="text-lg font-medium text-white mb-2">
          {t('goals.confirmDelete')} "{goalName}"?
        </h3>
        
        <p className="text-sm text-zinc-400 mb-6">
          {t('goals.confirmDeleteImpact')}
        </p>

        <div className="flex gap-3 w-full">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="flex-1 text-zinc-400 hover:text-white hover:bg-white/5"
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            disabled={loading}
          >
            {loading ? t('common.deleting') : t('goals.confirmDelete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
