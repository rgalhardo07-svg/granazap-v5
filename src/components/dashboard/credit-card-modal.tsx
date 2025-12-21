"use client";

import { useState, useEffect } from "react";
import { X, CreditCard as CreditCardIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { useAccounts } from "@/hooks/use-accounts";
import { cn } from "@/lib/utils";
import type { CreditCard } from "@/hooks/use-credit-cards";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cardToEdit?: CreditCard | null;
}

const BANDEIRAS = [
  { value: "Visa", label: "Visa" },
  { value: "Mastercard", label: "Mastercard" },
  { value: "Elo", label: "Elo" },
  { value: "Amex", label: "American Express" },
  { value: "Hipercard", label: "Hipercard" },
  { value: "Outro", label: "Outro" },
];

const CORES_CARTAO = [
  { value: "#8A05BE", label: "Roxo (Nubank)" },
  { value: "#FF6B00", label: "Laranja (Itaú)" },
  { value: "#CC092F", label: "Vermelho (Bradesco)" },
  { value: "#EC0000", label: "Vermelho (Santander)" },
  { value: "#6366f1", label: "Azul (Padrão)" },
  { value: "#10b981", label: "Verde" },
  { value: "#f59e0b", label: "Amarelo" },
  { value: "#8b5cf6", label: "Roxo" },
];

export function CreditCardModal({ isOpen, onClose, onSuccess, cardToEdit }: CreditCardModalProps) {
  const { t, language } = useLanguage();
  const { getCurrencySymbol, formatCurrency } = useCurrency();
  const { user } = useUser();
  const { filter: accountFilter } = useAccountFilter();
  const { accounts } = useAccounts(accountFilter);
  
  const [nome, setNome] = useState("");
  const [bandeira, setBandeira] = useState("Visa");
  const [ultimosDigitos, setUltimosDigitos] = useState("");
  const [limiteTotal, setLimiteTotal] = useState("");
  const [diaFechamento, setDiaFechamento] = useState("");
  const [diaVencimento, setDiaVencimento] = useState("");
  const [corCartao, setCorCartao] = useState("#8A05BE");
  const [contaVinculadaId, setContaVinculadaId] = useState("");
  const [loading, setLoading] = useState(false);

  const locales = {
    pt: 'pt-BR',
    en: 'en-US',
    es: 'es-ES'
  };

  useEffect(() => {
    if (cardToEdit) {
      setNome(cardToEdit.nome);
      setBandeira(cardToEdit.bandeira || "Visa");
      setUltimosDigitos(cardToEdit.ultimos_digitos || "");
      setLimiteTotal(cardToEdit.limite_total.toString());
      setDiaFechamento(cardToEdit.dia_fechamento.toString());
      setDiaVencimento(cardToEdit.dia_vencimento.toString());
      setCorCartao(cardToEdit.cor_cartao);
      setContaVinculadaId(cardToEdit.conta_vinculada_id || "");
    } else {
      setNome("");
      setBandeira("Visa");
      setUltimosDigitos("");
      setLimiteTotal("");
      setDiaFechamento("");
      setDiaVencimento("");
      setCorCartao("#8A05BE");
      setContaVinculadaId("");
    }
  }, [cardToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const supabase = createClient();

      const cardData = {
        nome,
        bandeira,
        ultimos_digitos: ultimosDigitos || null,
        limite_total: parseFloat(limiteTotal),
        dia_fechamento: parseInt(diaFechamento),
        dia_vencimento: parseInt(diaVencimento),
        cor_cartao: corCartao,
        conta_vinculada_id: contaVinculadaId || null,
        tipo_conta: accountFilter,
        usuario_id: user.id,
      };

      let error;

      if (cardToEdit) {
        const { error: updateError } = await supabase
          .from('cartoes_credito')
          .update(cardData)
          .eq('id', cardToEdit.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cartoes_credito')
          .insert([cardData]);
        error = insertError;
      }

      if (error) throw error;

      window.dispatchEvent(new CustomEvent('creditCardsChanged'));
      onSuccess();
      onClose();
    } catch (error) {
      alert(`${t('validation.errorSaving')}.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111827] border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <CreditCardIcon className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {cardToEdit ? t('cards.modal.editTitle') : t('cards.modal.newTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aviso de Contexto */}
        <div className="flex flex-col items-center gap-2 p-4 border-b border-white/5">
          <span className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold",
            accountFilter === 'pessoal'
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
              : "bg-purple-500/10 text-purple-400 border border-purple-500/30"
          )}>
            {accountFilter === 'pessoal' ? `👤 ${t('cards.modal.contextPersonal')}` : `🏢 ${t('cards.modal.contextPJ')}`}
          </span>
          <p className="text-[10px] text-zinc-500 text-center">
            {accountFilter === 'pessoal' 
              ? `${t('cards.newCard')} ${t('cards.modal.contextUsagePersonal')}`
              : `${t('cards.newCard')} ${t('cards.modal.contextUsagePJ')}`}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome do Cartão */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('cards.modal.cardName')} *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={t('cards.modal.placeholderName')}
              required
              className="w-full px-4 py-2.5 bg-[#0A0F1C] border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          {/* Bandeira */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('cards.modal.brand')}
            </label>
            <select
              value={bandeira}
              onChange={(e) => setBandeira(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0A0F1C] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              {BANDEIRAS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>

          {/* Últimos 4 Dígitos */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('cards.modal.lastDigits')}
            </label>
            <input
              type="text"
              value={ultimosDigitos}
              onChange={(e) => setUltimosDigitos(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              maxLength={4}
              className="w-full px-4 py-2.5 bg-[#0A0F1C] border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          {/* Limite Total */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('cards.modal.limit')} ({getCurrencySymbol()}) *
            </label>
            <input
              type="number"
              step="0.01"
              value={limiteTotal}
              onChange={(e) => setLimiteTotal(e.target.value)}
              placeholder="5000.00"
              required
              className="w-full px-4 py-2.5 bg-[#0A0F1C] border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          {/* Dia de Fechamento */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('cards.modal.closingDay')} *
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={diaFechamento}
              onChange={(e) => setDiaFechamento(e.target.value)}
              placeholder="10"
              required
              className="w-full px-4 py-2.5 bg-[#0A0F1C] border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <p className="text-xs text-zinc-500 mt-1">{t('cards.modal.closingDayHint')}</p>
          </div>

          {/* Dia de Vencimento */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('cards.modal.dueDay')} *
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={diaVencimento}
              onChange={(e) => setDiaVencimento(e.target.value)}
              placeholder="17"
              required
              className="w-full px-4 py-2.5 bg-[#0A0F1C] border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <p className="text-xs text-zinc-500 mt-1">{t('cards.modal.dueDayHint')}</p>
          </div>

          {/* Conta Vinculada */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('cards.modal.linkedAccount')}
            </label>
            <select
              value={contaVinculadaId}
              onChange={(e) => setContaVinculadaId(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0A0F1C] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="">{t('cards.modal.selectLater')}</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.nome} - {formatCurrency(account.saldo_atual)}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 mt-1">{t('cards.modal.linkedAccountHint')}</p>
          </div>

          {/* Cor do Cartão */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('cards.modal.cardColor')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CORES_CARTAO.map((cor) => (
                <button
                  key={cor.value}
                  type="button"
                  onClick={() => setCorCartao(cor.value)}
                  className={cn(
                    "h-10 rounded-lg border-2 transition-all",
                    corCartao === cor.value
                      ? "border-white scale-110"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: cor.value }}
                  title={cor.label}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {loading ? t('cards.modal.saving') : cardToEdit ? t('cards.modal.update') : t('cards.modal.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
