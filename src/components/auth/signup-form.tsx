"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { EmailConfirmationModal } from "@/components/ui/email-confirmation-modal";
import { SignupBlockedModal } from "@/components/ui/signup-blocked-modal";
import { DuplicateAccountModal } from "@/components/ui/duplicate-account-modal";
import { useLanguage } from "@/contexts/language-context";

type SignupFormValues = {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

export function SignupForm() {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateType, setDuplicateType] = useState<'email' | 'phone'>('email');
  const [duplicateValue, setDuplicateValue] = useState("");
  const [userEmail, setUserEmail] = useState("");
  
  // Schema for validation with translations
  const signupSchema = z.object({
    fullName: z.string().min(3, { message: t('error.nameMin') }),
    email: z.string().email({ message: t('error.invalidEmail') }),
    phone: z.string().min(10, { message: t('error.invalidPhone') }).optional(),
    password: z.string().min(6, { message: t('error.passwordMin') }),
    confirmPassword: z.string().min(6, { message: t('error.confirmPassword') }),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: t('error.acceptTerms'),
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('error.passwordMismatch'),
    path: ["confirmPassword"],
  });
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      // Importar dinamicamente para evitar problemas de SSR
      const { signupUser } = await import('@/lib/auth/signup');
      
      const result = await signupUser({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        acceptTerms: data.acceptTerms
      });

      if (!result.success) {
        // Verificar se é erro de cadastro bloqueado
        if (result.error === 'CADASTRO_BLOQUEADO') {
          setShowBlockedModal(true);
          return;
        }
        
        // Verificar se é email duplicado
        if (result.error === 'EMAIL_JA_CADASTRADO') {
          setDuplicateType('email');
          setDuplicateValue(data.email);
          setShowDuplicateModal(true);
          return;
        }
        
        // Verificar se é celular duplicado
        if (result.error === 'CELULAR_JA_CADASTRADO') {
          setDuplicateType('phone');
          setDuplicateValue(data.phone || '');
          setShowDuplicateModal(true);
          return;
        }
        
        alert(result.error || 'Erro ao criar conta');
        return;
      }

      // Sucesso! Mostrar modal de confirmação de email
      setUserEmail(data.email);
      setShowEmailModal(true);
      
    } catch (error: any) {
      alert('Erro ao criar conta. Tente novamente.');
    }
  };

  const handleModalClose = () => {
    setShowEmailModal(false);
    // Redirecionar para login após fechar modal
    window.location.href = '/';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-4">
      {/* Full Name Input */}
      <div className="flex flex-col w-full space-y-2">
        <label className="text-sm font-medium leading-none text-white" htmlFor="fullName">
          {t('signup.fullName')}
        </label>
        <Input
          {...register("fullName")}
          id="fullName"
          placeholder="Seu nome completo"
          type="text"
          autoComplete="name"
          startIcon={<User className="h-5 w-5" />}
        />
        {errors.fullName && (
          <p className="text-xs text-red-400 ml-2">{errors.fullName.message}</p>
        )}
      </div>

      {/* Email Input */}
      <div className="flex flex-col w-full space-y-2">
        <label className="text-sm font-medium leading-none text-white" htmlFor="email">
          {t('signup.email')}
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

      {/* Phone Input (Optional) */}
      <div className="flex flex-col w-full space-y-2">
        <label className="text-sm font-medium leading-none text-white" htmlFor="phone">
          {t('signup.phoneOptional')}
        </label>
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <PhoneInput
              value={field.value}
              onChange={field.onChange}
              placeholder="Digite seu número"
              showSaveFormat={true}
            />
          )}
        />
        {errors.phone && (
          <p className="text-xs text-red-400 ml-2">{errors.phone.message}</p>
        )}
      </div>

      {/* Password Input */}
      <div className="flex flex-col w-full space-y-2">
        <label className="text-sm font-medium leading-none text-white" htmlFor="password">
          {t('signup.password')}
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
          {t('signup.confirmPassword')}
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

      {/* Accept Terms */}
      <div className="flex items-start gap-2 mt-2">
        <Controller
          control={control}
          name="acceptTerms"
          render={({ field }) => (
            <Checkbox
              id="acceptTerms"
              checked={field.value}
              onCheckedChange={field.onChange}
              className="mt-0.5"
            />
          )}
        />
        <label htmlFor="acceptTerms" className="text-sm text-zinc-400 leading-tight cursor-pointer select-none">
          {t('signup.acceptTerms')}{" "}
          <Link href="/termos-de-uso" target="_blank" className="text-primary hover:text-primary/80 font-medium transition-colors">
            {t('signup.termsOfUse')}
          </Link>
          {" "}{t('signup.and')}{" "}
          <Link href="/politica-de-privacidade" target="_blank" className="text-primary hover:text-primary/80 font-medium transition-colors">
            {t('signup.privacyPolicy')}
          </Link>
        </label>
      </div>
      {errors.acceptTerms && (
        <p className="text-xs text-red-400 ml-2 -mt-2">{errors.acceptTerms.message}</p>
      )}

      {/* Sign Up Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full"
      >
        {isSubmitting ? t('signup.buttonLoading') : t('signup.button')}
      </Button>

      {/* Email Confirmation Modal */}
      <EmailConfirmationModal
        isOpen={showEmailModal}
        onClose={handleModalClose}
        email={userEmail}
      />

      {/* Signup Blocked Modal */}
      <SignupBlockedModal
        isOpen={showBlockedModal}
        onClose={() => setShowBlockedModal(false)}
      />

      {/* Duplicate Account Modal */}
      <DuplicateAccountModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        type={duplicateType}
        value={duplicateValue}
      />
    </form>
  );
}
