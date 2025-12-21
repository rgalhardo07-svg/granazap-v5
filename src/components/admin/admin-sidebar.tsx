"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, BarChart3, Settings, Shield, ArrowLeft, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Gestão de Usuários",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Gestão de Planos",
    href: "/admin/plans",
    icon: CreditCard,
  },
  {
    title: "Estatísticas",
    href: "/admin/stats",
    icon: BarChart3,
  },
  {
    title: "Configurações",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#111827] border-r border-white/5 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        </div>
        <p className="text-sm text-zinc-400">Painel Administrativo</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Voltar ao Dashboard</span>
        </Link>
      </div>
    </aside>
  );
}
