"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, CreditCard as CreditCardIcon, Calendar, DollarSign, ChevronLeft, ChevronRight, Pencil, Trash2, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCardInvoice } from "@/hooks/use-card-invoice";
import { PayInvoiceModal } from "./pay-invoice-modal";
import { ReversePaymentModal } from "./reverse-payment-modal";
import { TransactionModal } from "./transaction-modal";
import { FutureTransactionModal } from "./future-transaction-modal";
import { DeleteFutureConfirmationModal } from "./delete-future-confirmation-modal";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";
import type { CreditCard } from "@/hooks/use-credit-cards";

interface CardDetailsPageProps {
  cardId: string;
}

export function CardDetailsPage({ cardId }: CardDetailsPageProps) {
  const { t, language } = useLanguage();
  const { formatCurrency: formatCurrencyFromContext } = useCurrency();
  const router = useRouter();
  const [card, setCard] = useState<CreditCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  // Controle de mês selecionado
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // Controle de pagamento parcial (NOVO - não afeta funcionalidade existente)
  const [paymentMode, setPaymentMode] = useState<'total' | 'partial'>('total');
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const { invoice, loading: invoiceLoading, refetch: refetchInvoice } = useCardInvoice(cardId, selectedMonth);

  useEffect(() => {
    if (!cardId) {
      router.push('/dashboard/cartoes');
      return;
    }

    const fetchCard = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('cartoes_credito')
        .select('*')
        .eq('id', cardId)
        .single();

      if (error) {
        router.push('/dashboard/cartoes');
        return;
      }

      setCard(data);
      setLoading(false);
    };

    fetchCard();
  }, [cardId, router]);

  const formatCurrency = formatCurrencyFromContext;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
  };

  const handlePreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 2, 1); // -2 porque month é 1-indexed
    setSelectedMonth(newDate.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month, 1); // month já avança 1
    setSelectedMonth(newDate.toISOString().slice(0, 7));
  };

  const isCurrentMonth = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return selectedMonth === currentMonth;
  };

  // Funções para pagamento parcial (NOVO)
  const handleToggleItemSelection = (itemId: number) => {
    setSelectedItemIds(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (!invoice) return;
    const pendingIds = invoice.items
      .filter(item => item.status === 'pendente')
      .map(item => item.id);
    setSelectedItemIds(pendingIds);
  };

  const handleDeselectAll = () => {
    setSelectedItemIds([]);
  };

  const calculateSelectedTotal = () => {
    if (!invoice) return 0;
    return invoice.items
      .filter(item => selectedItemIds.includes(item.id))
      .reduce((sum, item) => sum + Number(item.valor), 0);
  };

  // Resetar seleção ao trocar de modo ou mês
  useEffect(() => {
    setSelectedItemIds([]);
  }, [paymentMode, selectedMonth]);

  const handleExportInvoice = async () => {
    if (!invoice || !card) return;

    // Importação dinâmica do jsPDF
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF();
    
    // Cores
    const primaryColor: [number, number, number] = [34, 197, 94];
    const darkBg: [number, number, number] = [17, 24, 39];
    const textColor: [number, number, number] = [255, 255, 255];

    // Cabeçalho
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('FATURA DO CARTÃO', 105, 20, { align: 'center' });
    
    doc.setTextColor(...textColor);
    doc.setFontSize(16);
    doc.text(card.nome, 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(getMonthName(selectedMonth).toUpperCase(), 105, 40, { align: 'center' });

    // Informações da fatura
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    let yPos = 60;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Fechamento:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dia ${card.dia_fechamento}`, 60, yPos);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Vencimento:', 110, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dia ${card.dia_vencimento}`, 150, yPos);
    
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total da Fatura:', 20, yPos);
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.text(formatCurrency(invoice.total), 70, yPos);

    // Tabela de itens - manual
    yPos += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    // Cabeçalho da tabela
    doc.setFillColor(...primaryColor);
    doc.rect(20, yPos - 5, 170, 8, 'F');
    doc.setTextColor(...textColor);
    doc.text('Data', 25, yPos);
    doc.text('Descrição', 50, yPos);
    doc.text('Parcela', 120, yPos);
    doc.text('Valor', 145, yPos);
    doc.text('Status', 170, yPos);
    
    // Itens
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    invoice.items.forEach((item, index) => {
      // Alternar cor de fundo
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(20, yPos - 4, 170, 7, 'F');
      }
      
      doc.text(formatDate(item.data_prevista), 25, yPos);
      
      // Truncar descrição se muito longa
      const desc = item.descricao.length > 25 ? item.descricao.substring(0, 22) + '...' : item.descricao;
      doc.text(desc, 50, yPos);
      
      const parcela = item.parcela_info ? `${item.parcela_info.numero}/${item.parcela_info.total}` : '-';
      doc.text(parcela, 120, yPos);
      
      doc.text(formatCurrency(Number(item.valor)), 145, yPos);
      doc.text(item.status === 'pago' ? 'Pago' : 'Pendente', 170, yPos);
      
      yPos += 7;
      
      // Nova página se necessário
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });

    // Rodapé com resumo
    yPos += 10;
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFillColor(245, 245, 245);
    doc.rect(20, yPos, 170, 25, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Resumo:', 25, yPos + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total de itens: ${invoice.items.length}`, 25, yPos + 15);
    doc.text(`Itens pagos: ${invoice.items.filter(i => i.status === 'pago').length}`, 25, yPos + 21);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', 130, yPos + 15);
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.text(formatCurrency(invoice.total), 185, yPos + 15, { align: 'right' });

    // Salvar PDF
    const fileName = `fatura_${card.nome.replace(/\s+/g, '_')}_${selectedMonth}.pdf`;
    doc.save(fileName);
  };

  const isInvoiceClosed = () => {
    if (!card) return false;
    
    const today = new Date();
    const currentDay = today.getDate();
    const [year, month] = selectedMonth.split('-').map(Number);
    const invoiceDate = new Date(year, month - 1, 1);
    const currentYearMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Se for mês futuro, fatura ainda não fechou
    if (invoiceDate > currentYearMonth) {
      return false;
    }
    
    // Se for mês atual, verifica se já passou o dia de fechamento
    if (invoiceDate.getTime() === currentYearMonth.getTime()) {
      return currentDay > card.dia_fechamento;
    }
    
    // Se for mês passado, já fechou
    return true;
  };

  if (loading || !card) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  const limiteUsadoPercent = invoice ? (invoice.limite_usado / card.limite_total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/cartoes')}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{card.nome}</h1>
          <p className="text-zinc-400 text-sm">
            {card.bandeira} {card.ultimos_digitos && `•••• ${card.ultimos_digitos}`}
          </p>
        </div>
      </div>

      {/* Card Visual + Limite */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Visual */}
        <div
          className="h-56 rounded-xl p-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${card.cor_cartao} 0%, ${card.cor_cartao}dd 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium mb-2">{card.bandeira}</p>
                <p className="text-white text-2xl font-bold">{card.nome}</p>
              </div>
              <CreditCardIcon className="w-10 h-10 text-white/40" />
            </div>
            <div>
              {card.ultimos_digitos && (
                <p className="text-white text-lg font-mono">
                  •••• •••• •••• {card.ultimos_digitos}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Limite Info */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('cardDetails.limit')}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{t('cardDetails.limitUsed')}</span>
              <span className="text-sm font-medium text-white">
                {limiteUsadoPercent.toFixed(1)}%
              </span>
            </div>
            
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  limiteUsadoPercent > 80 ? "bg-red-500" :
                  limiteUsadoPercent > 50 ? "bg-yellow-500" :
                  "bg-green-500"
                )}
                style={{ width: `${Math.min(limiteUsadoPercent, 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <p className="text-xs text-zinc-400 mb-1">{t('cardDetails.limitUsed')}</p>
                <p className="text-lg font-bold text-red-400">
                  {formatCurrency(invoice?.limite_usado || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">{t('cardDetails.limitAvailable')}</p>
                <p className="text-lg font-bold text-green-400">
                  {formatCurrency(invoice?.limite_disponivel || card.limite_total)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">{t('cardDetails.limitTotal')}</p>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(card.limite_total)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fatura Atual */}
      <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          {/* Navegação de Mês */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                title={t('cardDetails.previousMonth')}
              >
                <ChevronLeft className="w-5 h-5 text-zinc-400" />
              </button>
              
              <div className="text-center min-w-[200px]">
                <h2 className="text-lg font-semibold text-white capitalize">
                  {t('cardDetails.invoice')} {getMonthName(selectedMonth)}
                </h2>
                {isCurrentMonth() && (
                  <span className="inline-block px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full mt-1">
                    {t('cardDetails.currentMonth')}
                  </span>
                )}
              </div>
              
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                title={t('cardDetails.nextMonth')}
              >
                <ChevronRight className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportInvoice}
                disabled={!invoice || invoice.items.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title="Exportar fatura em PDF"
              >
                <Download className="w-4 h-4" />
                Exportar PDF
              </button>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                {t('cardDetails.newExpense')}
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-400 text-center">
            {t('cardDetails.closes')} {card.dia_fechamento} • {t('cardDetails.due')} {card.dia_vencimento}
          </p>
        </div>

        <div className="p-6">
          {/* Resumo da Fatura */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#0A0F1C] border border-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-zinc-400">{t('cardDetails.invoiceValue')}</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(invoice?.total || 0)}
              </p>
            </div>

            <div className="bg-[#0A0F1C] border border-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-zinc-400">{t('cardDetails.closing')}</span>
              </div>
              <p className="text-2xl font-bold text-white">
                Dia {card.dia_fechamento}
              </p>
            </div>

            <div className="bg-[#0A0F1C] border border-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-red-400" />
                <span className="text-xs text-zinc-400">{t('cardDetails.dueDate')}</span>
              </div>
              <p className="text-2xl font-bold text-white">
                Dia {card.dia_vencimento}
              </p>
            </div>
          </div>

          {/* Lista de Despesas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">{t('cardDetails.expenses')}</h3>
              
              {/* Toggle de Modo de Pagamento (NOVO) */}
              {invoice && invoice.pendingCount > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaymentMode('total')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      paymentMode === 'total'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    Pagar Tudo
                  </button>
                  <button
                    onClick={() => setPaymentMode('partial')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      paymentMode === 'partial'
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    Pagamento Parcial
                  </button>
                </div>
              )}
            </div>
            
            {/* Contador e ações de seleção (NOVO - apenas modo parcial) */}
            {paymentMode === 'partial' && invoice && invoice.pendingCount > 0 && (
              <div className="mb-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-purple-300">
                      {selectedItemIds.length} de {invoice.pendingCount} selecionado(s)
                    </span>
                    {selectedItemIds.length > 0 && (
                      <span className="text-sm font-bold text-purple-400">
                        • {formatCurrency(calculateSelectedTotal())}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Selecionar Todos
                    </button>
                    {selectedItemIds.length > 0 && (
                      <button
                        onClick={handleDeselectAll}
                        className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {invoiceLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white/5 rounded-lg h-16" />
                ))}
              </div>
            ) : !invoice || invoice.items.length === 0 ? (
              <div className="text-center py-12">
                <CreditCardIcon className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">{t('cardDetails.noExpenses')}</p>
                <p className="text-zinc-600 text-xs mt-1">
                  {t('cardDetails.addExpenses')}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {invoice.items.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-[#0A0F1C] border rounded-lg p-4 transition-colors ${
                      item.status === 'pago' 
                        ? 'border-green-500/20 opacity-60' 
                        : selectedItemIds.includes(item.id)
                        ? 'border-purple-500/50 bg-purple-500/5'
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Checkbox de seleção (NOVO - apenas modo parcial e pendentes) */}
                      {paymentMode === 'partial' && item.status === 'pendente' && (
                        <div className="mr-3">
                          <input
                            type="checkbox"
                            checked={selectedItemIds.includes(item.id)}
                            onChange={() => handleToggleItemSelection(item.id)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{item.descricao}</p>
                          {item.status === 'pago' && (
                            <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400 font-medium">
                              {t('cardDetails.paid')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-zinc-500">
                            {formatDate(item.data_prevista)}
                          </span>
                          {item.parcela_info && (
                            <span className="text-xs text-zinc-500">
                              • {item.parcela_info.numero}/{item.parcela_info.total}
                            </span>
                          )}
                          {item.status === 'pago' && item.data_efetivacao && (
                            <span className="text-xs text-green-500">
                              • {t('cardDetails.paidOn')} {new Date(item.data_efetivacao).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${item.status === 'pago' ? 'text-green-400' : 'text-white'}`}>
                            {formatCurrency(Number(item.valor))}
                          </p>
                          {item.parcela_info && (
                            <p className="text-xs text-zinc-500">
                              {t('cardDetails.total')}: {formatCurrency(item.parcela_info.valor_original)}
                            </p>
                          )}
                        </div>
                        {item.status === 'pendente' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedTransaction(item);
                                setIsEditModalOpen(true);
                              }}
                              className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTransaction(item);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          {invoice && (
            <div className="mt-6 pt-6 border-t border-white/5">
              {invoice.isPaid ? (
                // Fatura Paga - Mostrar informações e opção de reverter
                <div className="space-y-3">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-400">{t('cardDetails.invoicePaid')}</p>
                        <p className="text-xs text-green-500">
                          Pago em {invoice.dataPagamento ? new Date(invoice.dataPagamento).toLocaleDateString('pt-BR') : '-'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-green-400/80">
                      {t('cardDetails.totalPaid')}: {formatCurrency(invoice.totalPaid)} • {invoice.paidCount} despesa(s)
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setIsReverseModalOpen(true)}
                    className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    {t('future.reversePayment')}
                  </button>
                </div>
              ) : invoice.total > 0 || (paymentMode === 'partial' && selectedItemIds.length > 0) ? (
                // Fatura Pendente - Botão de pagar (modo total ou parcial)
                <button
                  onClick={() => setIsPayModalOpen(true)}
                  disabled={paymentMode === 'partial' && selectedItemIds.length === 0}
                  className={`w-full px-6 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                    paymentMode === 'partial'
                      ? 'bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {paymentMode === 'partial' ? (
                    <>
                      <DollarSign className="w-5 h-5" />
                      Pagar Selecionados ({selectedItemIds.length}) - {formatCurrency(calculateSelectedTotal())}
                    </>
                  ) : isInvoiceClosed() ? (
                    <>
                      <DollarSign className="w-5 h-5" />
                      {t('cardDetails.payInvoice')} - {formatCurrency(invoice.total)}
                    </>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5" />
                      {t('cardDetails.advancePayment')} - {formatCurrency(invoice.total)}
                    </>
                  )}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pagamento */}
      <PayInvoiceModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onSuccess={() => {
          setIsPayModalOpen(false);
          refetchInvoice();
        }}
        card={card}
        invoiceTotal={paymentMode === 'partial' ? calculateSelectedTotal() : (invoice?.total || 0)}
        invoiceMonth={selectedMonth}
        isInvoiceClosed={isInvoiceClosed()}
        paymentMode={paymentMode}
        selectedItemIds={selectedItemIds}
      />

      {/* Modal de Reversão de Pagamento */}
      {invoice?.isPaid && card && (
        <ReversePaymentModal
          isOpen={isReverseModalOpen}
          onClose={() => setIsReverseModalOpen(false)}
          onSuccess={() => {
            setIsReverseModalOpen(false);
            refetchInvoice();
          }}
          cardName={card.nome}
          invoiceMonth={selectedMonth}
          totalPaid={invoice.totalPaid}
          dataPagamento={invoice.dataPagamento || ''}
          paidCount={invoice.paidCount}
          cardId={cardId}
          contaId={card.conta_vinculada_id || ''}
        />
      )}

      {/* Modal de Nova Despesa */}
      <TransactionModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={() => {
          setIsExpenseModalOpen(false);
          refetchInvoice();
        }}
        type="despesa"
        preSelectedCardId={cardId}
      />

      {/* Modal de Edição */}
      {selectedTransaction && (
        <FutureTransactionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTransaction(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedTransaction(null);
            refetchInvoice();
          }}
          type={selectedTransaction.tipo}
          transactionToEdit={selectedTransaction}
        />
      )}

      {/* Modal de Exclusão */}
      {selectedTransaction && (
        <DeleteFutureConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedTransaction(null);
          }}
          onSuccess={() => {
            setIsDeleteModalOpen(false);
            setSelectedTransaction(null);
            refetchInvoice();
          }}
          transaction={selectedTransaction}
        />
      )}
    </div>
  );
}
