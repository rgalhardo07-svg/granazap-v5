"use client";

import Link from "next/link";
import { Shield, Users, TrendingUp } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useLanguage } from "@/contexts/language-context";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Shield,
      title: t('security.fast'),
      subtitle: t('security.fastDesc'),
    },
    {
      icon: Users,
      title: t('security.protected'),
      subtitle: t('security.protectedDesc'),
    },
    {
      icon: TrendingUp,
      title: t('security.immediate'),
      subtitle: t('security.immediateDesc'),
    },
  ];

  return (
    <AuthLayout
      title={t('security.recover')}
      subtitle={t('security.recoverDesc')}
      features={features}
      tagline={t('security.tagline')}
    >
      {/* Header */}
      <div className="text-center lg:text-left space-y-2 mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
          {t('forgot.title')}
        </h2>
        <p className="text-zinc-400 text-base">{t('forgot.subtitle')}</p>
      </div>

      {/* Forgot Password Form */}
      <div className="space-y-6">
        <ForgotPasswordForm />
        
        {/* Back to Login */}
        <div className="mt-6 text-center text-sm text-zinc-400">
          {t('forgot.remembered')}{" "}
          <Link href="/" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            {t('forgot.backToLogin')}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
