import { ConfirmationProvider } from "@/components/ConfirmationContext";
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
// CONFIGURACIÓN DE METADATOS Y SEO PROFESIONAL (Next.js App Router)
// ----------------------------------------------------------------------

export const metadata: Metadata = {
  metadataBase: new URL('https://pos.portafolioerp.com'),

  // Título y descripción SEO optimizados
  title: {
    default: "POS Portafolio ERP | Facturación Electrónica DIAN + Control Inventario",
    template: "%s | Portafolio ERP POS",
  },
  description: "💳 Sistema POS todo-en-uno: Facturación DIAN, inventario en tiempo real, múltiples formas de pago. ¡Prueba gratis! Optimizado para comercios colombianos.",

  // Keywords para SEO
  keywords: [
    "POS Colombia",
    "punto de venta",
    "facturación electrónica DIAN",
    "sistema POS",
    "Portafolio ERP",
    "inventario en tiempo real",
    "contabilidad automática",
    "retail Colombia",
    "restaurantes POS",
    "comercio electrónico",
    "facturación electrónica",
    "POS cloud Colombia",
    "punto de venta integrado"
  ],

  // URL canónica y alternates
  alternates: {
    canonical: '/',
    languages: {
      'es-CO': '/',
    },
  },

  // Verificación Google Search Console
  verification: {
    google: 'K5bAoOCwtXEczEw8TRrEyMaMZ8ILBBieZtLpazVyQC4',
  },

  // Configuración de robots avanzada
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Open Graph mejorado (Facebook, WhatsApp, LinkedIn)
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://pos.portafolioerp.com',
    siteName: 'Portafolio ERP POS',
    title: "🚀 POS Portafolio ERP | Facturación Electrónica DIAN + Control Inventario",
    description: "💳 Sistema POS todo en uno: Facturación DIAN, inventario en tiempo real, múltiples formas de pago. ¡Prueba gratis! Optimizado para comercios colombianos.",
    images: [
      {
        url: '/img/og-facebook-pos.jpg',
        width: 1200,
        height: 630,
        alt: 'POS Portafolio ERP - Sistema completo para tu negocio en Colombia',
        type: 'image/jpeg',
      },
      {
        url: '/img/logo_contabilidad.png',
        width: 800,
        height: 600,
        alt: 'Logo Portafolio ERP POS',
      }
    ],
    emails: ['soporte@portafolioerp.com'],
    phoneNumbers: ['+573001234567'],
    countryName: 'Colombia',
  },

  // Twitter Cards mejoradas
  twitter: {
    card: 'summary_large_image',
    site: '@PortafolioERP',
    creator: '@PortafolioERP',
    title: "🚀 POS Portafolio ERP | Facturación DIAN + Inventario",
    description: "💳 Sistema POS todo-en-uno para Colombia. Facturación electrónica, control inventario, múltiples pagos. ¡Prueba gratis!",
    images: ['/img/og-facebook-pos.jpg'],
  },

  // Favicon y branding
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/img/logo_contabilidad.png', sizes: '32x32', type: 'image/png' },
      { url: '/img/logo_contabilidad.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/img/logo_contabilidad.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  // Metadatos adicionales
  authors: [
    { name: 'Portafolio ERP', url: 'https://portafolioerp.com' }
  ],
  creator: 'Portafolio ERP',
  publisher: 'Portafolio ERP',
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
    url: true,
  },
  
  // Metadatos para apps y manifest
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Portafolio ERP POS',
  },
  
  // Categoría en tiendas de apps
  category: 'business',
};

// ----------------------------------------------------------------------
// SCHEMA.ORG STRUCTURED DATA (Separado del metadata)
// ----------------------------------------------------------------------

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  'name': 'POS Portafolio ERP',
  'applicationCategory': 'BusinessApplication',
  'operatingSystem': 'Web, Windows, macOS, Linux, iOS, Android',
  'permissions': 'browser',
  'description': 'Sistema de Punto de Venta integrado a Portafolio ERP para control completo de ventas, inventario, facturación electrónica DIAN y contabilidad en tiempo real.',
  'url': 'https://pos.portafolioerp.com',
  'author': {
    '@type': 'Organization',
    'name': 'Portafolio ERP',
    'url': 'https://portafolioerp.com',
    'logo': 'https://pos.portafolioerp.com/img/logo_contabilidad.png',
    'description': 'Sistemas ERP para empresas colombianas'
  },
  'offers': {
    '@type': 'Offer',
    'price': '0',
    'priceCurrency': 'COP',
    'availability': 'https://schema.org/InStock',
    'validFrom': '2024-01-01'
  },
  'aggregateRating': {
    '@type': 'AggregateRating',
    'ratingValue': '4.8',
    'ratingCount': '150',
    'bestRating': '5',
    'worstRating': '1'
  },
  'featureList': [
    'Facturación electrónica DIAN',
    'Control de inventario en tiempo real',
    'Sincronización contable automática',
    'Múltiples formas de pago',
    'Reportes y analytics en tiempo real',
    'App móvil incluida',
    'Soporte técnico 24/7',
    'Backup automático en la nube'
  ],
  'screenshot': [
    {
      '@type': 'ImageObject',
      'url': 'https://pos.portafolioerp.com/img/screenshot-dashboard.jpg',
      'caption': 'Dashboard principal del POS Portafolio ERP'
    },
    {
      '@type': 'ImageObject',
      'url': 'https://pos.portafolioerp.com/img/screenshot-ventas.jpg',
      'caption': 'Interfaz de ventas rápida y intuitiva'
    }
  ],
  'releaseNotes': 'Última actualización: Integración completa con facturación electrónica DIAN y mejoras en rendimiento',
  'softwareVersion': '2.0.0',
  'countriesSupported': 'Colombia',
  'processorRequirements': 'Navegador web moderno',
  'memoryRequirements': '2GB RAM mínimo'
};

// Schema adicional para organización
const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'Portafolio ERP',
  'url': 'https://portafolioerp.com',
  'logo': 'https://pos.portafolioerp.com/img/logo_contabilidad.png',
  'description': 'Desarrolladores de sistemas ERP y POS para empresas colombianas',
  'address': {
    '@type': 'PostalAddress',
    'streetAddress': 'Calle 123 #45-67',
    'addressLocality': 'Bogotá',
    'addressRegion': 'Bogotá D.C.',
    'postalCode': '110111',
    'addressCountry': 'CO'
  },
  'contactPoint': {
    '@type': 'ContactPoint',
    'telephone': '+57-300-123-4567',
    'contactType': 'customer service',
    'email': 'soporte@portafolioerp.com',
    'availableLanguage': 'es'
  },
  'sameAs': [
    'https://www.facebook.com/PortafolioERP',
    'https://www.linkedin.com/company/portafolio-erp',
    'https://twitter.com/PortafolioERP'
  ]
};

// ----------------------------------------------------------------------
// COMPONENTE ROOT LAYOUT
// ----------------------------------------------------------------------

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Structured Data como script separado */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
        
        {/* Metadatos adicionales para Colombia */}
        <meta name="geo.region" content="CO" />
        <meta name="geo.placename" content="Colombia" />
        <meta name="geo.position" content="4.570868;-74.297333" />
        <meta name="ICBM" content="4.570868, -74.297333" />
        
        {/* Metadatos de negocio */}
        <meta name="business:contact_data:street_address" content="Calle 123 #45-67" />
        <meta name="business:contact_data:locality" content="Bogotá" />
        <meta name="business:contact_data:region" content="Bogotá D.C." />
        <meta name="business:contact_data:postal_code" content="110111" />
        <meta name="business:contact_data:country_name" content="Colombia" />
        
        {/* Metadatos para WhatsApp */}
        <meta property="og:url" content="https://pos.portafolioerp.com" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="🚀 POS Portafolio ERP | Facturación Electrónica DIAN + Control Inventario" />
        <meta property="og:description" content="💳 Sistema POS todo-en-uno: Facturación DIAN, inventario en tiempo real, múltiples formas de pago. ¡Prueba gratis!" />
        <meta property="og:image" content="https://pos.portafolioerp.com/img/og-facebook-pos.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Metadatos para LinkedIn */}
        <meta property="linkedin:title" content="POS Portafolio ERP - Sistema de Punto de Venta para Colombia" />
        <meta property="linkedin:description" content="Solución POS integrada con facturación electrónica DIAN y control de inventario en tiempo real" />
        <meta property="linkedin:image" content="https://pos.portafolioerp.com/img/og-facebook-pos.jpg" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg text-muted-foreground">Cargando POS Portafolio ERP...</p>
            </div>
          </div>
        }>
          <ThemeProvider defaultTheme="dark" storageKey="pos-theme">
            <AuthProvider>
              <TokenValidator />
              <ConfirmationProvider>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </ConfirmationProvider>
            </AuthProvider>
          </ThemeProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}