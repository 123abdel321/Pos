import TokenValidator from "@/components/sistem/TokenValidator";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from '@/contexts/AuthContext';
import { Analytics } from "@vercel/analytics/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import type React from "react";
import { Suspense } from "react";
import "./globals.css";

// ----------------------------------------------------------------------
// CONFIGURACIÓN DE METADATOS Y SEO (Next.js App Router)
// ----------------------------------------------------------------------

export const metadata: Metadata = {
    // Definición de URL Base para Canonical y OpenGraph (Crucial para subdominios)
    metadataBase: new URL('https://pos.portafolioerp.com'),

    // Título (Mejorado para SEO)
    title: {
        default: "POS - Módulo de Punto de Venta | Portafolio ERP",
        template: "%s | Portafolio ERP POS", 
    },
    
    // Descripción (Mejorada para aparecer en Google)
    description: "Sistema de Punto de Venta (POS) rápido y eficiente, integrado en tiempo real con la contabilidad, inventario y gestión de pedidos de Portafolio ERP.",
    
    // URL Canónica (Define que esta es la versión principal)
    alternates: {
        canonical: '/', 
    },
    
    // Google Search Console Verification (CÓDIGO INTEGRADO)
    verification: {
        google: 'K5bAoOCwtXEczEw8TRrEyMaMZ8ILBBieZtLpazVyQC4', 
    },

    // Open Graph / Social Media (Para Facebook, WhatsApp, etc.)
    openGraph: {
        title: "PORTAFOLIOERP POS: Módulo de Ventas Inteligente",
        description: "Gestión de ventas y caja eficiente, con sincronización automática con la contabilidad y facturación electrónica de PORTAFOLIOERP.",
        url: 'https://pos.portafolioerp.com',
        siteName: 'Portafolio ERP POS',
        images: [
            {
                url: '/og-pos-image.jpg', 
                width: 1200,
                height: 630,
                alt: 'Portafolio ERP POS',
            },
        ],
        locale: 'es_CO',
        type: 'website',
    },

    // Twitter Cards
    twitter: {
        card: 'summary_large_image',
        title: 'PORTAFOLIOERP POS: Módulo de Punto de Venta',
        description: 'La solución POS más rápida, totalmente integrada a tu ERP colombiano.',
        images: ['/og-pos-image.jpg'], 
    },

    // Favicon/Íconos
    icons: {
        icon: '/img/logo_contabilidad.png', 
    },

    generator: "abdel_123@hotmail.es",
};

// ----------------------------------------------------------------------
// COMPONENTE ROOT LAYOUT
// ----------------------------------------------------------------------

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>){
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
                <Suspense fallback={null}>
                    <ThemeProvider defaultTheme="dark" storageKey="pos-theme">
                        <AuthProvider>
                            <TokenValidator />
                            <ToastProvider>
                                {children}
                            </ToastProvider>
                        </AuthProvider>
                    </ThemeProvider>
                </Suspense>
                <Analytics />
            </body>
        </html>
    );
}