"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Loader2, Download, Trash2, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useBranding } from "@/contexts/branding-context";
import { ExportDataModal } from "@/components/ui/export-data-modal";
import { ClearDataModal } from "@/components/ui/clear-data-modal";
import { DeleteAccountModal } from "@/components/ui/delete-account-modal";
import { SuccessNotificationModal } from "@/components/ui/success-notification-modal";
import { ErrorModal } from "@/components/ui/error-modal";
import * as XLSX from 'xlsx';

export function DataManagement() {
  const { t } = useLanguage();
  const { user, profile } = useUser();
  const { settings } = useBranding();
  const [exporting, setExporting] = useState(false);
  const [deletingTransactions, setDeletingTransactions] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showExportSuccessModal, setShowExportSuccessModal] = useState(false);
  const [showClearSuccessModal, setShowClearSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const supabase = createClient();
  
  // Bloquear acesso para dependentes
  const isDependente = profile?.is_dependente === true;

  const confirmExport = async () => {
    if (!user) return;
    setExporting(true);
    
    try {
      // Buscar categorias
      const { data: categorias } = await supabase
        .from('categoria_trasacoes')
        .select('id, descricao');
      
      const categoriasMap = new Map(
        categorias?.map(c => [c.id, c.descricao]) || []
      );

      // 1. ABA: RECEITAS (transações efetivadas tipo entrada)
      const { data: receitas } = await supabase
        .from('transacoes')
        .select('*')
        .eq('tipo', 'entrada')
        .order('data', { ascending: false });

      const receitasFormatadas = (receitas || []).map(t => ({
        'Data': t.data?.split('T')[0] || '',
        'Descrição': t.descricao || '',
        'Valor (R$)': (t.valor || 0).toFixed(2),
        'Categoria': categoriasMap.get(t.categoria_id) || 'Sem categoria',
        'Conta': t.tipo_conta === 'pessoal' ? 'Pessoal' : 'Empresarial (PJ)'
      }));

      // 2. ABA: DESPESAS (transações efetivadas tipo saída)
      const { data: despesas } = await supabase
        .from('transacoes')
        .select('*')
        .eq('tipo', 'saida')
        .order('data', { ascending: false });

      const despesasFormatadas = (despesas || []).map(t => ({
        'Data': t.data?.split('T')[0] || '',
        'Descrição': t.descricao || '',
        'Valor (R$)': (t.valor || 0).toFixed(2),
        'Categoria': categoriasMap.get(t.categoria_id) || 'Sem categoria',
        'Conta': t.tipo_conta === 'pessoal' ? 'Pessoal' : 'Empresarial (PJ)'
      }));

      // 3. ABA: LANÇAMENTOS FUTUROS
      const { data: lancamentosFuturos } = await supabase
        .from('lancamentos_futuros')
        .select('*')
        .order('data_prevista', { ascending: true });

      const lancamentosFuturosFormatados = (lancamentosFuturos || []).map(l => ({
        'Data Prevista': l.data_prevista?.split('T')[0] || '',
        'Descrição': l.descricao || '',
        'Valor (R$)': (l.valor || 0).toFixed(2),
        'Tipo': l.tipo === 'entrada' ? 'Receita' : 'Despesa',
        'Categoria': categoriasMap.get(l.categoria_id) || 'Sem categoria',
        'Status': l.status === 'efetivado' ? 'Efetivado' : 'Pendente',
        'Recorrente': l.recorrente ? 'Sim' : 'Não',
        'Conta': l.tipo_conta === 'pessoal' ? 'Pessoal' : 'Empresarial (PJ)'
      }));

      // 4. ABA: CONTAS BANCÁRIAS
      const { data: contas } = await supabase
        .from('contas_bancarias')
        .select('*')
        .order('nome', { ascending: true });

      const contasFormatadas = (contas || []).map(c => ({
        'Nome': c.nome || '',
        'Tipo': c.tipo || '',
        'Saldo Atual (R$)': (c.saldo_atual || 0).toFixed(2),
        'Banco': c.banco || '',
        'Agência': c.agencia || '',
        'Conta': c.numero_conta || '',
        'Tipo Conta': c.tipo_conta === 'pessoal' ? 'Pessoal' : 'Empresarial (PJ)'
      }));

      // 5. ABA: CARTÕES DE CRÉDITO
      const { data: cartoes } = await supabase
        .from('cartoes_credito')
        .select('*')
        .order('nome', { ascending: true });

      const cartoesFormatados = (cartoes || []).map(c => ({
        'Nome': c.nome || '',
        'Bandeira': c.bandeira || '',
        'Últimos Dígitos': c.ultimos_digitos || '',
        'Limite Total (R$)': (c.limite_total || 0).toFixed(2),
        'Dia Fechamento': c.dia_fechamento || '',
        'Dia Vencimento': c.dia_vencimento || '',
        'Tipo Conta': c.tipo_conta === 'pessoal' ? 'Pessoal' : 'Empresarial (PJ)'
      }));

      // Criar workbook
      const wb = XLSX.utils.book_new();

      // Adicionar abas
      if (receitasFormatadas.length > 0) {
        const wsReceitas = XLSX.utils.json_to_sheet(receitasFormatadas);
        XLSX.utils.book_append_sheet(wb, wsReceitas, 'Receitas');
      }

      if (despesasFormatadas.length > 0) {
        const wsDespesas = XLSX.utils.json_to_sheet(despesasFormatadas);
        XLSX.utils.book_append_sheet(wb, wsDespesas, 'Despesas');
      }

      if (lancamentosFuturosFormatados.length > 0) {
        const wsLancamentos = XLSX.utils.json_to_sheet(lancamentosFuturosFormatados);
        XLSX.utils.book_append_sheet(wb, wsLancamentos, 'Lançamentos Futuros');
      }

      if (contasFormatadas.length > 0) {
        const wsContas = XLSX.utils.json_to_sheet(contasFormatadas);
        XLSX.utils.book_append_sheet(wb, wsContas, 'Contas Bancárias');
      }

      if (cartoesFormatados.length > 0) {
        const wsCartoes = XLSX.utils.json_to_sheet(cartoesFormatados);
        XLSX.utils.book_append_sheet(wb, wsCartoes, 'Cartões de Crédito');
      }

      // Verificar se há dados para exportar
      if (wb.SheetNames.length === 0) {
        alert('Você ainda não possui dados para exportar.');
        setShowExportModal(false);
        setExporting(false);
        return;
      }

      // Gerar arquivo Excel
      const fileName = `${(settings.appName || 'granazap').toLowerCase().replace(/\s+/g, '_')}_dados_completos_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setShowExportModal(false);
      setShowExportSuccessModal(true);

    } catch (error: any) {
      console.error('Erro ao exportar dados:', error);
      setShowExportModal(false);
      setShowErrorModal(true);
      setErrorMessage(error.message || 'Erro desconhecido ao exportar dados');
    } finally {
      setExporting(false);
    }
  };

  const confirmDeleteAllTransactions = async () => {
    if (!profile?.id || !user?.id) {
      setShowClearModal(false);
      setShowErrorModal(true);
      setErrorMessage('Usuário não identificado');
      return;
    }

    setDeletingTransactions(true);
    try {
      // IMPORTANTE: Deletar na ordem correta para evitar erros de foreign key
      // Ordem: dados dependentes primeiro, depois os pais (contas, cartões, categorias)
      
      // 1. Deletar transações (dependem de contas/cartões/categorias)
      const { error: tError } = await supabase
        .from('transacoes')
        .delete()
        .eq('usuario_id', profile.id);
      
      if (tError) throw new Error(`Erro ao deletar transações: ${tError.message}`);

      // 2. Deletar lançamentos futuros (dependem de contas/cartões/categorias)
      const { error: fError } = await supabase
        .from('lancamentos_futuros')
        .delete()
        .eq('usuario_id', profile.id);

      if (fError) throw new Error(`Erro ao deletar lançamentos futuros: ${fError.message}`);

      // 3. Deletar metas (dependem de categorias)
      const { error: mError } = await supabase
        .from('metas_orcamento')
        .delete()
        .eq('usuario_id', profile.id);

      if (mError) throw new Error(`Erro ao deletar metas: ${mError.message}`);

      // 4. Deletar contas bancárias (usa auth_user_id UUID)
      const { error: cError } = await supabase
        .from('contas_bancarias')
        .delete()
        .eq('usuario_id', user.id);

      if (cError) throw new Error(`Erro ao deletar contas bancárias: ${cError.message}`);

      // 5. Deletar cartões de crédito (usa auth_user_id UUID)
      const { error: ccError } = await supabase
        .from('cartoes_credito')
        .delete()
        .eq('usuario_id', user.id);

      if (ccError) throw new Error(`Erro ao deletar cartões: ${ccError.message}`);

      // 6. Deletar categorias personalizadas do usuário (por último, pois podem ser referenciadas)
      // Categorias padrão do sistema têm usuario_id = NULL, então só deletamos as do usuário
      const { error: catError } = await supabase
        .from('categoria_trasacoes')
        .delete()
        .eq('usuario_id', profile.id);

      if (catError) throw new Error(`Erro ao deletar categorias: ${catError.message}`);

      // Sucesso!
      setShowClearModal(false);
      setShowClearSuccessModal(true);
      setTimeout(() => {
        window.location.reload(); // Recarregar para limpar cache visual
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao deletar dados:', error);
      setShowClearModal(false);
      setShowErrorModal(true);
      setErrorMessage(error.message || 'Erro desconhecido ao deletar dados');
    } finally {
      setDeletingTransactions(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountModal(true);
  };

  // Se for dependente, mostrar mensagem de bloqueio
  if (isDependente) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-white">{t('settings.dataManagement')}</h3>
          <p className="text-sm text-zinc-400">{t('settings.dataManagementDesc')}</p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-500 mb-1">
                Acesso Restrito
              </h4>
              <p className="text-sm text-zinc-400">
                Apenas o administrador da conta pode gerenciar dados e realizar exportações. 
                Entre em contato com o administrador para realizar essas ações.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white">{t('settings.dataManagement')}</h3>
        <p className="text-sm text-zinc-400">{t('settings.dataManagementDesc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exportar */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <FileSpreadsheet className="w-6 h-6 text-[#22C55E]" />
            </div>
            <div>
              <h4 className="font-medium text-white">Exportar Dados Completos</h4>
              <p className="text-sm text-zinc-400 mt-1">
                Baixe um arquivo Excel (.xlsx) com todas as suas informações financeiras organizadas em abas.
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowExportModal(true)}
            disabled={exporting}
            className="w-full py-2 bg-[#0A0F1C] border border-white/10 hover:bg-white/5 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar Dados
          </button>
        </div>

        {/* Zona de Perigo */}
        <div className="bg-[#111827] border border-red-500/20 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <AlertTriangle className="w-24 h-24 text-red-500" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h4 className="font-medium text-white">{t('settings.dangerZone')}</h4>
                <p className="text-sm text-zinc-400 mt-1">
                  Ações irreversíveis. Cuidado.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowClearModal(true)}
                disabled={deletingTransactions}
                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {deletingTransactions && <Loader2 className="w-4 h-4 animate-spin" />}
                Limpar Todos os Dados
              </button>

              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="w-full py-2 text-zinc-500 hover:text-white transition-colors text-sm"
              >
                Excluir Conta
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ExportDataModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={confirmExport}
        isExporting={exporting}
      />

      <ClearDataModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={confirmDeleteAllTransactions}
        isDeleting={deletingTransactions}
      />

      <DeleteAccountModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        supportEmail={settings.supportEmail}
      />

      <SuccessNotificationModal
        isOpen={showExportSuccessModal}
        onClose={() => setShowExportSuccessModal(false)}
        title="Exportação Concluída!"
        message={t('success.excelExported')}
      />

      <SuccessNotificationModal
        isOpen={showClearSuccessModal}
        onClose={() => setShowClearSuccessModal(false)}
        title="Dados Limpos!"
        message={t('success.dataCleared')}
      />

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Erro ao Exportar"
        message={errorMessage}
      />
    </div>
  );
}
