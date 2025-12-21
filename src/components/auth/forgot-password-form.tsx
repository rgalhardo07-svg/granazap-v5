"use client";

import { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";

type ForgotPasswordFormValues = {
  email: string;
};

export function ForgotPasswordForm() {
  const { t } = useLanguage();
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  
  // Schema for validation with translations
  const forgotPasswordSchema = z.object({
    email: z.string().email({ message: t('error.invalidEmail') }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) {
        alert('Erro ao enviar email de recuperação. Tente novamente.');
        return;
      }

      // Sucesso! Mostrar mensagem
      setUserEmail(data.email);
      setEmailSent(true);

    } catch (error: any) {
      alert(t('error.generic'));
    }
  };

  // Se email foi enviado, mostrar mensagem de sucesso
  if (emailSent) {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/20 rounded-lg flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('forgot.emailSent')}
              </h3>
              <p className="text-sm text-zinc-300 mb-3">
                {t('forgot.emailSentTo')}
              </p>
              <p className="text-sm font-semibold text-primary mb-4">
                {userEmail}
              </p>
              <div className="space-y-2 text-sm text-zinc-400">
                <p>• {t('forgot.checkInbox')}</p>
                <p>• {t('forgot.linkExpires')}</p>
                <p>• {t('forgot.checkSpam')}</p>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setEmailSent(false)}
          variant="outline"
          className="w-full"
        >
          {t('forgot.sendToAnother')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-5">
      {/* Email Input */}
      <div className="flex flex-col w-full space-y-2">
        <label className="text-sm font-medium leading-none text-white" htmlFor="email">
          {t('forgot.email')}
        </label>
        <Input
          {...register("email")}
          id="email"
          placeholder="seu@email.com"
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          startIcon={<Mail className="h-5 w-5" />}
        />
        {errors.email && (
          <p className="text-xs text-red-400 ml-2">{errors.email.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-full"
      >
        {isSubmitting ? t('forgot.buttonLoading') : t('forgot.button')}
      </Button>
    </form>
  );
}
