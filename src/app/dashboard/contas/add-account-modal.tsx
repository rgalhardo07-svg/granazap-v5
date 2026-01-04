"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { Loader2, Landmark, Wallet, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useAccounts } from "@/hooks/use-accounts";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAccountModal({ isOpen, onClose, onSuccess }: AddAccountModalProps) {
  const { t } = useLanguage();
  const { getCurrencySymbol } = useCurrency();
  const { filter: accountFilter } = useAccountFilter();
  const { createAccount } = useAccounts(accountFilter);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    banco: "",
    saldo_atual: "",
    is_default: false
  });

  const formatCurrencyInput = (value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    
    // Converte para número e divide por 100 para ter os centavos
    const amount = parseFloat(numbers) / 100;
    
    // Formata no padrão brasileiro
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setFormData({...formData, saldo_atual: formatted});
  };

  // Reset feedback ao abrir
  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setFormData({
        nome: "",
        banco: "",
        saldo_atual: "",
        is_default: false
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      // Parse o valor formatado: remove pontos (separador de milhar) e substitui vírgula por ponto
      const valorLimpo = formData.saldo_atual.replace(/\./g, '').replace(',', '.');
      const saldoNumerico = parseFloat(valorLimpo) || 0;
      
      await createAccount({
        nome: formData.nome,
        banco: formData.banco || undefined,
        saldo_atual: saldoNumerico,
        is_default: formData.is_default
      });

      setFeedback({ type: 'success', message: t('accounts.createSuccess') });
      
      setTimeout(() => {
        onSuccess();
        onClose();
        setFeedback(null);
      }, 1500);

    } catch (error: any) {
      let msg = t('accounts.errorCreate');
      if (error?.message) msg = error.message;
      if (error?.details) msg += ` (${error.details})`;
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  if (feedback) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={feedback.type === 'success' ? t('common.save') : 'Erro'}
        className="max-w-sm w-full p-6 bg-[#111827] border border-white/10"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          {feedback.type === 'success' ? (
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">
              {feedback.type === 'success' ? t('accounts.createSuccess') : 'Ops, algo deu errado'}
            </h3>
            <p className="text-sm text-zinc-400">
              {feedback.message}
            </p>
          </div>

          {feedback.type === 'error' && (
            <Button 
              onClick={() => setFeedback(null)} 
              className="w-full bg-white/10 hover:bg-white/20 text-white"
            >
              {t('common.cancel')}
            </Button>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('accounts.newAccount')}
      className="max-w-md w-full p-0 overflow-hidden bg-[#111827] border border-white/10"
    >
      <div className="p-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
        
        {/* Indicador de Conta */}
        <div className="mb-6 bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-200">
              Adicionando para <span className="font-semibold text-blue-400 uppercase">{accountFilter === 'pessoal' ? t('sidebar.personal') : t('sidebar.pj')}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">{t('accounts.accountName')}</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors">
                <Wallet className="w-4 h-4" />
              </div>
              <input
                required
                type="text"
                placeholder="Ex: Nubank, Itaú Principal..."
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-3 h-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Banco */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">{t('accounts.bankOptional')}</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors">
                <Landmark className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Ex: Nu Pagamentos S.A."
                value={formData.banco}
                onChange={e => setFormData({...formData, banco: e.target.value})}
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-3 h-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Saldo Inicial */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">{t('accounts.currentBalance')}</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-green-500 transition-colors">
                <span className="text-sm font-semibold">{getCurrencySymbol()}</span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={formData.saldo_atual}
                onChange={handleCurrencyChange}
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-3 h-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
              />
            </div>
          </div>

          {/* Is Default Toggle */}
          <div className="flex items-center gap-3 pt-2">
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input 
                    type="checkbox" 
                    name="toggle" 
                    id="toggle" 
                    checked={formData.is_default}
                    onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                    className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 checked:right-0 right-5"
                />
                <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-300 ${formData.is_default ? 'bg-blue-600' : 'bg-zinc-700'}`}></label>
            </div>
            <label htmlFor="toggle" className="text-sm text-zinc-300 cursor-pointer select-none">
                {t('accounts.setAsDefault')}
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5 mt-4">
            <Button 
              type="button" 
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-zinc-400 hover:text-white hover:bg-white/5 h-10 rounded-lg transition-colors text-sm"
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] text-sm"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t('accounts.newAccount')}
            </Button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .toggle-checkbox:checked {
          right: 0;
          border-color: #2563EB;
        }
        .toggle-checkbox {
          right: 20px;
          border-color: #3f3f46;
        }
      `}</style>
    </Modal>
  );
}
