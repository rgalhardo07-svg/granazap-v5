"use client";

import { HelpCircle } from "lucide-react";
import { useState } from "react";

interface HelpTooltipProps {
  content: string;
  title?: string;
}

export function HelpTooltip({ content, title }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-zinc-400 hover:text-blue-400 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-72 p-4 bg-[#1F2937] border border-blue-500/20 rounded-lg shadow-xl left-0 top-6">
          {title && (
            <h4 className="text-sm font-semibold text-white mb-2">{title}</h4>
          )}
          <p className="text-xs text-zinc-300 leading-relaxed">{content}</p>
          
          {/* Seta */}
          <div className="absolute -top-2 left-4 w-4 h-4 bg-[#1F2937] border-l border-t border-blue-500/20 transform rotate-45" />
        </div>
      )}
    </div>
  );
}
