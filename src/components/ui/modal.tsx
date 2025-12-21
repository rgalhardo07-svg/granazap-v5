"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm md:p-4 transition-all duration-200"
    >
      <div
        className={cn(
          "bg-[#111827] border-t md:border border-white/10 rounded-t-2xl md:rounded-xl w-full max-w-3xl shadow-2xl flex flex-col",
          "max-h-[85vh] md:h-auto md:max-h-[90vh]",
          "animate-in slide-in-from-bottom md:fade-in md:zoom-in-95 duration-300",
          className
        )}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-3 md:p-6 border-b border-white/5 flex-shrink-0">
          <h2 className="text-base md:text-xl font-semibold text-white truncate pr-2">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="p-3 md:p-6 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
