"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { Loader2, User, Mail, Phone, Globe, DollarSign, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

export function ProfileSettings() {
  const { profile, user, updateProfile, refresh } = useUser();
  const { t, setLanguage } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Local state para formulário
  const [formData, setFormData] = useState({
    nome: profile?.nome || "",
    celular: profile?.celular || "",
    idioma: profile?.idioma || "pt",
    moeda: profile?.moeda || "BRL",
  });

  // Atualizar formData quando profile carregar
  useEffect(() => {
    if (profile) {
      setFormData({
        nome: profile.nome || "",
        celular: profile.celular || "",
        idioma: profile.idioma || "pt",
        moeda: profile.moeda || "BRL",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { success, error } = await updateProfile({
        nome: formData.nome,
        // Celular removido da atualização pois é bloqueado
        idioma: formData.idioma as any,
        moeda: formData.moeda as any,
      });

      if (!success) throw new Error(error);
      
      // Atualizar contexto de linguagem
      if (formData.idioma) {
        setLanguage(formData.idioma as any);
      }
      
      // Recarregar profile do banco
      await refresh();
      
      // Mostrar feedback de sucesso usando state ao invés de manipulação direta do DOM
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 2000);
      
    } catch (error: any) {
      alert(t('settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Dados Pessoais */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-white">{t('settings.myProfile')}</h3>
          <p className="text-sm text-zinc-400">{t('settings.updateInfo')}</p>
        </div>
        
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6 space-y-6">
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">{t('settings.name')}</label>
              <input
                type="text"
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">{t('settings.email')}</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-zinc-500 cursor-not-allowed opacity-60"
              />
              <p className="text-xs text-zinc-600 italic">
                {t('settings.managedBySystem')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">{t('settings.phone')}</label>
              <input
                type="tel"
                value={formData.celular}
                disabled
                className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-zinc-500 cursor-not-allowed opacity-60"
              />
              <p className="text-xs text-zinc-600 italic">
                {t('settings.managedBySystem')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preferências */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-white">{t('settings.preferences')}</h3>
        </div>
        
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">{t('settings.language')}</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <select
                  value={formData.idioma}
                  onChange={e => setFormData({...formData, idioma: e.target.value as "pt" | "en" | "es"})}
                  className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white appearance-none focus:outline-none focus:border-blue-500"
                >
                  <option value="pt">Português (Brasil)</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">{t('settings.currency')}</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <select
                  value={formData.moeda}
                  onChange={e => setFormData({...formData, moeda: e.target.value as "BRL" | "USD" | "EUR" | "PYG" | "ARS"})}
                  className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white appearance-none focus:outline-none focus:border-blue-500"
                >
                  <option value="BRL">Real Brasileiro (BRL)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="PYG">Guarani Paraguaio (PYG)</option>
                  <option value="ARS">Peso Argentino (ARS)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "w-full md:w-auto px-6 md:px-8 py-3 min-h-[48px] text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm md:text-base",
            saved ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
          )}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? t('settings.saving') : saved ? t('settings.saved') : t('settings.save')}
        </button>
      </div>
    </div>
  );
}
