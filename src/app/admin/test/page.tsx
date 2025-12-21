"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminTestPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const testIsAdmin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('is_user_admin');
      if (error) throw error;
      setResult({ is_admin: data });
      setError(null);
    } catch (err: any) {
      setError(err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const testListPlans = async () => {
    setLoading(true);
    try {
      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User:', user);
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      const { data, error } = await supabase.rpc('admin_list_plans');
      console.log('Response:', { data, error });
      
      if (error) {
        throw {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          full: error
        };
      }
      
      setResult({ plans: data });
      setError(null);
    } catch (err: any) {
      console.error('Erro completo:', err);
      setError(err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const testListUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_list_users', {
        p_search: '',
        p_limit: 10,
        p_offset: 0,
      });
      if (error) throw error;
      setResult({ users: data });
      setError(null);
    } catch (err: any) {
      setError(err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const testGetStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_user_stats');
      if (error) throw error;
      setResult({ stats: data });
      setError(null);
    } catch (err: any) {
      setError(err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-[#0A0F1C] min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-8">🧪 Teste Admin Functions</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={testIsAdmin}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
        >
          Testar is_user_admin()
        </button>
        
        <button
          onClick={testListPlans}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
        >
          Testar admin_list_plans()
        </button>
        
        <button
          onClick={testListUsers}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
        >
          Testar admin_list_users()
        </button>
        
        <button
          onClick={testGetStats}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
        >
          Testar admin_get_user_stats()
        </button>
      </div>

      {loading && (
        <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-6 text-yellow-400">
          ⏳ Carregando...
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-6 mb-4">
          <h2 className="text-red-400 font-bold mb-2">❌ Erro:</h2>
          <pre className="text-red-300 text-sm overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}

      {result && (
        <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-6">
          <h2 className="text-green-400 font-bold mb-2">✅ Resultado:</h2>
          <pre className="text-green-300 text-sm overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
