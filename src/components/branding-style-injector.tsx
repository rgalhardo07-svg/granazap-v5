"use client";

import { useEffect } from "react";

/**
 * Componente que injeta estilos de branding do localStorage
 * ANTES de qualquer renderização para evitar flash
 */
export function BrandingStyleInjector() {
  useEffect(() => {
    // Este código só roda uma vez no mount
    // Mas o style tag já foi injetado pelo script inline
  }, []);

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const savedColor = localStorage.getItem('branding_primary_color');
              if (savedColor) {
                // Criar style tag para sobrescrever CSS padrão
                const style = document.createElement('style');
                style.id = 'branding-override';
                style.textContent = \`:root { --primary: \${savedColor} !important; --ring: \${savedColor} !important; }\`;
                document.head.insertBefore(style, document.head.firstChild);
              }
            } catch (e) {
              console.error('Erro ao aplicar branding:', e);
            }
          })();
        `,
      }}
    />
  );
}
