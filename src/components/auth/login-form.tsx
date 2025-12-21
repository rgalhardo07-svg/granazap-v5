"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/language-context";
import { EmailPendingModal } from "@/components/ui/email-pending-modal";
import { ErrorModal } from "@/components/ui/error-modal";

type LoginFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export function LoginForm() {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailPendingModal, setShowEmailPendingModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  
  // Schema for validation with translations
  const loginSchema = z.object({
    email: z.string().email({ message: t('error.invalidEmail') }),
    password: z.string().min(6, { message: t('error.passwordMin') }),
    rememberMe: z.boolean(),
  });
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      // Importar dinamicamente para evitar problemas de SSR
      const { loginUser } = await import('@/lib/auth/login');
      
      const result = await loginUser({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe
      });

      if (!result.success) {
        // Verificar se o erro é de email não confirmado
        if (result.error?.includes('confirme seu email') || 
            result.error?.includes('Email not confirmed') ||
            result.error?.toLowerCase().includes('confirm')) {
          setPendingEmail(data.email);
          setShowEmailPendingModal(true);
          return;
        }
        
        // Mostrar modal de erro
        setErrorMessage(result.error || 'Email ou senha incorretos');
        setShowErrorModal(true);
        return;
      }

      // Sucesso! Redirecionar para dashboard
      window.location.href = '/dashboard';
      
    } catch (error: any) {
      setErrorMessage('Erro ao fazer login. Tente novamente.');
      setShowErrorModal(true);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-5">
      {/* Email Input */}
      <div className="flex flex-col w-full space-y-2">
        <label className="text-sm font-medium leading-none text-white" htmlFor="email">
          {t('login.email')}
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

      {/* Password Input */}
      <div className="flex flex-col w-full space-y-2">
        <label className="text-sm font-medium leading-none text-white" htmlFor="password">
          {t('login.password')}
        </label>
        <Input
          {...register("password")}
          id="password"
          placeholder="Digite sua senha"
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

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between mt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <Controller
            control={control}
            name="rememberMe"
            render={({ field }) => (
              <Checkbox
                id="rememberMe"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <span className="text-sm text-zinc-400 select-none">{t('login.rememberMe')}</span>
        </label>
        <Link className="text-sm text-primary hover:text-primary/80 font-medium transition-colors" href="/esqueci-senha">
          {t('login.forgotPassword')}
        </Link>
      </div>

      {/* Sign In Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-full"
      >
        {isSubmitting ? t('login.buttonLoading') : t('login.button')}
      </Button>

      {/* Email Pending Modal */}
      <EmailPendingModal
        isOpen={showEmailPendingModal}
        onClose={() => setShowEmailPendingModal(false)}
        email={pendingEmail}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Erro ao fazer login"
        message={errorMessage}
      />
    </form>
  );
}
