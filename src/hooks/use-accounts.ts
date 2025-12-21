import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface BankAccount {
  id: string;
  usuario_id: string;
  nome: string;
  saldo_atual: number;
  is_default: boolean;
  is_archived: boolean;
  tipo_conta: 'pessoal' | 'pj';
  banco?: string;
  created_at: string;
  updated_at: string;
}

export function useAccounts(tipoConta: 'pessoal' | 'pj') {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('🏦 Buscando contas:', { userId: user.id, tipoConta });

      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('tipo_conta', tipoConta)
        .eq('is_archived', false)
        .order('is_default', { ascending: false })
        .order('nome', { ascending: true });

      console.log('🏦 Resultado contas:', { total: data?.length || 0, error });

      if (error) throw error;

      setAccounts(data || []);
    } catch (error) {
      console.error('❌ Erro ao buscar contas:', error);
    } finally {
      setLoading(false);
    }
  }, [tipoConta]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = async (data: Omit<BankAccount, 'id' | 'usuario_id' | 'created_at' | 'updated_at' | 'is_archived' | 'tipo_conta'>) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Se esta for a conta padrão, remove o padrão das outras
    if (data.is_default) {
      await supabase
        .from('contas_bancarias')
        .update({ is_default: false })
        .eq('usuario_id', user.id)
        .eq('tipo_conta', tipoConta);
    }

    const { error } = await supabase
      .from('contas_bancarias')
      .insert({
        ...data,
        usuario_id: user.id,
        tipo_conta: tipoConta,
        is_archived: false
      });

    if (error) throw error;

    fetchAccounts();
    return true;
  };

  const updateAccount = async (id: string, data: Partial<Omit<BankAccount, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>>) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Se for definir como padrão, remove o padrão das outras
    if (data.is_default) {
      await supabase
        .from('contas_bancarias')
        .update({ is_default: false })
        .eq('usuario_id', user.id)
        .eq('tipo_conta', tipoConta)
        .neq('id', id);
    }

    const { error } = await supabase
      .from('contas_bancarias')
      .update(data)
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;

    fetchAccounts();
    return true;
  };

  const archiveAccount = async (id: string) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('contas_bancarias')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) throw error;

    fetchAccounts();
    return true;
  };

  const deleteAccount = async (id: string) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('contas_bancarias')
      .delete()
      .eq('id', id);

    if (error) throw error;

    fetchAccounts();
    return true;
  };

  return {
    accounts,
    loading,
    fetchAccounts,
    createAccount,
    updateAccount,
    archiveAccount,
    deleteAccount
  };
}
