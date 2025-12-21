"use client";

import { AccountFilterProvider } from "@/contexts/account-filter-context";
import { SubscriptionLockModal } from "@/components/dashboard/subscription-lock-modal";
import dynamic from 'next/dynamic';

// Sidebar com SSR desabilitado para evitar flash de branding
const DashboardSidebarDynamic = dynamic(
  () => import('@/components/dashboard/sidebar').then(m => ({
    default: m.DashboardSidebar
  })),
  {
    ssr: false,
    loading: () => (
      <div className="w-[260px] bg-[#111827] border-r border-white/5 animate-pulse flex-shrink-0" />
    )
  }
);

// Header com SSR desabilitado para evitar flash do nome do usuário
const DashboardHeaderDynamic = dynamic(
  () => import('@/components/dashboard/header').then(m => ({
    default: m.DashboardHeader
  })),
  {
    ssr: false,
    loading: () => (
      <div className="h-16 bg-[#0A0F1C] border-b border-white/5 animate-pulse" />
    )
  }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccountFilterProvider>
      <div className="flex h-screen bg-[#0A0F1C] text-white overflow-hidden">
        <SubscriptionLockModal />

        {/* Sidebar */}
        <DashboardSidebarDynamic />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <DashboardHeaderDynamic />

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </AccountFilterProvider>
  );
}
