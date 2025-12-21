"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Esperar animação
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />
  };

  const colors = {
    success: 'bg-green-500/10 border-green-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20'
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${colors[type]} backdrop-blur-sm shadow-xl min-w-[300px] max-w-md`}>
        {icons[type]}
        <p className="text-sm text-white flex-1">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Hook para usar toast
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' | 'warning' }>>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    success: (message: string) => showToast(message, 'success'),
    error: (message: string) => showToast(message, 'error'),
    warning: (message: string) => showToast(message, 'warning'),
  };
}
