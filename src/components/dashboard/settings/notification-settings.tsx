"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { Loader2, Bell, MessageCircle, Mail, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { SuccessNotificationModal } from "@/components/ui/success-notification-modal";

interface NotificationConfig {
  enabled: boolean;
  whatsapp: boolean;
  email: boolean;
  reminderTime: string;
}

export function NotificationSettings() {
  const { t } = useLanguage();
  const { user } = useUser();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [settings, setSettings] = useState<NotificationConfig>({
    enabled: true,
    whatsapp: true,
    email: true,
    reminderTime: 'vencimento'
  });

  // Carregar configurações salvas ao iniciar
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`granazap_notifications_${user.id}`);
      if (saved) {
        try {
          setSettings(JSON.parse(saved));
        } catch (e) {
          // Ignora erro ao carregar preferências
        }
      }
      setLoading(false);
    }
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      // Simulação de delay de rede para feedback visual
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Salvar no LocalStorage (simulando persistência no banco)
      // Em um cenário ideal com permissão de schema, salvaríamos em uma coluna JSONB 'preferencias'
      localStorage.setItem(`granazap_notifications_${user.id}`, JSON.stringify(settings));
      
      setShowSuccessModal(true);
    } catch (error) {
      alert(t('settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white">{t('settings.notificationConfig')}</h3>
        <p className="text-sm text-zinc-400">{t('settings.notificationDesc')}</p>
      </div>
      
      {/* ... Resto do componente igual ... */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-6 space-y-8">
        
        {/* Habilitar Geral */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <span className="font-medium text-white">{t('settings.enableNotifications')}</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={settings.enabled}
              onChange={e => setSettings({...settings, enabled: e.target.checked})}
            />
            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* WhatsApp */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <MessageCircle className="w-5 h-5 text-green-500" />
            </div>
            <span className="font-medium text-white">{t('settings.whatsapp')}</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={settings.whatsapp}
              onChange={e => setSettings({...settings, whatsapp: e.target.checked})}
              disabled={!settings.enabled}
            />
            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
          </label>
        </div>

        {/* Email */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Mail className="w-5 h-5 text-purple-500" />
            </div>
            <span className="font-medium text-white">{t('settings.email')}</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={settings.email}
              onChange={e => setSettings({...settings, email: e.target.checked})}
              disabled={!settings.enabled}
            />
            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
          </label>
        </div>

        {/* Quando Lembrar */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span className="font-medium text-white">{t('settings.reminderTime')}</span>
          </div>
          <select
            value={settings.reminderTime}
            onChange={e => setSettings({...settings, reminderTime: e.target.value})}
            disabled={!settings.enabled}
            className="w-full bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 text-white appearance-none focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            <option value="vencimento">{t('settings.onDueDate')}</option>
            <option value="1dia">{t('settings.oneDayBefore')}</option>
            <option value="3dias">{t('settings.threeDaysBefore')}</option>
            <option value="7dias">7 {t('settings.oneDayBefore').replace('1', '7')}</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('settings.save')}
        </button>
      </div>

      {/* Modal de Sucesso */}
      <SuccessNotificationModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={t('success.saved')}
        message={t('success.notificationsUpdated')}
      />
    </div>
  );
}
