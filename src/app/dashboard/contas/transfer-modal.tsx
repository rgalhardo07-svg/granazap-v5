"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Calendar, DollarSign, FileText, Wallet, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { useAccounts, BankAccount } from "@/hooks/use-accounts";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialSourceAccount?: BankAccount | null;
}

export function TransferModal({ isOpen, onClose, onSuccess, initialSourceAccount }: TransferModalProps) {
  const { t } = useLanguage();
  const { getCurrencySymbol } = useCurrency();
  const { filter: accountFilter } = useAccountFilter();
  const { accounts } = useAccounts(accountFilter);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [formData, setFormData] = useState({
    sourceAccountId: "",
    destinationAccountId: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        sourceAccountId: initialSourceAccount?.id || "",
        destinationAccountId: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        description: "",
      });
      setFeedback(null);
    }
  }, [isOpen, initialSourceAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const amount = parseFloat(formData.amount);
    
    if (!amount || amount <= 0 || isNaN(amount)) {
      setFeedback({ type: 'error', message: t('validation.valueRequired') });
      setLoading(false);
      return;
    }

    if (formData.sourceAccountId === formData.destinationAccountId) {
      setFeedback({ type: 'error', message: t('accounts.sameAccountError') });
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      console.log('🔄 Iniciando transferência:', {
        origem: formData.sourceAccountId,
        destino: formData.destinationAccountId,
        valor: amount,
        data: formData.date,
        tipo_conta: accountFilter
      });

      // Buscar usuario_id
      const { data: usuarioIdData, error: usuarioError } = await supabase
        .rpc('get_usuario_id_from_auth');
      
      if (usuarioError || !usuarioIdData) {
        console.error('❌ Erro ao buscar usuario_id:', usuarioError);
        throw new Error('Erro ao validar usuário');
      }

      console.log('👤 Usuario ID:', usuarioIdData);

      // Buscar ou criar categoria "Transferência"
      let categoriaId: number;
      
      const { data: categoriaExistente } = await supabase
        .from('categoria_trasacoes')
        .select('id')
        .eq('descricao', 'Transferência')
        .eq('tipo', 'saida') // Usamos 'saida' para a categoria
        .eq('tipo_conta', accountFilter)
        .eq('usuario_id', usuarioIdData)
        .maybeSingle();

      if (categoriaExistente) {
        categoriaId = categoriaExistente.id;
        console.log('📂 Usando categoria existente:', categoriaId);
      } else {
        console.log('📂 Criando categoria Transferência...');
        const { data: novaCategoria, error: catError } = await supabase
          .from('categoria_trasacoes')
          .insert({
            descricao: 'Transferência',
            tipo: 'saida',
            tipo_conta: accountFilter,
            usuario_id: usuarioIdData,
            icon_key: 'ArrowRightLeft'
          })
          .select('id')
          .single();

        if (catError || !novaCategoria) {
          console.error('❌ Erro ao criar categoria:', catError);
          throw new Error(`Erro ao criar categoria: ${catError?.message}`);
        }
        
        categoriaId = novaCategoria.id;
        console.log('📂 Categoria criada:', categoriaId);
      }

      // Formatar data
      const dataFormatada = `${formData.date}T00:00:00`;
      const mesFormatado = formData.date.substring(0, 7);
      const descricao = formData.description || 'Transferência entre contas';

      // 1. Criar transação de SAÍDA na conta origem
      console.log('💸 Criando transação de saída...');
      const { error: saidaError } = await supabase.from('transacoes').insert({
        usuario_id: usuarioIdData,
        tipo_conta: accountFilter,
        conta_id: formData.sourceAccountId,
        tipo: 'saida',
        valor: amount,
        descricao: `${descricao} (Saída)`,
        data: dataFormatada,
        mes: mesFormatado,
        categoria_id: categoriaId,
        is_transferencia: true
      });

      if (saidaError) {
        console.error('❌ Erro ao criar saída:', saidaError);
        throw new Error(`Erro ao criar transação de saída: ${saidaError.message}`);
      }

      console.log('✅ Saída criada');

      // 2. Criar transação de ENTRADA na conta destino
      console.log('💰 Criando transação de entrada...');
      const { error: entradaError } = await supabase.from('transacoes').insert({
        usuario_id: usuarioIdData,
        tipo_conta: accountFilter,
        conta_id: formData.destinationAccountId,
        tipo: 'entrada',
        valor: amount,
        descricao: `${descricao} (Entrada)`,
        data: dataFormatada,
        mes: mesFormatado,
        categoria_id: categoriaId,
        is_transferencia: true
      });

      if (entradaError) {
        console.error('❌ Erro ao criar entrada:', entradaError);
        throw new Error(`Erro ao criar transação de entrada: ${entradaError.message}`);
      }

      console.log('✅ Entrada criada');
      console.log('✅ Transferência concluída com sucesso!');

      setFeedback({ type: 'success', message: t('accounts.transferSuccess') });
      
      setTimeout(() => {
        onSuccess();
        onClose();
        setFeedback(null);
      }, 1500);

    } catch (error: any) {
      console.error('💥 Erro ao realizar transferência:', error);
      setFeedback({ type: 'error', message: error?.message || t('accounts.errorTransfer') });
    } finally {
      setLoading(false);
    }
  };

  if (feedback) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={feedback.type === 'success' ? t('common.save') : 'Erro'} className="max-w-sm">
             <div className="flex flex-col items-center text-center space-y-4 p-4">
                {feedback.type === 'success' ? <CheckCircle2 className="w-12 h-12 text-green-500" /> : <XCircle className="w-12 h-12 text-red-500" />}
                <p className="text-white text-lg font-medium">{feedback.message}</p>
             </div>
        </Modal>
    )
  }

  const selectedSource = accounts.find(a => a.id === formData.sourceAccountId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('accounts.makeTransfer')}
      className="max-w-md w-full p-0 overflow-hidden bg-[#111827] border border-white/10"
    >
      <div className="p-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
        
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Conta Origem (Se não pré-selecionada ou permitir trocar) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">{t('accounts.transferFrom')}</label>
            <div className="relative group">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <Wallet className="w-4 h-4" />
              </div>
              <select
                required
                value={formData.sourceAccountId}
                onChange={e => setFormData({...formData, sourceAccountId: e.target.value})}
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-3 h-10 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
              >
                <option value="">{t('accounts.selectSourceAccount')}</option>
                {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === formData.destinationAccountId}>
                        {acc.nome} {acc.saldo_atual !== undefined ? `(${getCurrencySymbol()} ${acc.saldo_atual.toFixed(2)})` : ''}
                    </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conta Destino */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">{t('accounts.transferTo')}</label>
            <div className="relative group">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <Wallet className="w-4 h-4" />
              </div>
              <select
                required
                value={formData.destinationAccountId}
                onChange={e => setFormData({...formData, destinationAccountId: e.target.value})}
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-3 h-10 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
              >
                <option value="">{t('accounts.selectDestinationAccount')}</option>
                {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === formData.sourceAccountId}>
                        {acc.nome}
                    </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">{t('accounts.transferDate')}</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                required
                type="date"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-3 h-10 text-sm text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Valor */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">{t('accounts.transferAmount')}</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                required
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-3 h-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">{t('accounts.transferDescription')}</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <FileText className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Ex: Transferência para poupança"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-3 h-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5 mt-4">
            <Button 
              type="button" 
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-zinc-400 hover:text-white hover:bg-white/5"
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t('accounts.transfer')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
