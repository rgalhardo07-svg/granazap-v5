declare global {
    interface Window {
        __BRANDING__?: {
            appName: string;
            appLogoUrl: string;
            primaryColor: string;
            secondaryColor: string;
            supportEmail: string;
            habilitar_modo_pj?: boolean;
            bloquear_cadastro_novos_usuarios?: boolean;
            show_sidebar_logo?: boolean;
            show_sidebar_name?: boolean;
            show_login_logo?: boolean;
            show_login_name?: boolean;
            logo_url_sidebar?: string;
            logo_url_login?: string;
        };
    }
}

export { };
