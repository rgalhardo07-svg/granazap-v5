"use client";

import { useState } from "react";
import { SettingsSidebar } from "@/components/dashboard/settings/settings-sidebar";
import { ProfileSettings } from "@/components/dashboard/settings/profile-settings";
import { NotificationSettings } from "@/components/dashboard/settings/notification-settings";
import { SharedManagement } from "@/components/dashboard/settings/shared-management";
import { SubscriptionCard } from "@/components/dashboard/settings/subscription-card";
import { SecuritySettings } from "@/components/dashboard/settings/security-settings";
import { DataManagement } from "@/components/dashboard/settings/data-management";
import { Settings } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export default function SettingsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'shared':
        return <SharedManagement />;
      case 'subscription':
        return <SubscriptionCard />;
      case 'security':
        return <SecuritySettings />;
      case 'data':
        return <DataManagement />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="w-6 h-6 md:w-8 md:h-8 text-[#22C55E]" />
          {t('settings.title')}
        </h1>
        <p className="text-zinc-400 text-xs md:text-sm mt-1">
          {t('settings.description')}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Sidebar */}
        <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-[#0A0F1C] md:bg-transparent rounded-xl">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
