"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

export function ResetPasswordForm() {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Schema for validation with translations
  const resetPasswordSchema = z.object({
    password: z.string().min(6, { message: t('error.passwordMin') }),
    confirmPassword: z.string().min(6, { message: t('error.confirmPassword') }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('error.passwordMismatch'),
    path: ["confirmPassword"],
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        alert(t('error.generic'));
        return;
      }

      // Sucesso!
      alert('Senha redefinida com sucesso! Você será redirecionado para o login.');
      
      // Redirecionar para login
      window.location.href = '/';

    } catch (error: any) {
      alert('Erro ao redefinir senha. Tente novamente.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-5">
      {/* Password Input */}
      <div className="flex flex-col w-full space-y-2">
        <label className="text-sm font-medium leading-none text-white" htmlFor="password">
          {t('reset.newPassword')}
        </label>
        <Input
          {...register("password")}
          id="password"
          placeholder="Mínimo 6 caracteres"
          type={showPassword ? "text" : "password"}
          startIcon={<Lock className="h-5 w-5" />}
          endIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-zinc-500 hover:text-white focus:outline-none transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          }
        />
        {errors.password && (
          <p className="text-xs text-red-400 ml-2">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password Input */}
      <div className="flex flex-col w-full space-y-2">
        <label className="text-sm font-medium leading-none text-white" htmlFor="confirmPassword">
          {t('reset.confirmPassword')}
        </label>
        <Input
          {...register("confirmPassword")}
          id="confirmPassword"
          placeholder="Digite a senha novamente"
          type={showConfirmPassword ? "text" : "password"}
          startIcon={<Lock className="h-5 w-5" />}
          endIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-zinc-500 hover:text-white focus:outline-none transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          }
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-400 ml-2">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Password Requirements */}
      <div className="bg-[#1E293B]/60 rounded-lg p-4 border border-white/10">
        <p className="text-xs text-zinc-400 mb-2 font-medium">{t('reset.requirements')}</p>
        <ul className="text-xs text-zinc-500 space-y-1">
          <li>• {t('reset.minChars')}</li>
          <li>• {t('reset.useSymbols')}</li>
          <li>• {t('reset.avoidObvious')}</li>
        </ul>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-full"
      >
        {isSubmitting ? t('reset.buttonLoading') : t('reset.button')}
      </Button>
    </form>
  );
}
