"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

// Lista de ícones disponíveis
const AVAILABLE_ICONS = [
  // Receitas
  'DollarSign', 'TrendingUp', 'Wallet', 'Briefcase', 'Award', 'Gift', 'PiggyBank',
  'CreditCard', 'Banknote', 'Coins', 'HandCoins', 'Landmark',
  // Despesas
  'ShoppingCart', 'ShoppingBag', 'Home', 'Car', 'Fuel', 'Utensils', 'Coffee',
  'Pizza', 'Smartphone', 'Laptop', 'Tv', 'Shirt', 'Plane', 'Train', 'Bus',
  'Heart', 'Stethoscope', 'GraduationCap', 'BookOpen', 'Dumbbell', 'Film',
  'Music', 'Gamepad2', 'Scissors', 'Wrench', 'Zap', 'Droplet', 'Wifi',
  // Gerais
  'Tag', 'Star', 'Circle', 'Square', 'Triangle', 'Package', 'Box',
];

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  accentColor: string;
}

export function IconSelector({ selectedIcon, onSelectIcon, accentColor }: IconSelectorProps) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIcons = AVAILABLE_ICONS.filter(icon =>
    icon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Tag;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white">
        {t('categories.modal.icon')} <span className="text-zinc-500">({t('categories.modal.optional')})</span>
      </label>
      
      {/* Search */}
      <input
        type="text"
        placeholder={t('categories.modal.searchIcon')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full h-9 px-3 rounded-lg bg-[#0A0F1C] border border-white/10 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-white/20"
      />

      {/* Icon Grid */}
      <div className="grid grid-cols-8 gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-[#0A0F1C] rounded-lg border border-white/10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {filteredIcons.map((iconName) => {
          const IconComponent = getIconComponent(iconName);
          const isSelected = selectedIcon === iconName;
          
          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onSelectIcon(iconName)}
              className={cn(
                "w-9 h-9 rounded-md flex items-center justify-center transition-all",
                isSelected
                  ? "ring-2 ring-offset-1 ring-offset-[#0A0F1C]"
                  : "hover:bg-white/5"
              )}
              style={{
                backgroundColor: isSelected ? `${accentColor}20` : 'transparent',
                ...(isSelected && { '--tw-ring-color': accentColor } as any),
              }}
              title={iconName}
            >
              <IconComponent 
                className="w-4 h-4" 
                style={{ color: isSelected ? accentColor : '#71717a' }}
              />
            </button>
          );
        })}
      </div>

      {filteredIcons.length === 0 && (
        <p className="text-center text-sm text-zinc-500 py-4">
          {t('categories.modal.noIconFound')}
        </p>
      )}
    </div>
  );
}

// Função para sugerir ícone baseado na descrição
export function suggestIcon(description: string, type: 'entrada' | 'saida'): string {
  const desc = description.toLowerCase();
  
  // Mapeamento de palavras-chave para ícones
  const iconMap: Record<string, string> = {
    // Receitas
    'salário': 'Wallet',
    'salario': 'Wallet',
    'freelance': 'Briefcase',
    'investimento': 'TrendingUp',
    'prêmio': 'Award',
    'premio': 'Award',
    'presente': 'Gift',
    'bônus': 'Award',
    'bonus': 'Award',
    
    // Despesas - Alimentação
    'alimentação': 'Utensils',
    'alimentacao': 'Utensils',
    'comida': 'Utensils',
    'restaurante': 'Utensils',
    'supermercado': 'ShoppingCart',
    'mercado': 'ShoppingCart',
    'café': 'Coffee',
    'cafe': 'Coffee',
    'pizza': 'Pizza',
    'lanche': 'Coffee',
    
    // Despesas - Moradia
    'aluguel': 'Home',
    'casa': 'Home',
    'moradia': 'Home',
    'condomínio': 'Home',
    'condominio': 'Home',
    'água': 'Droplet',
    'agua': 'Droplet',
    'luz': 'Zap',
    'energia': 'Zap',
    'internet': 'Wifi',
    
    // Despesas - Transporte
    'transporte': 'Car',
    'carro': 'Car',
    'combustível': 'Fuel',
    'combustivel': 'Fuel',
    'gasolina': 'Fuel',
    'uber': 'Car',
    'ônibus': 'Bus',
    'onibus': 'Bus',
    'metrô': 'Train',
    'metro': 'Train',
    'avião': 'Plane',
    'aviao': 'Plane',
    'viagem': 'Plane',
    
    // Despesas - Saúde
    'saúde': 'Heart',
    'saude': 'Heart',
    'médico': 'Stethoscope',
    'medico': 'Stethoscope',
    'farmácia': 'Heart',
    'farmacia': 'Heart',
    'academia': 'Dumbbell',
    
    // Despesas - Educação
    'educação': 'GraduationCap',
    'educacao': 'GraduationCap',
    'escola': 'GraduationCap',
    'curso': 'BookOpen',
    'livro': 'BookOpen',
    
    // Despesas - Lazer
    'lazer': 'Film',
    'cinema': 'Film',
    'streaming': 'Tv',
    'música': 'Music',
    'musica': 'Music',
    'jogo': 'Gamepad2',
    'game': 'Gamepad2',
    
    // Despesas - Vestuário
    'roupa': 'Shirt',
    'vestuário': 'Shirt',
    'vestuario': 'Shirt',
    'shopping': 'ShoppingBag',
    
    // Despesas - Tecnologia
    'celular': 'Smartphone',
    'telefone': 'Smartphone',
    'computador': 'Laptop',
    'notebook': 'Laptop',
    'tv': 'Tv',
    'eletrônico': 'Laptop',
    'eletronico': 'Laptop',
  };
  
  // Procurar por palavra-chave na descrição
  for (const [keyword, icon] of Object.entries(iconMap)) {
    if (desc.includes(keyword)) {
      return icon;
    }
  }
  
  // Ícone padrão baseado no tipo
  return type === 'entrada' ? 'DollarSign' : 'ShoppingCart';
}
