"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

// Función helper segura para localStorage
const getSafeStorage = (key: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
        return localStorage.getItem(key)
    } catch (error) {
        console.error('Error accessing localStorage:', error)
        return null
    }
}

const setSafeStorage = (key: string, value: string): void => {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(key, value)
    } catch (error) {
        console.error('Error setting localStorage:', error)
    }
}

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(defaultTheme)

    useEffect(() => {
        const storedTheme = getSafeStorage(storageKey) as Theme
        if (storedTheme) {
            setTheme(storedTheme)
        }
    }, [storageKey])

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
            root.classList.add(systemTheme)
            return
        }

        root.classList.add(theme)
    }, [theme])

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            setSafeStorage(storageKey, theme)
            setTheme(theme)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)
    if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")
    return context
}