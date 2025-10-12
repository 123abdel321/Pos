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
    default: "POS Portafolio ERP | Punto de Venta Inteligente para Colombia",
    template: "%s | Portafolio ERP POS",
  },
  description: "Sistema POS integrado con Portafolio ERP. Control total de ventas, inventario en tiempo real, facturación electrónica DIAN y sincronización contable automática. Ideal para retail, restaurantes y comercios en Colombia.",

  // Keywords para SEO
  keywords: [
    "POS Colombia",
    "punto de venta",
    "facturación electrónica",
    "sistema POS",
    "Portafolio ERP",
    "inventario en tiempo real",
    "contabilidad automática",
    "retail Colombia",
    "restaurantes POS",
    "comercio electrónico"
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
    title: "POS Inteligente | Sistema de Punto de Venta Integrado - Portafolio ERP",
    description: "Optimiza tu negocio con nuestro módulo POS totalmente integrado al ERP. Control de ventas, inventario, facturación electrónica DIAN y contabilidad en tiempo real.",
    images: [
      {
        url: '/img/og-pos-image.jpg', // Recomiendo crear esta imagen
        width: 1200,
        height: 630,
        alt: 'Portafolio ERP POS - Sistema de Punto de Venta Inteligente',
        type: 'image/jpeg',
      },
      {
        url: '/img/logo_contabilidad.png',
        width: 800,
        height: 600,
        alt: 'Logo Portafolio ERP POS',
      }
    ],
    emails: ['soporte@portafolioerp.com'], // Agrega email de contacto
    phoneNumbers: ['+573001234567'], // Agrega teléfono
  },

  // Twitter Cards mejoradas
  twitter: {
    card: 'summary_large_image',
    site: '@PortafolioERP', // Agrega tu usuario de Twitter
    creator: '@PortafolioERP',
    title: "POS Inteligente Integrado a ERP | Portafolio ERP",
    description: "Sistema de punto de venta con facturación electrónica DIAN, control de inventario y sincronización contable automática.",
    images: ['/img/og-pos-image.jpg'],
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
  manifest: '/manifest.json', // Si tienes PWA
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
  'name': 'Portafolio ERP POS',
  'applicationCategory': 'BusinessApplication',
  'operatingSystem': 'Web, Windows, macOS, Linux, iOS, Android',
  'permissions': 'browser',
  'description': 'Sistema de Punto de Venta integrado a Portafolio ERP para control completo de ventas, inventario, facturación electrónica DIAN y contabilidad en tiempo real.',
  'url': 'https://pos.portafolioerp.com',
  'author': {
    '@type': 'Organization',
    'name': 'Portafolio ERP',
    'url': 'https://portafolioerp.com'
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
    'Reportes y analytics',
    'App móvil incluida'
  ],
  'screenshot': [
    {
      '@type': 'ImageObject',
      'url': '/img/screenshot-dashboard.jpg',
      'caption': 'Dashboard principal del POS'
    },
    {
      '@type': 'ImageObject',
      'url': '/img/screenshot-ventas.jpg',
      'caption': 'Interfaz de ventas'
    }
  ],
  'releaseNotes': 'Última actualización: Integración completa con facturación electrónica DIAN',
  'softwareVersion': '2.0.0'
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
        
        {/* Metadatos adicionales para Colombia */}
        <meta name="geo.region" content="CO" />
        <meta name="geo.placename" content="Colombia" />
        <meta name="geo.position" content="4.570868;-74.297333" />
        <meta name="ICBM" content="4.570868, -74.297333" />
        
        {/* Metadatos de negocio */}
        <meta name="business:contact_data:street_address" content="Carrera 83 # 42 D - 27" />
        <meta name="business:contact_data:locality" content="Medellín" />
        <meta name="business:contact_data:region" content="Medellín." />
        <meta name="business:contact_data:postal_code" content="050001" />
        <meta name="business:contact_data:country_name" content="Colombia" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        }>
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