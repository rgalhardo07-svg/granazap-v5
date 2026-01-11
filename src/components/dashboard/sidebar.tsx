"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Receipt,
  Wallet,
  CreditCard,
  Tag,
  Calendar,
  Target,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Globe,
  DollarSign,
  User,
  ChevronDown,
  MessageCircle,
  LogOut,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useUser } from "@/hooks/use-user";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { useBranding } from "@/contexts/branding-context";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { useUserPlan } from "@/hooks/use-user-plan";
import { useSidebar } from "@/contexts/sidebar-context";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const { user, profile, updateProfile } = useUser();
  const { filter: accountFilter, changeFilter } = useAccountFilter();
  const { settings } = useBranding();
  const { data: whatsappConfig } = useWhatsAppConfig();
  const { permiteModoPJ } = useUserPlan();
  const { isOpen, close } = useSidebar();
  const [collapsed, setCollapsed] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    close();
  }, [pathname]);

  // Prevent body scroll when sidebar is open (mobile)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navigation = [
    { name: t('sidebar.dashboard'), href: "/dashboard", icon: LayoutDashboard },
    { name: t('sidebar.income'), href: "/dashboard/receitas", icon: TrendingUp },
    { name: t('sidebar.expenses'), href: "/dashboard/despesas", icon: TrendingDown },
    { name: t('sidebar.transactions'), href: "/dashboard/transacoes", icon: Receipt },
    { name: t('sidebar.cards'), href: "/dashboard/cartoes", icon: CreditCard },
    { name: t('sidebar.accounts'), href: "/dashboard/contas", icon: Wallet },
    { name: t('sidebar.investments'), href: "/dashboard/investimentos", icon: TrendingUp },
    { name: t('sidebar.categories'), href: "/dashboard/categorias", icon: Tag },
    { name: t('sidebar.scheduled'), href: "/dashboard/agendados", icon: Calendar },
    { name: t('sidebar.goals'), href: "/dashboard/metas", icon: Target },
    { name: t('sidebar.reports'), href: "/dashboard/relatorios", icon: BarChart3 },
  ];

  const handleLanguageChange = async (lang: 'pt' | 'es' | 'en') => {
    setLanguage(lang);
    if (profile) {
      await updateProfile({ idioma: lang });
    }
    setShowLanguageMenu(false);
  };

  const handleCurrencyChange = async (curr: 'BRL' | 'USD' | 'EUR' | 'PYG' | 'ARS') => {
    if (profile) {
      await updateProfile({ moeda: curr });
    }
    setShowCurrencyMenu(false);
  };

  // Filtro de tipo de conta - usa o hook centralizado
  const handleAccountFilterChange = (type: 'pessoal' | 'pj') => {
    changeFilter(type);
  };

  // Verificar quais tipos de conta o usuário pode acessar
  const tiposContaPermitidos = profile?.is_dependente 
    ? (profile?.tipos_conta_permitidos || ['pessoal', 'pj'])
    : ['pessoal', 'pj'];
  
  const podeVerPessoal = tiposContaPermitidos.includes('pessoal');
  const podeVerPJ = tiposContaPermitidos.includes('pj');

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-[#111827] border-r border-white/5 flex flex-col transition-all duration-300",
          "fixed md:static inset-y-0 left-0 z-50",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-20" : "w-[260px]"
        )}
      >
      {/* Logo & Brand */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-3">
            {/* Mostrar logo se habilitado */}
            {settings.show_sidebar_logo && settings.logo_url_sidebar ? (
              <img src={settings.logo_url_sidebar} alt={settings.appName} className="h-10 w-auto object-contain" />
            ) : settings.show_sidebar_logo && settings.appLogoUrl ? (
              <img src={settings.appLogoUrl} alt={settings.appName} className="w-10 h-10 rounded-xl object-cover" />
            ) : !settings.show_sidebar_logo && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.primaryColor}dd)` }}
              >
                <span className="text-xl font-bold text-white">{settings.appName.charAt(0)}</span>
              </div>
            )}
            {/* Mostrar nome se habilitado */}
            {settings.show_sidebar_name !== false && (
              <span className="text-xl font-bold text-white">{settings.appName}</span>
            )}
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Account Filter Toggle */}
      {!collapsed && permiteModoPJ && (podeVerPessoal || podeVerPJ) && (
        <div className="p-4">
          <div className="flex gap-2 p-1 bg-[#0A0F1C] rounded-lg">
            {podeVerPessoal && (
              <button
                onClick={() => handleAccountFilterChange("pessoal")}
                className={cn(
                  "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all",
                  accountFilter === "pessoal"
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                👤 {t('sidebar.personal')}
              </button>
            )}
            {podeVerPJ && (
              <button
                onClick={() => handleAccountFilterChange("pj")}
                className={cn(
                  "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all",
                  accountFilter === "pj"
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                🏢 {t('sidebar.pj')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-4 border-t border-white/5" />

        {/* Settings */}
        <Link
          href="/dashboard/configuracoes"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
            pathname === "/dashboard/configuracoes"
              ? "bg-primary/10 text-primary"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          )}
          title={collapsed ? t('sidebar.settings') : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">{t('sidebar.settings')}</span>}
        </Link>

        {/* WhatsApp Button */}
        {whatsappConfig?.whatsapp_enabled && (
          <Link
            href="/dashboard/whatsapp-agent"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              pathname === '/dashboard/whatsapp-agent'
                ? "bg-white/10 text-green-400"
                : "text-green-400 hover:text-green-300 hover:bg-green-500/10"
            )}
            title={collapsed ? whatsappConfig.whatsapp_contact_text : undefined}
          >
            <MessageCircle className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">{whatsappConfig.whatsapp_contact_text}</span>
            )}
          </Link>
        )}

        {/* PWA Installation Link */}
        <Link
          href="/dashboard/instalacao"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
            pathname === '/dashboard/instalacao'
              ? "bg-white/10 text-orange-400"
              : "text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
          )}
          title={collapsed ? 'Instalar App' : undefined}
        >
          <Download className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">Instalar App</span>
          )}
        </Link>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/5 space-y-3">
        {/* User Info */}
        {!collapsed && profile && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
              {profile.nome.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile.nome}</p>
              <p className="text-xs text-zinc-500 truncate">{profile.email}</p>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={async () => {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = '/';
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
            "text-red-400 hover:text-red-300 hover:bg-red-500/10"
          )}
          title={collapsed ? "Sair da Conta" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sair da Conta</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
