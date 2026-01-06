"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, DollarSign, AlertCircle, CreditCard as CreditCardIcon, Calendar, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { useAccounts } from "@/hooks/use-accounts";
import { useCardInvoice } from "@/hooks/use-card-invoice";
import type { CreditCard } from "@/hooks/use-credit-cards";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";

interface PayInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  card: CreditCard | null;
  invoiceTotal: number;
  invoiceMonth: string;
  isInvoiceClosed?: boolean;
  paymentMode?: 'total' | 'partial'; // NOVO - opcional para compatibilidade
  selectedItemIds?: number[]; // NOVO - opcional para compatibilidade
}

export function PayInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  card,
  invoiceTotal,
  invoiceMonth,
  isInvoiceClosed = true,
  paymentMode = 'total', // NOVO - padrão 'total' para compatibilidade
  selectedItemIds = [], // NOVO - padrão vazio para compatibilidade
}: PayInvoiceModalProps) {
  const { t, language } = useLanguage();
  const { formatCurrency: formatCurrencyFromContext } = useCurrency();
  const { profile } = useUser();
  const { filter: accountFilter } = useAccountFilter();
  const { accounts } = useAccounts(accountFilter);
  const { invoice } = useCardInvoice(card?.id || '', invoiceMonth);
  
  const [contaId, setContaId] = useState("");
  const [dataPagamento, setDataPagamento] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const isProcessingRef = useRef(false);

  const locales = {
    pt: 'pt-BR',
    en: 'en-US',
    es: 'es-ES'
  };

  useEffect(() => {
    if (card && card.conta_vinculada_id) {
      setContaId(card.conta_vinculada_id);
    } else if (accounts.length > 0) {
      const defaultAccount = accounts.find(a => a.is_default) || accounts[0];
      setContaId(defaultAccount.id);
    }
  }, [card, accounts]);

  // Resetar estados quando o modal fecha
  useEffect(() => {
    if (!isOpen) {
      setShowConfirmation(false);
      setShowSuccess(false);
      setLoading(false);
      isProcessingRef.current = false;
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !card) return;
    
    // Mostrar tela de confirmação primeiro
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    // Prevenir múltiplas chamadas simultâneas
    if (loading || isProcessingRef.current) {
      return;
    }
    
    isProcessingRef.current = true;
    setLoading(true);

    try {
      const supabase = createClient();

      // 🔒 SEGURANÇA: Escolher RPC baseada no modo de pagamento
      const rpcFunction = paymentMode === 'partial' 
        ? 'processar_pagamento_fatura_parcial'
        : 'processar_pagamento_fatura_segura';
      
      const rpcParams = paymentMode === 'partial'
        ? {
            p_cartao_id: card.id,
            p_conta_id: contaId,
            p_data_pagamento: dataPagamento,
            p_tipo_conta: accountFilter,
            p_lancamento_ids: selectedItemIds // Array de IDs selecionados
          }
        : {
            p_cartao_id: card.id,
            p_conta_id: contaId,
            p_mes_fatura: invoiceMonth,
            p_data_pagamento: dataPagamento,
            p_tipo_conta: accountFilter
          };
      
      const { data: resultado, error: pagamentoError } = await supabase
        .rpc(rpcFunction, rpcParams);

      if (pagamentoError) {
        throw new Error(`Erro ao processar pagamento: ${pagamentoError.message}`);
      }

      if (!resultado.success) {
        alert(resultado.error || 'Erro ao processar pagamento');
        setLoading(false);
        isProcessingRef.current = false;
        return;
      }

      // Disparar eventos para atualizar as listas
      window.dispatchEvent(new CustomEvent('creditCardsChanged'));
      window.dispatchEvent(new CustomEvent('accountsChanged'));
      window.dispatchEvent(new CustomEvent('transactionsChanged'));
      window.dispatchEvent(new CustomEvent('futureTransactionsChanged'));

      setShowSuccess(true);
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro desconhecido ao processar pagamento';
      alert(`Erro ao pagar fatura: ${errorMessage}`);
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  const formatCurrency = formatCurrencyFromContext;

  const getMonthName = () => {
    if (!invoiceMonth) return '';
    // Creating date object from "YYYY-MM" string, appending "-02" to avoid timezone issues with day 1
    const [year, month] = invoiceMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 2); 
    
    return date.toLocaleDateString(locales[language], {
      month: 'long',
      year: 'numeric',
    });
  };

  const selectedAccount = accounts.find(a => a.id === contaId);

  if (!isOpen || !card) return null;

  // Tela de sucesso
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#0F1419] border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
          <div className="p-6">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-1">{t('invoice.successTitle')}</h3>
                <p className="text-xs text-zinc-400 mb-3">
                  {t('invoice.successDesc')}
                </p>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-left">
                  <ul className="space-y-1.5 text-xs text-green-300">
                    <li className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{formatCurrency(invoiceTotal)} {t('invoice.discountFrom')} {selectedAccount?.nome}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{invoice?.items?.length || 0} {t('invoice.expensesEffective')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{t('invoice.limitReleased')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{t('invoice.historyRegistered')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-white/5">
            <button
              onClick={() => {
                setShowSuccess(false);
                onSuccess();
                onClose();
              }}
              className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium text-sm"
            >
              {t('invoice.close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de confirmação detalhada
  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#111827] border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 sticky top-0 bg-[#111827] z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
              </div>
              <h2 className="text-lg font-bold text-white">{t('invoice.confirmTitle')}</h2>
            </div>
            <button
              onClick={() => setShowConfirmation(false)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Resumo do Pagamento */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-yellow-400" />
                {t('invoice.summary')}
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-xs">{t('invoice.card')}:</span>
                  <span className="text-white font-medium">{card.nome}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-xs">{t('invoice.invoice')}:</span>
                  <span className="text-white font-medium capitalize text-xs">{getMonthName()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-xs">{t('invoice.account')}:</span>
                  <span className="text-white font-medium text-xs">{selectedAccount?.nome}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-xs">{t('invoice.date')}:</span>
                  <span className="text-white font-medium text-xs">
                    {new Date(dataPagamento).toLocaleDateString(locales[language])}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">
                    {paymentMode === 'partial' ? 'Total Selecionado:' : t('invoice.total')}:
                  </span>
                  <span className="text-xl font-bold text-green-400">{formatCurrency(invoiceTotal)}</span>
                </div>
              </div>
            </div>

            {/* Lista de Despesas */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <CreditCardIcon className="w-4 h-4 text-purple-400" />
                {paymentMode === 'partial' ? (
                  <span>Despesas Selecionadas ({selectedItemIds.length})</span>
                ) : (
                  <span>{t('invoice.expenses')} ({invoice?.items.filter(item => item.status === 'pendente').length || 0})</span>
                )}
              </h3>
              
              <div className="bg-[#0A0F1C] border border-white/5 rounded-lg divide-y divide-white/5 max-h-40 overflow-y-auto">
                {(paymentMode === 'partial' 
                  ? invoice?.items.filter(item => selectedItemIds.includes(item.id))
                  : invoice?.items.filter(item => item.status === 'pendente')
                )?.map((item, index) => (
                  <div key={item.id} className="p-2.5 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{item.descricao}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date(item.data_prevista).toLocaleDateString(locales[language], { day: '2-digit', month: '2-digit' })}
                          {item.parcela_info && (
                            <span className="ml-1 text-purple-400">
                              {item.parcela_info.numero}/{item.parcela_info.total}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-white font-semibold text-sm whitespace-nowrap">{formatCurrency(item.valor)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviso de Adiantamento */}
            {!isInvoiceClosed && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5">
                <div className="flex gap-2">
                  <Calendar className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-yellow-300">
                    <p className="font-semibold mb-0.5">📅 {t('invoice.earlyPayment')}</p>
                    <p className="text-yellow-400/90 leading-relaxed">
                      {t('invoice.earlyPaymentDesc')} {t('invoice.expiresOn')} <strong>{card?.dia_vencimento}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* O que vai acontecer */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-blue-300 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {t('invoice.whatHappens')}
              </h3>
              
              <div className="space-y-1.5 text-xs text-blue-200">
                <p className="leading-relaxed">
                  • <strong className="text-white">{formatCurrency(invoiceTotal)}</strong> {t('invoice.discountFrom')} <strong className="text-white">{selectedAccount?.nome}</strong>
                </p>
                <p className="leading-relaxed">
                  • {t('invoice.newBalance')}: <strong className="text-white">{formatCurrency((selectedAccount?.saldo_atual || 0) - invoiceTotal)}</strong>
                </p>
                <p className="leading-relaxed">
                  • <strong className="text-white">{paymentMode === 'partial' ? selectedItemIds.length : (invoice?.items.length || 0)}</strong> {t('invoice.expensesEffective')}
                </p>
                <p className="leading-relaxed">
                  • {t('invoice.limitReleased')}
                </p>
                <p className="leading-relaxed">
                  • {t('invoice.historyRegistered')}
                </p>
              </div>
            </div>

            {/* Aviso Importante */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-300">
                  <p className="font-semibold">⚠️ {t('invoice.irreversible')}</p>
                  <p className="text-red-400/90 mt-0.5 leading-relaxed">
                    {t('invoice.immediateProcess')}
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm font-medium"
              >
                ← {t('invoice.back')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                {loading ? t('invoice.processing') : `✓ ${t('invoice.confirm')}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela inicial de dados
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111827] border border-white/10 rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white">{t('invoice.payTitle')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Info Resumida */}
          <div className="bg-[#0A0F1C] border border-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">{t('invoice.card')}</p>
                <p className="text-white font-medium text-sm">{card.nome}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400">{t('invoice.amount')}</p>
                <p className="text-lg font-bold text-green-400">{formatCurrency(invoiceTotal)}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              {t('invoice.monthInvoice')} {getMonthName()}
            </p>
          </div>

          {/* Conta e Data */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                {t('invoice.payWithAccount')} *
              </label>
              <select
                value={contaId}
                onChange={(e) => setContaId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#0A0F1C] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                <option value="">{t('invoice.selectAccount')}</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.nome} - {formatCurrency(account.saldo_atual)}
                  </option>
                ))}
              </select>
              {selectedAccount && (
                <p className="text-xs text-zinc-500 mt-1">
                  {t('invoice.balanceAfter')}: {formatCurrency(selectedAccount.saldo_atual - invoiceTotal)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                {t('invoice.paymentDate')} *
              </label>
              <input
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#0A0F1C] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>
          </div>

          {/* Aviso Compacto */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-300">
                <p className="font-medium mb-1">{t('invoice.confirmAction')}</p>
                <p className="text-blue-400/80 leading-relaxed">
                  {t('invoice.confirmImpact')}
                </p>
              </div>
            </div>
          </div>

          {/* Alerta de saldo insuficiente */}
          {selectedAccount && selectedAccount.saldo_atual < invoiceTotal && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">
                  {t('invoice.insufficientBalance')} {formatCurrency(invoiceTotal - selectedAccount.saldo_atual)}
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !selectedAccount || selectedAccount.saldo_atual < invoiceTotal}
              className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('invoice.processing') : `${t('invoice.review')} →`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
