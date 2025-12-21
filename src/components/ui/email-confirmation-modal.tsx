"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, CheckCircle } from "lucide-react";
import { Button } from "./button";

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export function EmailConfirmationModal({ isOpen, onClose, email }: EmailConfirmationModalProps) {
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
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-[#1E293B] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="p-8 text-center">
                {/* Icon */}
                <div className="mx-auto w-16 h-16 bg-[#22C55E]/10 rounded-full flex items-center justify-center mb-6">
                  <Mail className="w-8 h-8 text-[#22C55E]" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-3">
                  Confirme seu email
                </h2>

                {/* Description */}
                <p className="text-zinc-400 mb-2">
                  Enviamos um email de confirmação para:
                </p>
                
                <p className="text-[#22C55E] font-semibold mb-6">
                  {email}
                </p>

                {/* Instructions */}
                <div className="bg-[#0F172A] rounded-xl p-4 mb-6 text-left">
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-[#22C55E] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-zinc-300">
                      Clique no link de confirmação que enviamos para ativar sua conta
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#22C55E] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-zinc-300">
                      Verifique sua caixa de spam se não encontrar o email
                    </p>
                  </div>
                </div>

                {/* Note */}
                <p className="text-xs text-zinc-500 mb-6">
                  O link de confirmação expira em 24 horas
                </p>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={onClose}
                    className="w-full"
                  >
                    Entendi
                  </Button>
                  
                  <button
                    onClick={() => {
                      // Aqui você pode adicionar lógica para reenviar email
                      alert('Funcionalidade de reenvio será implementada');
                    }}
                    className="w-full text-sm text-zinc-400 hover:text-[#22C55E] transition-colors"
                  >
                    Não recebeu o email? Reenviar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
