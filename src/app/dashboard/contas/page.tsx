"use client";

import { useState } from "react";
import { Plus, Wallet, Search, Filter, Edit2, Archive, Trash2, Landmark, Building2, User, Loader2, ArrowRightLeft, DollarSign, FileText, RefreshCw, MoreVertical, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { useAccounts, BankAccount } from "@/hooks/use-accounts";
import { AddAccountModal } from "./add-account-modal";
import { EditAccountModal } from "./edit-account-modal";
import { DeleteAccountModal } from "./delete-account-modal";
import { TransferModal } from "./transfer-modal";
import { ProLaboreModal } from "./pro-labore-modal";
import { AdjustBalanceModal } from "./adjust-balance-modal";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";
import { InfoCard } from "@/components/ui/info-card";
import { EmptyStateEducational } from "@/components/ui/empty-state-educational";

export default function ContasPage() {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { filter: accountFilter, changeFilter } = useAccountFilter();
  const { accounts, loading, fetchAccounts, updateAccount } = useAccounts(accountFilter);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isProLaboreModalOpen, setIsProLaboreModalOpen] = useState(false);

  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<BankAccount | null>(null);
  const [adjustingAccount, setAdjustingAccount] = useState<BankAccount | null>(null);
  const [transferSourceAccount, setTransferSourceAccount] = useState<BankAccount | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredAccounts = accounts.filter(account => 
    account.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.banco?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = filteredAccounts.reduce((acc, curr) => acc + curr.saldo_atual, 0);

  const handleSetDefault = async (account: BankAccount) => {
    if (account.is_default) return;
    await updateAccount(account.id, { is_default: true });
  };

  const openTransferModal = (sourceAccount?: BankAccount) => {
    setTransferSourceAccount(sourceAccount || null);
    setIsTransferModalOpen(true);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            {t('accounts.title')}
          </h1>
          <p className="text-xs md:text-sm text-zinc-400">{t('accounts.description')}</p>
        </div>

        <div className="flex items-center gap-2 bg-[#111827] p-1 rounded-lg border border-white/10">
          <button
            onClick={() => changeFilter('pessoal')}
            className={cn(
              "px-3 md:px-4 py-2 min-h-[44px] rounded-md text-xs md:text-sm font-medium transition-all flex items-center gap-2",
              accountFilter === 'pessoal' 
                ? "bg-blue-600 text-white shadow-lg" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{t('sidebar.personal')}</span>
          </button>
          <button
            onClick={() => changeFilter('pj')}
            className={cn(
              "px-3 md:px-4 py-2 min-h-[44px] rounded-md text-xs md:text-sm font-medium transition-all flex items-center gap-2",
              accountFilter === 'pj' 
                ? "bg-purple-600 text-white shadow-lg" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('sidebar.pj')}</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-[#111827] border border-white/10 rounded-xl p-4 md:p-5 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 md:w-32 md:h-32 bg-blue-500/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-3 md:mb-4 relative">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Wallet className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
            </div>
            <span className="text-[10px] md:text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('accounts.totalBalance')}</span>
          </div>
          <div className="relative">
            <span className="text-2xl md:text-3xl font-bold text-white block">
              {formatCurrency(totalBalance)}
            </span>
            <p className="text-xs md:text-sm text-zinc-500 mt-1">
              {t('accounts.sumAllAccounts')}
            </p>
          </div>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-xl p-4 md:p-5 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 md:w-32 md:h-32 bg-green-500/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-3 md:mb-4 relative">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Landmark className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
            </div>
            <span className="text-[10px] md:text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('accounts.activeAccounts')}</span>
          </div>
          <div className="relative">
            <span className="text-2xl md:text-3xl font-bold text-white block">
              {accounts.length}
            </span>
            <p className="text-xs md:text-sm text-zinc-500 mt-1">
              {t('accounts.institutionsRegistered')}
            </p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#111827] p-4 rounded-xl border border-white/10">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text"
            placeholder={t('accounts.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <Button
                onClick={() => openTransferModal()}
                className="flex-1 sm:flex-none bg-white text-black hover:bg-zinc-200 border-none shadow-lg"
            >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                {t('accounts.transfer')}
            </Button>
            {accountFilter === 'pj' && (
                <Button
                    onClick={() => setIsProLaboreModalOpen(true)}
                    className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20"
                >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Pró-labore
                </Button>
            )}
            <Button
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
            >
                <Plus className="w-4 h-4 mr-2" />
                {t('accounts.newAccount')}
            </Button>
        </div>
      </div>

      {/* Grid de Cards de Contas */}
      {loading ? (
        <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-zinc-500">{t('common.loading')}</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        searchTerm ? (
          <div className="text-center py-16 bg-[#111827] border border-white/10 rounded-xl border-dashed">
              <Wallet className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
              <p className="text-lg font-medium text-zinc-400">{t('accounts.noAccounts')}</p>
          </div>
        ) : (
          <EmptyStateEducational
            icon={Wallet}
            title="Nenhuma Conta Bancária Cadastrada"
            description="Cadastre suas contas bancárias para controlar saldos, fazer transferências e acompanhar toda movimentação financeira!"
            whatIs="Contas bancárias são onde você registra suas contas correntes, poupanças, carteiras digitais (Nubank, PicPay) e até dinheiro em espécie. O sistema atualiza o saldo automaticamente conforme você registra receitas e despesas."
            howToUse={[
              { step: 1, text: 'Clique em "+ Nova Conta" no canto superior direito' },
              { step: 2, text: 'Escolha o tipo: Conta Corrente, Poupança, Carteira Digital ou Dinheiro' },
              { step: 3, text: 'Preencha nome, banco e saldo inicial (quanto tem agora)' },
              { step: 4, text: 'Marque como "Conta Padrão" se for a principal (usada por padrão nas transações)' },
              { step: 5, text: 'Use "Ajustar Saldo" para corrigir diferenças ou "Transferência" para mover dinheiro entre contas' }
            ]}
            example='Exemplo: Você tem R$ 2.500 na conta corrente do Nubank e R$ 800 em dinheiro. Cadastre duas contas: "Nubank" (saldo R$ 2.500) e "Carteira" (saldo R$ 800). Quando receber salário, lança na conta Nubank. Quando sacar dinheiro, faça transferência de Nubank para Carteira!'
            actionButton={{
              label: '+ Cadastrar Primeira Conta',
              onClick: () => setIsAddModalOpen(true)
            }}
          />
        )
      ) : (
        <>
          {/* Info Card - Dica sobre Contas */}
          <InfoCard
            title={t('accounts.infoCardTitle')}
            description={t('accounts.infoCardDescription')}
            tips={[
              t('accounts.infoCardTip1'),
              t('accounts.infoCardTip2'),
              t('accounts.infoCardTip3'),
              t('accounts.infoCardTip4')
            ]}
            storageKey="bank-accounts-tip"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAccounts.map((account) => (
                <div key={account.id} className="bg-[#111827] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-500/30 transition-all shadow-lg shadow-black/20 group relative overflow-hidden">
                    
                    {/* Badge Tipo Conta */}
                    <div className={cn(
                        "absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider",
                        account.tipo_conta === 'pj' ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                    )}>
                        {account.tipo_conta === 'pj' ? t('sidebar.pj') : t('sidebar.personal')}
                    </div>

                    {/* Header do Card */}
                    <div className="flex justify-between items-start mb-6 mt-2">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                {account.nome}
                            </h3>
                            {account.banco && (
                                <p className="text-xs text-zinc-500">{account.banco}</p>
                            )}
                        </div>
                        <div className="p-2 bg-white/5 rounded-full">
                            <Landmark className="w-5 h-5 text-zinc-400" />
                        </div>
                    </div>

                    {/* Saldo */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm text-zinc-400">{t('accounts.currentBalance')}</p>
                            <button onClick={fetchAccounts} title={t('common.loading')} className="hover:text-blue-500 transition-colors">
                                <RefreshCw className="w-3 h-3 text-zinc-600 hover:rotate-180 transition-all duration-500" />
                            </button>
                        </div>
                        <p className={cn("text-3xl font-bold tracking-tight", account.saldo_atual >= 0 ? "text-green-400" : "text-red-400")}>
                            {formatCurrency(account.saldo_atual)}
                        </p>
                    </div>

                    {/* Conta Padrão Badge */}
                    <div className="mb-6 h-12 flex items-center">
                        {account.is_default ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg w-full">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <div>
                                    <p className="text-xs font-semibold text-blue-400">{t('accounts.default')}</p>
                                    <p className="text-[10px] text-blue-500/60 leading-none mt-0.5">Usada para lançamentos automáticos</p>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={() => handleSetDefault(account)}
                                className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-2 px-2 py-1 -ml-2 rounded-md hover:bg-white/5 transition-colors w-full"
                                title={t('accounts.setAsDefault')}
                            >
                                <div className="w-2 h-2 rounded-full border border-zinc-600"></div>
                                {t('accounts.setAsDefault')}
                            </button>
                        )}
                    </div>

                    {/* Ações */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                        <div className="grid grid-cols-4 gap-2">
                            <button 
                                onClick={() => openTransferModal(account)} 
                                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors group/btn"
                                title={t('accounts.makeTransfer')}
                            >
                                <ArrowRightLeft className="w-5 h-5 text-zinc-400 group-hover/btn:text-white transition-colors" />
                                <span className="text-[10px] text-zinc-500 group-hover/btn:text-zinc-300">{t('accounts.transfer')}</span>
                            </button>
                            
                            <button 
                                onClick={() => setAdjustingAccount(account)} 
                                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors group/btn"
                                title={t('accounts.adjustBalance')}
                            >
                                <DollarSign className="w-5 h-5 text-zinc-400 group-hover/btn:text-white transition-colors" />
                                <span className="text-[10px] text-zinc-500 group-hover/btn:text-zinc-300">{t('accounts.adjustBalance')}</span>
                            </button>

                            <Link 
                                href={`/dashboard/transacoes?conta_id=${account.id}`}
                                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors group/btn"
                                title={t('accounts.viewStatement')}
                            >
                                <FileText className="w-5 h-5 text-zinc-400 group-hover/btn:text-white transition-colors" />
                                <span className="text-[10px] text-zinc-500 group-hover/btn:text-zinc-300">{t('accounts.viewStatement')}</span>
                            </Link>

                            <button 
                                onClick={() => setEditingAccount(account)} 
                                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors group/btn"
                                title={t('accounts.editAccount')}
                            >
                                <Edit2 className="w-5 h-5 text-zinc-400 group-hover/btn:text-white transition-colors" />
                                <span className="text-[10px] text-zinc-500 group-hover/btn:text-zinc-300">{t('common.edit')}</span>
                            </button>
                        </div>
                        
                        <button 
                            onClick={() => setDeletingAccount(account)}
                            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors border border-transparent hover:border-red-500/10"
                            title={t('accounts.deleteAccount')}
                        >
                            <Archive className="w-3.5 h-3.5" />
                            {t('accounts.deleteAccount')}
                        </button>
                    </div>

                </div>
            ))}
          </div>
        </>
      )}

      <AddAccountModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchAccounts}
      />

      <EditAccountModal
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        onSuccess={fetchAccounts}
        account={editingAccount}
      />

      <DeleteAccountModal
        isOpen={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        onSuccess={fetchAccounts}
        account={deletingAccount}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={fetchAccounts}
        initialSourceAccount={transferSourceAccount}
      />

      <ProLaboreModal
        isOpen={isProLaboreModalOpen}
        onClose={() => setIsProLaboreModalOpen(false)}
        onSuccess={fetchAccounts}
      />

      <AdjustBalanceModal
        isOpen={!!adjustingAccount}
        onClose={() => setAdjustingAccount(null)}
        onSuccess={fetchAccounts}
        account={adjustingAccount}
      />
    </div>
  );
}
