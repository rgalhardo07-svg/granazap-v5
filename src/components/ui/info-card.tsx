"use client";

import { Info, X } from "lucide-react";
import { useState } from "react";

interface InfoCardProps {
  title: string;
  description: string;
  tips?: string[];
  dismissible?: boolean;
  storageKey?: string; // Para lembrar que foi fechado
}

export function InfoCard({ 
  title, 
  description, 
  tips, 
  dismissible = true,
  storageKey 
}: InfoCardProps) {
  const [isVisible, setIsVisible] = useState(() => {
    if (!dismissible || !storageKey) return true;
    // Verificar se foi fechado anteriormente
    if (typeof window !== 'undefined') {
      return !localStorage.getItem(`info-card-dismissed-${storageKey}`);
    }
    return true;
  });

  const handleDismiss = () => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(`info-card-dismissed-${storageKey}`, 'true');
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Info className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-semibold text-white">{title}</h4>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="text-zinc-400 hover:text-white transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-sm text-zinc-300 mb-3 leading-relaxed">
            {description}
          </p>

          {tips && tips.length > 0 && (
            <ul className="space-y-2">
              {tips.map((tip, index) => (
                <li key={index} className="text-xs text-blue-300 flex items-start gap-2">
                  <span className="text-blue-400 flex-shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
