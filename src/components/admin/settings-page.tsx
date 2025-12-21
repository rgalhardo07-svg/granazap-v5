"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Palette } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SuccessModal } from "./success-modal";
import { WhatsAppSettings } from "./whatsapp-settings";
import { AdminSettings } from "./admin-settings";
import { LogoSettings } from "./logo-settings";

interface WhiteLabelSettings {
  app_name: string;
  app_logo_url: string;
  primary_color: string;
  secondary_color: string;
  support_email: string;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<WhiteLabelSettings>({
    app_name: "GranaZap",
    app_logo_url: "",
    primary_color: "#22C55E",
    secondary_color: "#0A0F1C",
    support_email: "suporte@granazap.com",
  });
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.rpc('get_system_settings');
      
      if (error) throw error;
      
      // A RPC pode retornar um array ou objeto direto
      const settingsData = Array.isArray(data) ? data[0] : data;
      
      if (settingsData) {
        const newSettings = {
          app_name: settingsData.app_name || "GranaZap",
          app_logo_url: settingsData.app_logo_url || "",
          primary_color: settingsData.primary_color || "#22C55E",
          secondary_color: settingsData.secondary_color || "#0A0F1C",
          support_email: settingsData.support_email || "suporte@granazap.com",
        };
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      
      const result = await supabase.rpc('update_system_settings', {
        p_app_name: settings.app_name,
        p_app_logo_url: settings.app_logo_url,
        p_primary_color: settings.primary_color,
        p_secondary_color: settings.secondary_color,
        p_support_email: settings.support_email,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Erro ao salvar configurações');
      }

      // A função retorna um array com um objeto {success, message}
      const response = Array.isArray(result.data) ? result.data[0] : result.data;

      if (response && !response.success) {
        throw new Error(response.message || 'Erro ao salvar configurações');
      }
      
      setShowSuccessModal(true);
      // Recarregar a página para aplicar as mudanças globais
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      alert(`Erro ao salvar configurações: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const themes = [
    {
      name: "GranaZap Original",
      primary: "#22C55E",
      secondary: "#0A0F1C",
      preview: "bg-[#22C55E]"
    },
    {
      name: "Nubank Style",
      primary: "#8A05BE",
      secondary: "#0A0F1C",
      preview: "bg-[#8A05BE]"
    },
    {
      name: "Inter Style",
      primary: "#FF7A00",
      secondary: "#111827",
      preview: "bg-[#FF7A00]"
    },
    {
      name: "Neon Blue",
      primary: "#3B82F6",
      secondary: "#0F172A",
      preview: "bg-[#3B82F6]"
    },
    {
      name: "Hot Pink",
      primary: "#EC4899",
      secondary: "#000000",
      preview: "bg-[#EC4899]"
    }
  ];

  const applyTheme = (theme: typeof themes[0]) => {
    setSettings({
      ...settings,
      primary_color: theme.primary,
      secondary_color: theme.secondary
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-white">Configurações da Plataforma</h1>
        </div>
        <p className="text-zinc-400">Personalize a aparência da plataforma</p>
      </div>

      {/* Admin Settings */}
      <div className="mb-8">
        <AdminSettings />
      </div>

      {/* WhatsApp Settings */}
      <div className="mb-8">
        <WhatsAppSettings />
      </div>

      {/* Logo Settings */}
      <div className="mb-8">
        <LogoSettings />
      </div>

      {/* Identidade Visual */}
      <div className="bg-[#0A0F1C] border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Palette className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-white">Identidade Visual</h2>
        </div>

        {/* Temas Pré-definidos */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            Temas Pré-definidos
          </label>
          <div className="flex flex-wrap gap-4">
            {themes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => applyTheme(theme)}
                className="group relative flex items-center gap-3 px-4 py-3 bg-[#111827] border border-white/10 rounded-xl hover:border-white/20 hover:bg-[#1F2937] transition-all"
              >
                <div className={`w-4 h-4 rounded-full ${theme.preview}`} />
                <span className="text-sm font-medium text-white">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome do App */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Nome da Aplicação
            </label>
            <input
              type="text"
              value={settings.app_name}
              onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
              className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
            />
          </div>

          {/* Email de Suporte */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Email de Suporte
            </label>
            <input
              type="email"
              value={settings.support_email}
              onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              placeholder="suporte@seudominio.com"
              className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-zinc-500 mt-2">
              Email exibido nas páginas de Termos, Política de Privacidade e suporte geral
            </p>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              URL do Logo
            </label>
            <input
              type="text"
              value={settings.app_logo_url}
              onChange={(e) => setSettings({ ...settings, app_logo_url: e.target.value })}
              placeholder="https://..."
              className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Cor Primária */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Cor Primária
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.primary_color}
                onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                className="w-16 h-12 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={settings.primary_color}
                onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                className="flex-1 bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>

          {/* Cor Secundária */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Cor Secundária
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.secondary_color}
                onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                className="w-16 h-12 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={settings.secondary_color}
                onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                className="flex-1 bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Configurações Salvas!"
        message="As configurações da plataforma foram atualizadas com sucesso."
      />
    </div>
  );
}
