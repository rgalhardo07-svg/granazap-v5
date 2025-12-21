"use client";

import { useEffect } from "react";
import { useBranding } from "@/contexts/branding-context";

export function DynamicMetadata() {
  const { settings } = useBranding();

  useEffect(() => {
    // Update page title
    if (settings.appName) {
      document.title = settings.appName;
    }

    // Update favicon
    const faviconUrl = settings.favicon_url || settings.appLogoUrl;
    if (faviconUrl) {
      // Remove existing favicons
      const existingFavicons = document.querySelectorAll("link[rel*='icon']");
      existingFavicons.forEach(favicon => favicon.remove());

      // Add new favicon
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = faviconUrl;
      document.head.appendChild(link);

      // Add apple touch icon
      const appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      appleTouchIcon.href = faviconUrl;
      document.head.appendChild(appleTouchIcon);
    }

    // Update theme color
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', settings.primaryColor || '#22C55E');

  }, [settings.appName, settings.appLogoUrl, settings.primaryColor]);

  return null;
}
