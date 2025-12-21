"use client";

import { cn } from "@/lib/utils";
import { User, Settings, CreditCard, Shield, Database, Bell, Users } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface SettingsSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function SettingsSidebar({ activeTab, setActiveTab }: SettingsSidebarProps) {
  const { t } = useLanguage();

  const menuItems = [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'shared', label: t('settings.shared'), icon: Users },
    { id: 'subscription', label: t('settings.subscription'), icon: CreditCard },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'data', label: t('settings.data'), icon: Database },
  ];

  return (
    <div className="w-full md:w-64 flex flex-col gap-6 md:gap-8">
      {/* Container Scrollável no Mobile, Fixo no Desktop */}
      <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-4 md:pb-0 scrollbar-hide">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal flex-shrink-0 md:flex-shrink",
              activeTab === item.id
                ? "bg-blue-600/10 text-blue-500" // Azul como no print
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
