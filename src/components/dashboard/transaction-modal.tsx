"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { useCategoriesQuery } from "@/hooks/use-categories-query";
import { useAccounts } from "@/hooks/use-accounts";
import { useCreditCards } from "@/hooks/use-credit-cards";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, X, Wallet, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";
import { CreditCardSuccessModal } from "./credit-card-success-modal";

const locales = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES'
};

const transactionSchemaBase = z.object({
  descricao: z.string(),
  valor: z.string(),
  categoria_id: z.string(),
  data: z.string(),
  conta_id: z.string().optional(),
  forma_pagamento: z.enum(['dinheiro', 'debito', 'credito']).optional(),
  cartao_id: z.string().optional(),
  parcelas: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchemaBase>;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: 'receita' | 'despesa';
  transactionToEdit?: any;
  preSelectedCardId?: string;
}

export function TransactionModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  type,
  transactionToEdit,
  preSelectedCardId
}: TransactionModalProps) {
  const { t, language } = useLanguage();
  const { getCurrencySymbol } = useCurrency();
  const { profile } = useUser();
  const { filter: accountFilter } = useAccountFilter();
  const { categories: allCategories, loading: loadingCategories } = useCategoriesQuery();
  const { accounts, loading: loadingAccounts } = useAccounts(accountFilter);
  const { cards } = useCreditCards();
  
  const transactionSchema = useMemo(() => z.object({
    descricao: z.string().min(1, t('validation.descriptionRequired')),
    valor: z.string().min(1, t('validation.valueRequired')),
    categoria_id: z.string().min(1, t('validation.categoryRequired')),
    data: z.string().min(1, t('validation.dateRequired')),
    conta_id: z.string().optional(),
    forma_pagamento: z.enum(['dinheiro', 'debito', 'credito']).optional(),
    cartao_id: z.string().optional(),
    parcelas: z.string().optional(),
  }), [t]);
  
  const categories = allCategories.filter(c => c.tipo === (type === 'receita' ? 'entrada' : 'saida'));
  
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [valorDisplay, setValorDisplay] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'debito' | 'credito'>('dinheiro');
  const [parcelado, setParcelado] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [installmentData, setInstallmentData] = useState<{
    description: string;
    totalValue: number;
    installments: number;
    installmentValue: number;
    cardName: string;
    firstDueDate: Date;
  } | null>(null);
  
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
      descricao: "",
      valor: "",
      categoria_id: "",
      data: new Date().toISOString().split('T')[0],
      conta_id: "",
      forma_pagamento: 'dinheiro',
      cartao_id: "",
      parcelas: "1",
    },
  });

  const selectedCategory = watch("categoria_id");
  const selectedAccount = watch("conta_id");

  // Definir cor baseada no tipo (receita = verde, despesa = vermelho)
  const accentColor = type === 'receita' ? '#22C55E' : '#EF4444';
  const accentColorHover = type === 'receita' ? '#16A34A' : '#DC2626';

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo exceto números
    const numbers = e.target.value.replace(/\D/g, '');
    
    if (!numbers) {
      setValorDisplay('');
      setValue('valor', '');
      return;
    }
    
    // Converte para número e divide por 100 (centavos)
    const amount = parseFloat(numbers) / 100;
    
    // Formata como moeda baseada no idioma
    const formatted = amount.toLocaleString(locales[language], {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    setValorDisplay(formatted);
    // Salva o valor numérico puro no form como string "1234.56"
    setValue('valor', amount.toString());
  };

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setValue('descricao', transactionToEdit.descricao);
        const valorFormatado = parseFloat(transactionToEdit.valor).toLocaleString(locales[language], {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        setValorDisplay(valorFormatado);
        setValue('valor', String(transactionToEdit.valor));
        setValue('categoria_id', String(transactionToEdit.categoria_id));
        // Extrair apenas a parte da data (YYYY-MM-DD) ignorando timezone
        const dataStr = transactionToEdit.data.split('T')[0];
        setValue('data', dataStr);
        setValue('conta_id', transactionToEdit.conta_id || "");
      } else {
        // Tentar encontrar uma conta padrão para pré-selecionar
        const defaultAccount = accounts.find(acc => acc.is_default);
        
        reset({
          descricao: "",
          valor: "",
          categoria_id: "",
          data: new Date().toISOString().split('T')[0],
          conta_id: defaultAccount ? defaultAccount.id : "",
        });
        setValorDisplay("");
        
        // Se preSelectedCardId for fornecido, pré-selecionar cartão de crédito
        if (preSelectedCardId && type === 'despesa') {
          setFormaPagamento('credito');
          setValue('forma_pagamento', 'credito');
          setValue('cartao_id', preSelectedCardId);
          setParcelado(false);
          setValue('parcelas', '1');
        }
      }
      setShowNewCategory(false);
      setNewCategoryName("");
    }
  }, [isOpen, transactionToEdit, reset, setValue, accounts, language, locales, preSelectedCardId, type]);

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
          tipo: type === 'receita' ? 'entrada' : 'saida',
          tipo_conta: accountFilter,
        }])
        .select()
        .single();

      if (error) throw error;

      // Selecionar a nova categoria automaticamente
      setValue('categoria_id', String(data.id));
      setShowNewCategory(false);
      setNewCategoryName("");
      
      // Recarregar categorias sem fechar o modal
      // Disparar evento para forçar refresh do hook useCategories
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
      // data.valor já deve estar em formato numérico string "1234.56" devido ao novo handler
      // Mas se veio do edit sem alteração, já é string numérica também.
      // Se tiver problemas, garantir parseFloat
      const valor = parseFloat(data.valor);
      
      // Se for cartão de crédito, criar lançamentos futuros
      if (formaPagamento === 'credito' && data.cartao_id && type === 'despesa') {
        const numeroParcelas = parseInt(data.parcelas || '1');
        const valorParcela = valor / numeroParcelas;
        
        // Buscar informações do cartão para calcular fatura correta
        const cartaoSelecionado = cards.find(c => c.id === data.cartao_id);
        if (!cartaoSelecionado) {
          alert(t('validation.cardNotFound'));
          return;
        }
        
        // Criar lançamentos futuros (parcelas)
        const lancamentos = [];
        
        // Calcular a data da primeira parcela considerando o fechamento
        const dataCompra = new Date(data.data);
        const diaCompra = dataCompra.getDate();
        let dataPrimeiraParcela = new Date(dataCompra);
        
        // Se comprou depois do fechamento, primeira parcela vai para próximo mês
        if (diaCompra > cartaoSelecionado.dia_fechamento) {
          dataPrimeiraParcela.setMonth(dataPrimeiraParcela.getMonth() + 1);
        }
        
        // Ajustar para o dia de vencimento
        dataPrimeiraParcela.setDate(cartaoSelecionado.dia_vencimento);
        
        // Criar cada parcela a partir da primeira
        for (let i = 0; i < numeroParcelas; i++) {
          const dataFatura = new Date(dataPrimeiraParcela);
          dataFatura.setMonth(dataPrimeiraParcela.getMonth() + i);
          
          lancamentos.push({
            usuario_id: profile.id,
            dependente_id: profile.is_dependente ? profile.dependente_id : null, // Adicionar dependente_id
            tipo: 'saida',
            valor: valorParcela,
            descricao: numeroParcelas > 1 
              ? `${data.descricao} (${i + 1}/${numeroParcelas})`
              : data.descricao,
            categoria_id: parseInt(data.categoria_id),
            data_prevista: dataFatura.toISOString().split('T')[0],
            mes_previsto: dataFatura.toISOString().slice(0, 7),
            status: 'pendente',
            cartao_id: data.cartao_id,
            parcela_info: {
              numero: i + 1,
              total: numeroParcelas,
              valor_original: valor,
            },
            tipo_conta: accountFilter,
          });
        }
        
        const { error } = await supabase
          .from('lancamentos_futuros')
          .insert(lancamentos);
          
        if (error) throw error;
        
        // Disparar evento de atualização de lançamentos futuros
        window.dispatchEvent(new CustomEvent('futureTransactionsChanged'));
        
        // Preparar dados para o modal de sucesso
        setInstallmentData({
          description: data.descricao,
          totalValue: valor,
          installments: numeroParcelas,
          installmentValue: valorParcela,
          cardName: cartaoSelecionado.nome,
          firstDueDate: dataPrimeiraParcela
        });
        
        // Mostrar modal de sucesso
        setIsSuccessModalOpen(true);
      } else {
        // Transação normal (dinheiro ou débito)
        const mesFormatado = data.data.substring(0, 7);
        const dataFormatada = `${data.data}T00:00:00`;
        
        const transactionData = {
          descricao: data.descricao,
          valor,
          categoria_id: parseInt(data.categoria_id),
          data: dataFormatada,
          mes: mesFormatado,
          tipo: type === 'receita' ? 'entrada' : 'saida',
          tipo_conta: accountFilter,
          usuario_id: profile.id,
          dependente_id: profile.is_dependente ? profile.dependente_id : null, // Adicionar dependente_id
          conta_id: data.conta_id || null,
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

        if (error) throw error;
      }

      // Disparar eventos de atualização
      window.dispatchEvent(new CustomEvent('creditCardsChanged'));
      window.dispatchEvent(new CustomEvent('transactionsChanged'));
      window.dispatchEvent(new CustomEvent('futureTransactionsChanged'));
      
      // Se não for cartão de crédito, fechar modal normalmente
      if (formaPagamento !== 'credito') {
        onSuccess();
        onClose();
      }
      // Se for cartão, o modal de sucesso já foi aberto e vai chamar onSuccess/onClose
    } catch (error: any) {
      alert(`${t('validation.errorSaving')}: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? t(type === 'receita' ? 'modal.editIncome' : 'modal.editExpense') : t(type === 'receita' ? 'modal.newIncome' : 'modal.newExpense')}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Descrição */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">
            {t('form.description')} <span className="text-red-400">*</span>
          </label>
          <Input
            {...register("descricao")}
            placeholder={t(type === 'receita' ? 'form.placeholderIncome' : 'form.placeholderExpense')}
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
              {t('form.value')} <span className="text-red-400">*</span>
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
                style={{ 
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  '--focus-color': accentColor 
                } as React.CSSProperties}
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
                  style={{ 
                    backgroundColor: accentColor,
                  }}
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

        {/* Conta Bancária */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white flex items-center justify-between">
            {t('form.account')}
            <span className="text-xs font-normal text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
              {accountFilter === 'pessoal' ? t('sidebar.personal') : t('sidebar.pj')} {t('form.optional')}
            </span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              <Wallet className="w-4 h-4" />
            </div>
            <select
              {...register("conta_id")}
              disabled={loadingAccounts}
              className={cn(
                "w-full h-11 pl-10 pr-4 rounded-lg bg-[#0A0F1C] border border-white/10 text-sm text-white",
                "focus:outline-none transition-colors",
                "appearance-none cursor-pointer",
                !selectedAccount && "text-zinc-500"
              )}
              style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              onFocus={(e) => e.target.style.borderColor = accentColor}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            >
              <option value="" className="text-zinc-500">
                {loadingAccounts ? t('common.loading') : t('form.noAccount')}
              </option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} className="text-white bg-[#111827]">
                  {acc.nome} {acc.saldo_atual !== undefined ? `(${getCurrencySymbol()} ${acc.saldo_atual.toLocaleString(locales[language], { minimumFractionDigits: 2 })})` : ''}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 pl-1">
            {t(type === 'receita' ? 'form.accountHintIncome' : 'form.accountHintExpense')}
          </p>
        </div>

        {/* Forma de Pagamento (só para despesas) */}
        {type === 'despesa' && !transactionToEdit && (
          <div className="space-y-4 p-4 bg-[#0A0F1C] border border-white/10 rounded-lg">
            <label className="text-sm font-medium text-white">
              {t('form.paymentMethod')}
            </label>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormaPagamento('dinheiro');
                  setValue('forma_pagamento', 'dinheiro');
                }}
                className={cn(
                  "px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium",
                  formaPagamento === 'dinheiro'
                    ? "border-purple-500 bg-purple-500/10 text-purple-400"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
                )}
              >
                💵 {t('form.money')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormaPagamento('debito');
                  setValue('forma_pagamento', 'debito');
                }}
                className={cn(
                  "px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium",
                  formaPagamento === 'debito'
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
                )}
              >
                🏦 {t('form.debit')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormaPagamento('credito');
                  setValue('forma_pagamento', 'credito');
                }}
                className={cn(
                  "px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium",
                  formaPagamento === 'credito'
                    ? "border-green-500 bg-green-500/10 text-green-400"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
                )}
              >
                💳 {t('form.credit')}
              </button>
            </div>

            {/* Se for cartão de crédito */}
            {formaPagamento === 'credito' && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                {/* Seleção de Cartão */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    {t('form.creditCard')} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <select
                      {...register("cartao_id")}
                      className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#111827] border border-white/10 text-sm text-white focus:outline-none focus:border-green-500 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="">{t('form.selectCard')}</option>
                      {cards.map(card => (
                        <option key={card.id} value={card.id} className="text-white bg-[#111827]">
                          {card.nome} - Limite: {getCurrencySymbol()} {card.limite_total.toLocaleString(locales[language], { minimumFractionDigits: 2 })}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Parcelamento */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    {t('form.installments')}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setParcelado(false);
                        setValue('parcelas', '1');
                      }}
                      className={cn(
                        "flex-1 px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium",
                        !parcelado
                          ? "border-green-500 bg-green-500/10 text-green-400"
                          : "border-white/10 bg-white/5 text-zinc-400"
                      )}
                    >
                      {t('form.cash')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setParcelado(true)}
                      className={cn(
                        "flex-1 px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium",
                        parcelado
                          ? "border-green-500 bg-green-500/10 text-green-400"
                          : "border-white/10 bg-white/5 text-zinc-400"
                      )}
                    >
                      {t('form.installment')}
                    </button>
                  </div>
                </div>

                {/* Número de Parcelas */}
                {parcelado && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                      {t('form.installmentsCount')}
                    </label>
                    <select
                      {...register("parcelas")}
                      className="w-full h-11 px-4 rounded-lg bg-[#111827] border border-white/10 text-sm text-white focus:outline-none focus:border-green-500 transition-colors appearance-none cursor-pointer"
                    >
                      {[...Array(12)].map((_, i) => {
                        const parcela = i + 1;
                        const valorParcela = valorDisplay ? 
                          (parseFloat(valorDisplay.replace(/\./g, '').replace(',', '.')) / parcela).toLocaleString(locales[language], { minimumFractionDigits: 2 }) 
                          : '0,00';
                        return (
                          <option key={parcela} value={parcela} className="text-white bg-[#111827]">
                            {parcela}x de {getCurrencySymbol()} {valorParcela}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <p className="text-xs text-zinc-500">
                  💡 {t('form.installmentHint')}
                </p>
              </div>
            )}
          </div>
        )}

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

      {/* Success Modal for Credit Card Transactions */}
      <CreditCardSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          setInstallmentData(null);
          onSuccess();
          onClose();
        }}
        installmentData={installmentData}
      />
    </Modal>
  );
}
