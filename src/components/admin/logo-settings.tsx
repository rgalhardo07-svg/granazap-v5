"use client";

import { useState, useEffect } from "react";
import { Image, Eye, EyeOff } from "lucide-react";
import { useBranding } from "@/contexts/branding-context";
import { updateLogoSettings } from "@/actions/admin-settings-actions";
import { SuccessModal } from "@/components/admin/success-modal";

export function LogoSettings() {
  const { settings } = useBranding();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [showSidebarLogo, setShowSidebarLogo] = useState(false);
  const [showSidebarName, setShowSidebarName] = useState(true);
  const [showLoginLogo, setShowLoginLogo] = useState(false);
  const [showLoginName, setShowLoginName] = useState(true);
  const [logoUrlSidebar, setLogoUrlSidebar] = useState('');
  const [logoUrlLogin, setLogoUrlLogin] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');

  // Carregar dados quando settings mudar
  useEffect(() => {
    console.log('📥 Settings carregadas:', settings);
    if (settings) {
      setShowSidebarLogo(settings.show_sidebar_logo || false);
      setShowSidebarName(settings.show_sidebar_name !== false);
      setShowLoginLogo(settings.show_login_logo || false);
      setShowLoginName(settings.show_login_name !== false);
      setLogoUrlSidebar(settings.logo_url_sidebar || '');
      setLogoUrlLogin(settings.logo_url_login || settings.appLogoUrl || '');
      setFaviconUrl(settings.appLogoUrl || '');
    }
  }, [settings]);

  const handleSave = async () => {
    console.log('💾 Salvando configurações de logo...');
    
    setLoading(true);
    try {
      const result = await updateLogoSettings({
        show_sidebar_logo: showSidebarLogo,
        show_sidebar_name: showSidebarName,
        show_login_logo: showLoginLogo,
        show_login_name: showLoginName,
        logo_url_sidebar: logoUrlSidebar,
        logo_url_login: logoUrlLogin,
        favicon_url: faviconUrl
      });

      console.log('📥 Resultado:', result);

      if (result.success) {
        setShowSuccessModal(true);
        // Recarregar a página para atualizar o context
        setTimeout(() => window.location.reload(), 1500);
      } else {
        alert('❌ Erro ao salvar: ' + result.error);
      }
    } catch (err) {
      console.error('❌ Erro:', err);
      alert('❌ Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Image className="w-6 h-6 text-purple-500" />
          Configurações de Logo e Nome
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Controle a exibição de logo e nome da plataforma na sidebar e tela de login
        </p>
      </div>

      {/* Card de Configurações */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
        
        {/* Sidebar */}
        <div className="space-y-4">
          <h3 className="text-white font-medium text-lg border-b border-zinc-800 pb-2">
            Sidebar (Menu Lateral)
          </h3>
          
          {/* Mostrar Logo Sidebar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-zinc-400" />
              <span className="text-white text-sm">Mostrar Logo na Sidebar</span>
            </div>
            <button
              onClick={() => setShowSidebarLogo(!showSidebarLogo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showSidebarLogo ? 'bg-purple-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showSidebarLogo ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* URL Logo Sidebar */}
          {showSidebarLogo && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                URL do Logo (Sidebar)
              </label>
              <input
                type="url"
                value={logoUrlSidebar}
                onChange={(e) => setLogoUrlSidebar(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-zinc-500 mt-2">
                📐 <strong>Tamanho recomendado:</strong> 180x40px (largura x altura)<br/>
                📁 <strong>Formatos:</strong> PNG, SVG, WebP (fundo transparente recomendado)<br/>
                💡 <strong>Dica:</strong> Use <a href="https://realfavicongenerator.net/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">RealFaviconGenerator</a> para gerar logos otimizados
              </p>
            </div>
          )}

          {/* Mostrar Nome Sidebar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showSidebarName ? (
                <Eye className="w-4 h-4 text-zinc-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-zinc-400" />
              )}
              <span className="text-white text-sm">Mostrar Nome na Sidebar</span>
            </div>
            <button
              onClick={() => setShowSidebarName(!showSidebarName)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showSidebarName ? 'bg-purple-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showSidebarName ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="border-t border-zinc-800"></div>

        {/* Favicon */}
        <div className="space-y-4">
          <h3 className="text-white font-medium text-lg border-b border-zinc-800 pb-2">
            Favicon (Ícone da Aba do Navegador)
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              URL do Favicon
            </label>
            <input
              type="url"
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-zinc-500 mt-2">
              📐 <strong>Tamanho recomendado:</strong> 32x32px ou 64x64px (quadrado)<br/>
              📁 <strong>Formatos:</strong> PNG, ICO, SVG<br/>
              💡 <strong>Dica:</strong> Use <a href="https://realfavicongenerator.net/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">RealFaviconGenerator</a> para gerar favicons otimizados para todos os dispositivos
            </p>
            
            {faviconUrl && (
              <div className="mt-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                <p className="text-xs text-zinc-400 mb-2">Preview:</p>
                <div className="flex items-center gap-2">
                  <img src={faviconUrl} alt="Favicon" className="w-8 h-8" onError={(e) => e.currentTarget.style.display = 'none'} />
                  <span className="text-sm text-zinc-300">Este ícone aparecerá na aba do navegador</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-zinc-800"></div>

        {/* Login */}
        <div className="space-y-4">
          <h3 className="text-white font-medium text-lg border-b border-zinc-800 pb-2">
            Tela de Login
          </h3>
          
          {/* Mostrar Logo Login */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-zinc-400" />
              <span className="text-white text-sm">Mostrar Logo no Login</span>
            </div>
            <button
              onClick={() => setShowLoginLogo(!showLoginLogo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showLoginLogo ? 'bg-purple-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showLoginLogo ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* URL Logo Login */}
          {showLoginLogo && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                URL do Logo (Login)
              </label>
              <input
                type="url"
                value={logoUrlLogin}
                onChange={(e) => setLogoUrlLogin(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-zinc-500 mt-2">
                📐 <strong>Tamanho recomendado:</strong> 200x60px ou 300x90px (largura x altura)<br/>
                📁 <strong>Formatos:</strong> PNG, SVG, WebP (fundo transparente recomendado)<br/>
                💡 <strong>Dica:</strong> Logos maiores funcionam melhor na tela de login
              </p>
            </div>
          )}

          {/* Mostrar Nome Login */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showLoginName ? (
                <Eye className="w-4 h-4 text-zinc-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-zinc-400" />
              )}
              <span className="text-white text-sm">Mostrar Nome no Login</span>
            </div>
            <button
              onClick={() => setShowLoginName(!showLoginName)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showLoginName ? 'bg-purple-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showLoginName ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end pt-4 border-t border-zinc-800">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Configurações Salvas!"
        message="As configurações de logo e nome foram atualizadas com sucesso."
      />
    </div>
  );
}
