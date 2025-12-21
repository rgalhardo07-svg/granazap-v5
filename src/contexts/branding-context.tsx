"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hexToHSL } from "@/lib/colors";

interface BrandingSettings {
  appName: string;
  appLogoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  supportEmail: string;
  habilitar_modo_pj?: boolean;
  bloquear_cadastro_novos_usuarios?: boolean;
  show_sidebar_logo?: boolean;
  show_sidebar_name?: boolean;
  show_login_logo?: boolean;
  show_login_name?: boolean;
  logo_url_sidebar?: string;
  logo_url_login?: string;
  favicon_url?: string;
}

const defaultSettings: BrandingSettings = {
  appName: "GranaZap",
  appLogoUrl: "",
  primaryColor: "#22C55E",
  secondaryColor: "#0A0F1C",
  supportEmail: "suporte@granazap.com",
  habilitar_modo_pj: true,
  bloquear_cadastro_novos_usuarios: false,
};

interface BrandingContextType {
  settings: BrandingSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => { },
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<BrandingSettings>(() => {
    // Usar dados do blocking script se disponível
    if (typeof window !== 'undefined' && window.__BRANDING__) {
      return window.__BRANDING__;
    }
    return defaultSettings;
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Carregar cache do localStorage (após hydration)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('branding_settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          setSettings(parsed);
          setLoading(false);
        }
      } catch (e) {
        console.error('Erro ao carregar cache:', e);
      }
    }
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.rpc('get_system_settings');

      if (!error && data) {
        // A RPC retorna um array, pegar o primeiro item
        const settingsData = Array.isArray(data) ? data[0] : data;

        if (settingsData) {
          const newSettings = {
            appName: settingsData.app_name || defaultSettings.appName,
            appLogoUrl: settingsData.app_logo_url || defaultSettings.appLogoUrl,
            primaryColor: settingsData.primary_color || defaultSettings.primaryColor,
            secondaryColor: settingsData.secondary_color || defaultSettings.secondaryColor,
            supportEmail: settingsData.support_email || defaultSettings.supportEmail,
            habilitar_modo_pj: settingsData.habilitar_modo_pj !== false, // Default true
            bloquear_cadastro_novos_usuarios: settingsData.bloquear_cadastro_novos_usuarios === true, // Default false
            show_sidebar_logo: settingsData.show_sidebar_logo || false,
            show_sidebar_name: settingsData.show_sidebar_name !== false, // Default true
            show_login_logo: settingsData.show_login_logo || false,
            show_login_name: settingsData.show_login_name !== false, // Default true
            logo_url_sidebar: settingsData.logo_url_sidebar || '',
            logo_url_login: settingsData.logo_url_login || '',
            favicon_url: settingsData.favicon_url || settingsData.app_logo_url || '',
          };

          setSettings(newSettings);

          // Aplicar cores CSS dinamicamente
          if (typeof document !== 'undefined') {
            const primaryColor = settingsData.primary_color || defaultSettings.primaryColor;

            // Tailwind 4 suporta HEX diretamente em variáveis CSS
            document.documentElement.style.setProperty('--primary', primaryColor);
            document.documentElement.style.setProperty('--ring', primaryColor);

            // Salvar TODAS as configurações no localStorage para evitar flash
            try {
              localStorage.setItem('branding_settings', JSON.stringify(newSettings));
            } catch (e) {
              console.error('Erro ao salvar branding no localStorage:', e);
            }

            // Opcional: Atualizar meta theme-color
            // const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            // if (metaThemeColor) metaThemeColor.setAttribute('content', primaryColor);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar branding:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar cores CSS do cache imediatamente (antes do primeiro paint)
  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('branding_settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          document.documentElement.style.setProperty('--primary', parsed.primaryColor);
          document.documentElement.style.setProperty('--ring', parsed.primaryColor);
        } else if (settings.primaryColor) {
          // Fallback: usar settings atual
          document.documentElement.style.setProperty('--primary', settings.primaryColor);
          document.documentElement.style.setProperty('--ring', settings.primaryColor);
        }
      } catch (e) {
        console.error('Erro ao aplicar cores:', e);
      }
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <BrandingContext.Provider value={{ settings, loading, refreshSettings: loadSettings }}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);
