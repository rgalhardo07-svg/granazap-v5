"use client";

import { Shield, Lock, CheckCircle } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useLanguage } from "@/contexts/language-context";

export default function ResetPasswordPage() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Lock,
      title: t('security.minChars'),
      subtitle: t('security.minCharsDesc'),
    },
    {
      icon: Shield,
      title: t('security.unique'),
      subtitle: t('security.uniqueDesc'),
    },
    {
      icon: CheckCircle,
      title: t('security.memorable'),
      subtitle: t('security.memorableDesc'),
    },
  ];

  return (
    <AuthLayout
      title={t('security.createSecure')}
      subtitle={t('security.createSecureDesc')}
      features={features}
      tagline={t('security.priority')}
    >
      {/* Header */}
      <div className="text-center lg:text-left space-y-2 mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
          {t('reset.title')}
        </h2>
        <p className="text-zinc-400 text-base">{t('reset.subtitle')}</p>
      </div>

      {/* Reset Password Form */}
      <div className="space-y-6">
        <ResetPasswordForm />
      </div>
    </AuthLayout>
  );
}
