"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useBranding } from "@/contexts/branding-context";

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  features: FeatureCard[];
  tagline: string;
  children: ReactNode;
  showBackToLogin?: boolean;
}

export function AuthLayout({
  title,
  subtitle,
  features,
  tagline,
  children,
  showBackToLogin = false,
}: AuthLayoutProps) {
  const { settings } = useBranding();
  
  return (
    <div className="min-h-screen flex bg-[#0F172A] text-white overflow-hidden font-sans">
      {/* --- LEFT PANEL (60% Desktop, Hidden Mobile) --- */}
      <div className="relative hidden w-full lg:flex lg:w-[60%] flex-col justify-between p-8 xl:p-12 bg-gradient-to-br from-[#1E3A2F] via-[#0F172A] to-[#0F172A]">
        {/* Decorative Background Orbs */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px] opacity-50" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] opacity-40" />
        </div>

        {/* LOGO */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            {/* Mostrar logo se habilitado */}
            {settings.show_login_logo && settings.logo_url_login ? (
              <img src={settings.logo_url_login} alt={settings.appName} className="h-12 w-auto object-contain" />
            ) : settings.show_login_logo && settings.appLogoUrl ? (
              <img src={settings.appLogoUrl} alt={settings.appName} className="w-12 h-12 rounded-xl object-cover" />
            ) : !settings.show_login_logo && (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-2xl font-bold text-white">{settings.appName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            {/* Mostrar nome se habilitado */}
            {settings.show_login_name !== false && (
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {settings.appName}
              </h1>
            )}
          </Link>
        </div>

        {/* Features */}
        <div className="relative flex-1 flex items-center justify-center py-8">
          <div className="relative w-full max-w-[600px] space-y-8">
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-3xl font-bold text-white">{title}</h2>
              <p className="text-zinc-400 text-lg">{subtitle}</p>
            </motion.div>

            {/* Feature Cards */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-[#1E293B]/60 backdrop-blur-xl border border-white/10"
                >
                  <div className="p-2 bg-primary/20 rounded-lg flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-zinc-400">{feature.subtitle}</p>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <p className="text-base text-zinc-400 max-w-lg leading-relaxed">
            "{tagline}"
          </p>
        </div>
      </div>

      {/* --- RIGHT PANEL (40% Desktop, Full Mobile) --- */}
      <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-6 lg:p-8 xl:p-12 bg-[#0F172A] lg:border-l border-white/5 relative min-h-screen">
        
        {/* Mobile Background Decoration */}
        <div className="absolute inset-0 lg:hidden pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-[440px] space-y-6 relative z-10">
          
          {/* Brand Name (Mobile/Right Panel) */}
          <div className="text-center lg:text-left lg:hidden mb-8">
            <Link href="/" className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-2xl font-bold text-white">{settings.appName.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-2xl font-bold tracking-wide text-white">
                {settings.appName}
              </span>
            </Link>
          </div>

          {/* Content */}
          {children}

          {/* Language Selector */}
          <div className="pt-4">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </div>
  );
}
