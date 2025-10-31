import { ConfirmationProvider } from "@/components/ConfirmationContext";
import TokenValidator from "@/components/sistem/TokenValidator";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from '@/contexts/AuthContext';
import { Analytics } from "@vercel/analytics/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type React from "react";
import { Suspense } from "react";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
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