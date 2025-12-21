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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all duration-200"
    >
      <div
        className={cn(
          "bg-[#111827] border border-white/10 rounded-xl w-full max-w-3xl max-h-[95vh] shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col",
          className
        )}
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/5 flex-shrink-0">
          <h2 className="text-lg md:text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
