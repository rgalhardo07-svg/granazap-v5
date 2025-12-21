"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface EmailPendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export function EmailPendingModal({ isOpen, onClose, email }: EmailPendingModalProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendEmail = async () => {
    if (!email) return;
    
    setIsResending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        alert('Erro ao reenviar email. Tente novamente.');
      } else {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } catch (error) {
      alert('Erro ao reenviar email. Tente novamente.');
    } finally {
      setIsResending(false);
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[#1E293B] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="relative p-6 border-b border-white/10">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#F59E0B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Confirme seu email
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      localhost:3000 diz
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-zinc-300 leading-relaxed">
                  Por favor, confirme seu email antes de fazer login
                </p>

                {email && (
                  <div className="mt-4 p-4 bg-[#0F172A] rounded-lg border border-white/5">
                    <p className="text-sm text-zinc-400 mb-1">Email enviado para:</p>
                    <p className="text-sm font-medium text-white break-all">{email}</p>
                  </div>
                )}

                <div className="mt-4 space-y-2 text-sm text-zinc-400">
                  <p>• Verifique sua caixa de entrada</p>
                  <p>• Clique no link de confirmação</p>
                  <p>• Não esqueça de verificar a pasta de spam</p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 space-y-3">
                {/* Success Message */}
                {resendSuccess && (
                  <div className="p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg">
                    <p className="text-sm text-[#22C55E] text-center">
                      ✓ Email reenviado com sucesso!
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="flex-1 bg-[#1E293B] hover:bg-[#334155] text-white border border-white/10"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Reenviando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reenviar Email
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={onClose}
                    className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                  >
                    OK
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
