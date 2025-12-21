"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Lock, ShieldCheck, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

export function SecuritySettings() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  
  const supabase = createClient();

  const handleUpdatePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      alert(t('settings.passwordMismatch'));
      return;
    }
    
    if (passwords.new.length < 6) {
      alert(t('settings.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;
      
      alert(t('settings.passwordUpdated'));
      setPasswords({ current: "", new: "", confirm: "" });
      
    } catch (error: any) {
      alert(error.message || t('settings.passwordError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white">{t('settings.security')}</h3>
        <p className="text-sm text-zinc-400">{t('settings.changePasswordDesc')}</p>
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h4 className="font-medium text-white">{t('settings.changePassword')}</h4>
            <p className="text-sm text-zinc-400 mt-1">
              {t('settings.passwordStrengthDesc')}
            </p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">{t('settings.newPassword')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                value={passwords.new}
                onChange={e => setPasswords({...passwords, new: e.target.value})}
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#22C55E]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">{t('settings.confirmPassword')}</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                value={passwords.confirm}
                onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#22C55E]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            onClick={handleUpdatePassword}
            disabled={loading || !passwords.new || !passwords.confirm}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('settings.changePassword')}
          </button>
        </div>
      </div>
    </div>
  );
}
