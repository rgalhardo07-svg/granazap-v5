"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import { IconSelector, suggestIcon } from "./icon-selector";
import { useLanguage } from "@/contexts/language-context";

type CategoryFormValues = {
  descricao: string;
};

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: 'entrada' | 'saida';
  categoryToEdit?: any;
}

export function CategoryModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  type,
  categoryToEdit 
}: CategoryModalProps) {
  const { t } = useLanguage();
  const { profile } = useUser();
  const { filter: accountFilter } = useAccountFilter();
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  
  // Schema dinâmico com tradução
  const categorySchema = z.object({
    descricao: z.string().min(1, t('categories.modal.nameRequired')),
  });
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      descricao: "",
    },
  });

  const accentColor = type === 'entrada' ? '#22C55E' : '#EF4444';
  const accentColorHover = type === 'entrada' ? '#16A34A' : '#DC2626';

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setValue('descricao', categoryToEdit.descricao);
        setSelectedIcon(categoryToEdit.icon_key || '');
        setKeywords(categoryToEdit.keywords || []);
      } else {
        reset({ descricao: "" });
        setSelectedIcon('');
        setKeywords([]);
      }
      setKeywordInput('');
    }
  }, [isOpen, categoryToEdit, reset, setValue]);

  // Sugerir ícone automaticamente quando digitar
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('descricao', value);
    
    // Se não tem ícone selecionado e está digitando, sugerir
    if (!selectedIcon && value.length > 2) {
      const suggested = suggestIcon(value, type);
      setSelectedIcon(suggested);
    }
  };

  // Adicionar keyword
  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput('');
    }
  };

  // Remover keyword
  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  // Adicionar keyword ao pressionar Enter
  const handleKeywordKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const onSubmit = async (data: CategoryFormValues) => {
    if (!profile) return;

    try {
      const supabase = createClient();
      const categoryData = {
        descricao: data.descricao,
        tipo: type,
        usuario_id: profile.id,
        icon_key: selectedIcon || null,
        tipo_conta: accountFilter,
        keywords: keywords,
      };

      let error;

      if (categoryToEdit) {
        const { error: updateError } = await supabase
          .from('categoria_trasacoes')
          .update(categoryData)
          .eq('id', categoryToEdit.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('categoria_trasacoes')
          .insert([categoryData]);
        error = insertError;
      }

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      alert('Erro ao salvar. Tente novamente.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoryToEdit ? t('categories.modal.editTitle') : t('categories.modal.newTitle')}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Aviso de Contexto: Conta Pessoal/PJ + Tipo */}
        <div className="flex flex-col items-center gap-2 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              {accountFilter === 'pessoal' ? `👤 ${t('categories.modal.contextPersonal')}` : `🏢 ${t('categories.modal.contextPJ')}`}
            </span>
            <span className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold",
              type === 'entrada'
                ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30"
                : "bg-red-500/10 text-red-500 border border-red-500/30"
            )}>
              {type === 'entrada' ? t('categories.modal.typeIncome') : t('categories.modal.typeExpense')}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 text-center">
            {t('categories.modal.willBeCreatedFor')} {accountFilter === 'pessoal' ? t('categories.modal.contextUsagePersonal') : t('categories.modal.contextUsagePJ')}
          </p>
        </div>

        {/* Nome da Categoria */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">
            {t('categories.modal.categoryName')} <span className="text-red-400">*</span>
          </label>
          <Input
            {...register("descricao")}
            onChange={handleDescriptionChange}
            placeholder={type === 'entrada' ? t('categories.modal.placeholderIncome') : t('categories.modal.placeholderExpense')}
            className="bg-[#0A0F1C] border-white/10 text-white placeholder:text-zinc-500 h-11"
            style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
            onFocus={(e) => e.target.style.borderColor = accentColor}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
          />
          {errors.descricao && (
            <p className="text-xs text-red-400">{errors.descricao.message}</p>
          )}
        </div>

        {/* Seletor de Ícones */}
        <IconSelector
          selectedIcon={selectedIcon}
          onSelectIcon={setSelectedIcon}
          accentColor={accentColor}
        />

        {/* Palavras-chave para IA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white">
              {t('categories.modal.keywordsLabel')}
            </label>
            <span className="text-xs text-zinc-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              🤖 IA
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {t('categories.modal.keywordsDescription')}
          </p>

          {/* Keywords Tags */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-[#0A0F1C] border border-white/5 rounded-lg">
              {keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded-full border border-white/10 hover:border-red-500/30 transition-colors group"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input para adicionar keyword */}
          <div className="flex gap-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={handleKeywordKeyPress}
              placeholder={t('categories.modal.keywordPlaceholder')}
              className="flex-1 bg-[#0A0F1C] border-white/10 text-white placeholder:text-zinc-500 h-10 text-sm"
              style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              onFocus={(e) => e.target.style.borderColor = accentColor}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
            <Button
              type="button"
              onClick={handleAddKeyword}
              disabled={!keywordInput.trim()}
              className="px-4 text-white font-medium text-sm"
              style={{ backgroundColor: accentColor }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentColorHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = accentColor}
            >
              {t('categories.modal.addKeyword')}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
          <Button
            type="button"
            onClick={onClose}
            className="px-6 bg-transparent border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-6 text-white font-medium"
            style={{ backgroundColor: accentColor }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentColorHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = accentColor}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {categoryToEdit ? t('common.save') : t('categories.modal.createButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
