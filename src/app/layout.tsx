import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/language-context";
import { CurrencyProvider } from "@/contexts/currency-context";
import { QueryProvider } from "@/components/providers/query-provider";
import { BrandingProvider } from "@/contexts/branding-context";
import { BrandingStyleInjector } from "@/components/branding-style-injector";
import { DynamicMetadata } from "@/components/dynamic-metadata";
import { createClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  
  try {
    const { data } = await supabase.rpc('get_system_settings').single();
    
    const appName = (data as any)?.app_name || 'GranaZap';
    const faviconUrl = (data as any)?.favicon_url || (data as any)?.app_logo_url;
    
    return {
      title: appName,
      description: `Sistema de gestão financeira - ${appName}`,
      icons: faviconUrl ? {
        icon: faviconUrl,
        apple: faviconUrl,
      } : undefined,
    };
  } catch (error) {
    console.error('Error loading metadata:', error);
    return {
      title: 'GranaZap',
      description: 'Sistema de gestão financeira',
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <BrandingStyleInjector />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <BrandingProvider>
                <DynamicMetadata />
                {children}
              </BrandingProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
