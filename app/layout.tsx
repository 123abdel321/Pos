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

export const metadata: Metadata = {
    title: "POS - Portafolio ERP",
    description: "Sistema de punto de venta con gestión de pedidos para ERP",
    generator: "abdel_123@hotmail.es",
};

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
