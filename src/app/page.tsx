"use client";

import Link from "next/link";
import { TrendingUp, Users, Shield, Lock } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useLanguage } from "@/contexts/language-context";
import { useBranding } from "@/contexts/branding-context";
import { replaceAppName } from "@/lib/replace-app-name";

export default function LoginPage() {
  const { t } = useLanguage();
  const { settings } = useBranding();

  const features = [
    {
      icon: TrendingUp,
      title: t('features.track'),
      subtitle: t('features.trackSub'),
    },
    {
      icon: Users,
      title: t('features.goals'),
      subtitle: t('features.goalsSub'),
    },
    {
      icon: Shield,
      title: t('features.access'),
      subtitle: t('features.accessSub'),
    },
    {
      icon: Lock,
      title: t('features.secure'),
      subtitle: t('features.secureSub'),
    },
  ];

  return (
    <AuthLayout
      title={replaceAppName(t('features.welcome'), settings.appName)}
      subtitle={t('features.description')}
      features={features}
      tagline={t('security.tagline')}
    >
      {/* Header */}
      <div className="text-center lg:text-left space-y-2 mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
          {t('login.title')}
        </h2>
        <p className="text-zinc-400 text-base">{t('login.subtitle')}</p>
      </div>

      {/* Login Form */}
      <div className="space-y-6">
        <LoginForm />

        {/* Sign Up Link */}
        <div className="mt-6 text-center text-sm text-zinc-400">
          {t('login.noAccount')}{" "}
          <Link href="/cadastro" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            {t('login.signUp')}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}