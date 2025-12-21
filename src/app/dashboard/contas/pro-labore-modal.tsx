"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Briefcase, Calendar, DollarSign, FileText, Wallet, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useAccounts, BankAccount } from "@/hooks/use-accounts";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";

interface ProLaboreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProLaboreModal({ isOpen, onClose, onSuccess }: ProLaboreModalProps) {
  const { t } = useLanguage();
  const { getCurrencySymbol } = useCurrency();

  // Buscar contas PJ e Pessoal
  const { accounts: accountsPJ } = useAccounts('pj');
  const { accounts: accountsPessoal } = useAccounts('pessoal');

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [formData, setFormData] = useState({
    sourceAccountId: "", // Conta PJ
    destinationAccountId: "", // Conta Pessoal
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        sourceAccountId: "",
        destinationAccountId: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        description: "Pró-labore",
      });
      setFeedback(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const amount = parseFloat(formData.amount);

    if (!amount || amount <= 0 || isNaN(amount)) {
      setFeedback({ type: 'error', message: 'Valor inválido' });
      setLoading(false);
      return;
    }

    if (!formData.sourceAccountId || !formData.destinationAccountId) {
      setFeedback({ type: 'error', message: 'Selecione as contas de origem e destino' });
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      console.log('💼 Iniciando Pró-labore (PJ → Pessoal):', {
        origem: formData.sourceAccountId,
        destino: formData.destinationAccountId,
        valor: amount,
        data: formData.date
      });

      // Buscar usuario_id
      const { data: usuarioIdData, error: usuarioError } = await supabase
        .rpc('get_usuario_id_from_auth');

      if (usuarioError || !usuarioIdData) {
        console.error('❌ Erro ao buscar usuario_id:', usuarioError);
        throw new Error('Erro ao validar usuário');
      }

      console.log('👤 Usuario ID:', usuarioIdData);

      // Buscar ou criar categoria "Pró-labore" para PJ
      let categoriaIdPJ: number;

      const { data: categoriaExistentePJ } = await supabase
        .from('categoria_trasacoes')
        .select('id')
        .eq('descricao', 'Pró-labore')
        .eq('tipo', 'saida')
        .eq('tipo_conta', 'pj')
        .eq('usuario_id', usuarioIdData)
        .maybeSingle();

      if (categoriaExistentePJ) {
        categoriaIdPJ = categoriaExistentePJ.id;
        console.log('📂 Usando categoria Pró-labore PJ existente:', categoriaIdPJ);
      } else {
        console.log('📂 Criando categoria Pró-labore PJ...');
        const { data: novaCategoriaPJ, error: catError } = await supabase
          .from('categoria_trasacoes')
          .insert({
            descricao: 'Pró-labore',
            tipo: 'saida',
            tipo_conta: 'pj',
            usuario_id: usuarioIdData,
            icon_key: 'Briefcase'
          })
          .select('id')
          .single();

        if (catError || !novaCategoriaPJ) {
          console.error('❌ Erro ao criar categoria PJ:', catError);
          throw new Error(`Erro ao criar categoria: ${catError?.message}`);
        }

        categoriaIdPJ = novaCategoriaPJ.id;
        console.log('📂 Categoria PJ criada:', categoriaIdPJ);
      }

      // Buscar ou criar categoria "Pró-labore" para Pessoal
      let categoriaIdPessoal: number;

      const { data: categoriaExistentePessoal } = await supabase
        .from('categoria_trasacoes')
        .select('id')
        .eq('descricao', 'Pró-labore')
        .eq('tipo', 'entrada')
        .eq('tipo_conta', 'pessoal')
        .eq('usuario_id', usuarioIdData)
        .maybeSingle();

      if (categoriaExistentePessoal) {
        categoriaIdPessoal = categoriaExistentePessoal.id;
        console.log('📂 Usando categoria Pró-labore Pessoal existente:', categoriaIdPessoal);
      } else {
        console.log('📂 Criando categoria Pró-labore Pessoal...');
        const { data: novaCategoriaPessoal, error: catError } = await supabase
          .from('categoria_trasacoes')
          .insert({
            descricao: 'Pró-labore',
            tipo: 'entrada',
            tipo_conta: 'pessoal',
            usuario_id: usuarioIdData,
            icon_key: 'Briefcase'
          })
          .select('id')
          .single();

        if (catError || !novaCategoriaPessoal) {
          console.error('❌ Erro ao criar categoria Pessoal:', catError);
          throw new Error(`Erro ao criar categoria: ${catError?.message}`);
        }

        categoriaIdPessoal = novaCategoriaPessoal.id;
        console.log('📂 Categoria Pessoal criada:', categoriaIdPessoal);
      }

      // Formatar data
      const dataFormatada = `${formData.date}T00:00:00`;
      const mesFormatado = formData.date.substring(0, 7);
      const descricao = formData.description || 'Pró-labore';

      // 1. Criar transação de SAÍDA na conta PJ
      console.log('💸 Criando transação de saída (PJ)...');
      const { error: saidaError } = await supabase.from('transacoes').insert({
        usuario_id: usuarioIdData,
        tipo_conta: 'pj',
        conta_id: formData.sourceAccountId,
        tipo: 'saida',
        valor: amount,
        descricao: `${descricao} (Saída PJ)`,
        data: dataFormatada,
        mes: mesFormatado,
        categoria_id: categoriaIdPJ,
        is_transferencia: false
      });

      if (saidaError) {
        console.error('❌ Erro ao criar saída:', saidaError);
        throw new Error(`Erro ao criar transação de saída: ${saidaError.message}`);
      }

      console.log('✅ Saída PJ criada');

      // 2. Criar transação de ENTRADA na conta Pessoal
      console.log('💰 Criando transação de entrada (Pessoal)...');
      const { error: entradaError } = await supabase.from('transacoes').insert({
        usuario_id: usuarioIdData,
        tipo_conta: 'pessoal',
        conta_id: formData.destinationAccountId,
        tipo: 'entrada',
        valor: amount,
        descricao: `${descricao} (Entrada Pessoal)`,
        data: dataFormatada,
        mes: mesFormatado,
        categoria_id: categoriaIdPessoal,
        is_transferencia: false
      });

      if (entradaError) {
        console.error('❌ Erro ao criar entrada:', entradaError);
        throw new Error(`Erro ao criar transação de entrada: ${entradaError.message}`);
      }

      console.log('✅ Entrada Pessoal criada');
      console.log('✅ Pró-labore concluído com sucesso!');

      setFeedback({ type: 'success', message: 'Pró-labore realizado com sucesso!' });

      setTimeout(() => {
        onSuccess();
        onClose();
        setFeedback(null);
      }, 1500);

    } catch (error: any) {
      console.error('💥 Erro ao realizar pró-labore:', error);
      setFeedback({ type: 'error', message: error?.message || 'Erro ao realizar pró-labore' });
    } finally {
      setLoading(false);
    }
  };

  if (feedback) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={feedback.type === 'success' ? 'Sucesso' : 'Erro'} className="max-w-sm">
             <div className="flex flex-col items-center text-center space-y-4 p-4">
                {feedback.type === 'success' ? <CheckCircle2 className="w-12 h-12 text-green-500" /> : <XCircle className="w-12 h-12 text-red-500" />}
                <p className="text-white text-lg font-medium">{feedback.message}</p>
             </div>
        </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="💼 Pró-labore (PJ → Pessoal)"
      className="max-w-md w-full p-0 overflow-hidden bg-[#111827] border border-white/10"
    >
      <div className="p-5 max-h-[85vh] overflow-y-auto custom-scrollbar">

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Conta Origem (PJ) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">
              Conta PJ (Origem)
            </label>
            <div className="relative group">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500">
                <Briefcase className="w-4 h-4" />
              </div>
              <select
                required
                value={formData.sourceAccountId}
                onChange={e => setFormData({...formData, sourceAccountId: e.target.value})}
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-3 h-10 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none"
              >
                <option value="">Selecione a conta PJ</option>
                {accountsPJ.map(acc => (
                    <option key={acc.id} value={acc.id}>
                        {acc.nome} {acc.saldo_atual !== undefined ? `(${getCurrencySymbol()} ${acc.saldo_atual.toFixed(2)})` : ''}
                    </option>
                ))}
              </select>
            </div>
            {accountsPJ.length === 0 && (
              <p className="text-xs text-yellow-500 ml-1">
                ⚠️ Nenhuma conta PJ encontrada. Crie uma conta PJ primeiro.
              </p>
            )}
          </div>

          {/* Conta Destino (Pessoal) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">
              Conta Pessoal (Destino)
            </label>
            <div className="relative group">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                <Wallet className="w-4 h-4" />
              </div>
              <select
                required
                value={formData.destinationAccountId}
                onChange={e => setFormData({...formData, destinationAccountId: e.target.value})}
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-3 h-10 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
              >
                <option value="">Selecione a conta pessoal</option>
                {accountsPessoal.map(acc => (
                    <option key={acc.id} value={acc.id}>
                        {acc.nome}
                    </option>
                ))}
              </select>
            </div>
            {accountsPessoal.length === 0 && (
              <p className="text-xs text-yellow-500 ml-1">
                ⚠️ Nenhuma conta pessoal encontrada. Crie uma conta pessoal primeiro.
              </p>
            )}
          </div>

          {/* Data */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">
              Data do Pró-labore
            </label>
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
            <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">
              Valor do Pró-labore
            </label>
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
            <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wide">
              Descrição (Opcional)
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <FileText className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Ex: Pró-labore Janeiro"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-3 h-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Aviso */}
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <p className="text-xs text-purple-300">
              💡 <strong>Pró-labore:</strong> Transferência da conta PJ para sua conta pessoal.
              Será criada uma saída na PJ e uma entrada na conta pessoal.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-zinc-400 hover:text-white hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white"
              disabled={loading || accountsPJ.length === 0 || accountsPessoal.length === 0}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Realizar Pró-labore
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
