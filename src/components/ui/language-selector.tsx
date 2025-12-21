"use client";

import { useLanguage } from '@/contexts/language-context';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center justify-center gap-3 text-sm text-zinc-500">
      <button
        onClick={() => setLanguage('pt')}
        className={`hover:text-white transition-colors ${
          language === 'pt' ? 'font-medium text-white' : ''
        }`}
      >
        PT
      </button>
      <span className="w-px h-4 bg-zinc-700" />
      <button
        onClick={() => setLanguage('es')}
        className={`hover:text-white transition-colors ${
          language === 'es' ? 'font-medium text-white' : ''
        }`}
      >
        ES
      </button>
      <span className="w-px h-4 bg-zinc-700" />
      <button
        onClick={() => setLanguage('en')}
        className={`hover:text-white transition-colors ${
          language === 'en' ? 'font-medium text-white' : ''
        }`}
      >
        EN
      </button>
    </div>
  );
}
