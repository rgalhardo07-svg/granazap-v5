"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { useCategoriesQuery } from "@/hooks/use-categories-query";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";

const locales = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES'
};

const transactionSchemaBase = z.object({
  tipo: z.enum(['entrada', 'saida']),
  descricao: z.string(),
  valor: z.string(),
  categoria_id: z.string(),
  data: z.string(),
});

type TransactionFormValues = z.infer<typeof transactionSchemaBase>;

interface AllTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transactionToEdit?: any;
}

export function AllTransactionsModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  transactionToEdit 
}: AllTransactionsModalProps) {
  const { t, language } = useLanguage();
  const { getCurrencySymbol } = useCurrency();
  const { profile } = useUser();
  const { filter: accountFilter } = useAccountFilter();
  
  const [selectedType, setSelectedType] = useState<'entrada' | 'saida'>('entrada');
  const { categories: allCategories, loading: loadingCategories } = useCategoriesQuery();
  const categories = allCategories.filter(c => c.tipo === selectedType);
  
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [valorDisplay, setValorDisplay] = useState("");

  const transactionSchema = useMemo(() => z.object({
    tipo: z.enum(['entrada', 'saida']),
    descricao: z.string().min(1, t('validation.descriptionRequired')),
    valor: z.string().min(1, t('validation.valueRequired')),
    categoria_id: z.string().min(1, t('validation.categoryRequired')),
    data: z.string().min(1, t('validation.dateRequired')),
  }), [t]);
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      tipo: 'entrada',
      descricao: "",
      valor: "",
      categoria_id: "",
      data: new Date().toISOString().split('T')[0],
    },
  });

  const selectedCategory = watch("categoria_id");
  const tipo = watch("tipo");

  // Definir cor baseada no tipo
  const accentColor = tipo === 'entrada' ? '#22C55E' : '#EF4444';
  const accentColorHover = tipo === 'entrada' ? '#16A34A' : '#DC2626';

  // Formatar valor como moeda baseada no idioma
  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString(locales[language], {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setValorDisplay(formatted);
    // Salva o valor numérico puro no form como string "1234.56"
    // Remove formatting characters to store raw number string
    const rawValue = e.target.value.replace(/\D/g, '');
    const amount = parseFloat(rawValue) / 100;
    setValue('valor', amount.toString());
  };

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setValue('tipo', transactionToEdit.tipo);
        setSelectedType(transactionToEdit.tipo);
        setValue('descricao', transactionToEdit.descricao);
        const valorFormatado = parseFloat(transactionToEdit.valor).toLocaleString(locales[language], {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        setValorDisplay(valorFormatado);
        setValue('valor', String(transactionToEdit.valor));
        setValue('categoria_id', String(transactionToEdit.categoria_id));
        const dataStr = transactionToEdit.data.split('T')[0];
        setValue('data', dataStr);
      } else {
        reset({
          tipo: 'entrada',
          descricao: "",
          valor: "",
          categoria_id: "",
          data: new Date().toISOString().split('T')[0],
        });
        setSelectedType('entrada');
        setValorDisplay("");
      }
      setShowNewCategory(false);
      setNewCategoryName("");
    }
  }, [isOpen, transactionToEdit, reset, setValue, language, locales]);

  // Atualizar tipo selecionado quando mudar no form
  useEffect(() => {
    setSelectedType(tipo);
  }, [tipo]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !profile) return;

    try {
      setCreatingCategory(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('categoria_trasacoes')
        .insert([{
          descricao: newCategoryName.trim(),
          usuario_id: profile.id,
          tipo: selectedType,
          tipo_conta: accountFilter,
        }])
        .select()
        .single();

      if (error) throw error;

      setValue('categoria_id', String(data.id));
      setShowNewCategory(false);
      setNewCategoryName("");
      window.dispatchEvent(new CustomEvent('categoriesChanged'));
    } catch (error) {
      alert(t('validation.errorCreatingCategory'));
    } finally {
      setCreatingCategory(false);
    }
  };

  const onSubmit = async (data: TransactionFormValues) => {
    if (!profile) return;

    try {
      const supabase = createClient();
      const mesFormatado = data.data.substring(0, 7);
      const dataFormatada = `${data.data}T00:00:00`;
      
      const transactionData = {
        descricao: data.descricao,
        valor: parseFloat(data.valor), // data.valor is already "1234.56" string
        categoria_id: parseInt(data.categoria_id),
        data: dataFormatada,
        mes: mesFormatado,
        tipo: data.tipo,
        tipo_conta: accountFilter,
        usuario_id: profile.id,
      };

      let error;

      if (transactionToEdit) {
        const { error: updateError } = await supabase
          .from('transacoes')
          .update(transactionData)
          .eq('id', transactionToEdit.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('transacoes')
          .insert([transactionData]);
        error = insertError;
      }

      if (error) {
        throw error;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      alert(`${t('validation.errorSaving')}: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit 
        ? (transactionToEdit.tipo === 'entrada' ? t('modal.editIncome') : t('modal.editExpense'))
        : (transactionToEdit?.tipo === 'entrada' ? t('modal.newIncome') : t('modal.newExpense'))
      }
      // I don't have these keys. I'll use hardcoded for now or add them.
      // Wait, I have 'modal.deleteTitle': 'Excluir Transação'.
      // I'll stick to dynamic based on type:
      // title={transactionToEdit ? t(tipo === 'entrada' ? 'modal.editIncome' : 'modal.editExpense') : t(tipo === 'entrada' ? 'modal.newIncome' : 'modal.newExpense')}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tipo de Transação */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">
            {t('form.type')} <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setValue('tipo', 'entrada');
                setValue('categoria_id', ''); // Reset categoria
              }}
              className={cn(
                "px-4 py-3 rounded-lg text-sm font-medium transition-all border-2",
                tipo === 'entrada'
                  ? "bg-[#22C55E]/10 border-[#22C55E] text-[#22C55E]"
                  : "bg-[#0A0F1C] border-white/10 text-zinc-400 hover:border-white/20"
              )}
            >
              💰 {t('categories.modal.typeIncome')}
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('tipo', 'saida');
                setValue('categoria_id', ''); // Reset categoria
              }}
              className={cn(
                "px-4 py-3 rounded-lg text-sm font-medium transition-all border-2",
                tipo === 'saida'
                  ? "bg-red-500/10 border-red-500 text-red-500"
                  : "bg-[#0A0F1C] border-white/10 text-zinc-400 hover:border-white/20"
              )}
            >
              💸 {t('categories.modal.typeExpense')}
            </button>
          </div>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">
            {t('form.description')} <span className="text-red-400">*</span>
          </label>
          <Input
            {...register("descricao")}
            placeholder={tipo === 'entrada' ? t('form.placeholderIncome') : t('form.placeholderExpense')}
            className="bg-[#0A0F1C] border-white/10 text-white placeholder:text-zinc-500 h-11"
          />
          {errors.descricao && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              {errors.descricao.message}
            </p>
          )}
        </div>

        {/* Valor e Data */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              {t('form.value')} ({getCurrencySymbol()}) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold"
                style={{ color: accentColor }}
              >
                {getCurrencySymbol()}
              </span>
              <input
                type="text"
                value={valorDisplay}
                onChange={handleValorChange}
                placeholder="0,00"
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0A0F1C] border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none transition-colors font-mono text-lg"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                onFocus={(e) => e.target.style.borderColor = accentColor}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>
            {errors.valor && (
              <p className="text-xs text-red-400">{errors.valor.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              {t('form.date')} <span className="text-red-400">*</span>
            </label>
            <input
              {...register("data")}
              type="date"
              className="w-full h-11 px-4 rounded-lg bg-[#0A0F1C] border border-white/10 text-white transition-colors [color-scheme:dark]"
              style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              onFocus={(e) => e.target.style.borderColor = accentColor}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
            {errors.data && (
              <p className="text-xs text-red-400">{errors.data.message}</p>
            )}
          </div>
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white">
              {t('form.category')} <span className="text-red-400">*</span>
            </label>
            {!showNewCategory && (
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
                className="text-xs font-medium flex items-center gap-1 transition-colors"
                style={{ color: accentColor }}
                onMouseEnter={(e) => e.currentTarget.style.color = accentColorHover}
                onMouseLeave={(e) => e.currentTarget.style.color = accentColor}
              >
                <Plus className="w-3 h-3" />
                {t('form.newCategory')}
              </button>
            )}
          </div>

          {showNewCategory ? (
            <div className="space-y-3 p-4 bg-[#0A0F1C] border border-white/10 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">{t('form.createCategory')}</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategory(false);
                    setNewCategoryName("");
                  }}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t('form.categoryName')}
                  className="bg-[#111827] border-white/10 text-white flex-1 h-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateCategory();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim() || creatingCategory}
                  className="text-white h-10 px-4"
                  style={{ backgroundColor: accentColor }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentColorHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = accentColor}
                >
                  {creatingCategory ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t('common.create')
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <select
                {...register("categoria_id")}
                disabled={loadingCategories}
                className={cn(
                  "w-full h-11 px-4 rounded-lg bg-[#0A0F1C] border border-white/10 text-sm text-white",
                  "focus:outline-none transition-colors",
                  "appearance-none cursor-pointer",
                  !selectedCategory && "text-zinc-500"
                )}
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                onFocus={(e) => e.target.style.borderColor = accentColor}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              >
                <option value="" className="text-zinc-500">
                  {loadingCategories ? t('common.loading') : t('form.selectCategory')}
                </option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="text-white bg-[#111827]">
                    {cat.descricao}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
          {errors.categoria_id && (
            <p className="text-xs text-red-400">{errors.categoria_id.message}</p>
          )}
        </div>

        {/* Info Box */}
        <div className={cn(
          "rounded-lg p-4 border-2",
          accountFilter === 'pessoal'
            ? "bg-blue-500/10 border-blue-500/30"
            : "bg-purple-500/10 border-purple-500/30"
        )}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {accountFilter === 'pessoal' ? '👤' : '🏢'}
            </span>
            <p className={cn(
              "text-sm font-semibold",
              accountFilter === 'pessoal' ? "text-blue-400" : "text-purple-400"
            )}>
              {accountFilter === 'pessoal' 
                ? t('cards.modal.contextUsagePersonal')
                : t('cards.modal.contextUsagePJ')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
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
            {transactionToEdit ? t('common.save') : t('common.add')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
