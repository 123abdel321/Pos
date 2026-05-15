// components/ToastProvider.tsx
"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from "react"
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react"

declare global {
    interface Window {
        emitToast: (opts: ToastOptions) => void
    }
}

type ToastType = "error" | "success" | "warning" | "info"

export interface ToastOptions {
    id?: string
    message: string
    html?: boolean
    type?: ToastType
    autoClose?: boolean
    duration?: number
}

interface ToastRecord extends Required<Omit<ToastOptions, "id">> {
    id: string
}

interface ToastContextValue {
    show: (opts: ToastOptions) => string
    close: (id: string) => void
    clear: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error("useToast must be used within <ToastProvider />")
    return ctx
}

/** Sonido sutil (opcional) */
function playToastSound(type: ToastType) {
    try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const presets = {
            success: { freq: 880, time: 0.12, gain: 0.04 },
            info: { freq: 740, time: 0.12, gain: 0.035 },
            warning: { freq: 560, time: 0.14, gain: 0.045 },
            error: { freq: 320, time: 0.16, gain: 0.05 },
        }
        const { freq, time, gain: vol } = presets[type]
        osc.frequency.value = freq
        osc.type = "sine"
        gain.gain.value = vol
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        const now = ctx.currentTime
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time)
        osc.stop(now + time + 0.02)
        setTimeout(() => ctx.close(), (time + 0.2) * 1000)
    } catch { }
}

const typeStyles: Record<
    ToastType,
    {
        bg: string
        border: string
        progress: string
        icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
        title: string
    }
> = {
    error: {
        bg: "bg-red-500/90 dark:bg-red-600/90",
        border: "border-red-600/60 dark:border-red-700/60",
        progress: "bg-red-300/80 dark:bg-red-200/70",
        icon: AlertCircle,
        title: "Error",
    },
    success: {
        bg: "bg-emerald-500/90 dark:bg-emerald-600/90",
        border: "border-emerald-600/60 dark:border-emerald-700/60",
        progress: "bg-emerald-300/80 dark:bg-emerald-200/70",
        icon: CheckCircle,
        title: "Éxito",
    },
    warning: {
        bg: "bg-amber-500/90 dark:bg-amber-600/90",
        border: "border-amber-600/60 dark:border-amber-700/60",
        progress: "bg-amber-300/80 dark:bg-amber-200/70",
        icon: AlertTriangle,
        title: "Advertencia",
    },
    info: {
        bg: "bg-blue-500/90 dark:bg-blue-600/90",
        border: "border-blue-600/60 dark:border-blue-700/60",
        progress: "bg-blue-300/80 dark:bg-blue-200/70",
        icon: Info,
        title: "Información",
    },
}

/** Componente individual de Toast */
function ToastItem({ data, onClose }: { data: ToastRecord; onClose: (id: string) => void }) {
    const { id, message, html, type, autoClose, duration } = data
    const [progress, setProgress] = useState(100)
    const [show, setShow] = useState(true)
    const [isHovered, setIsHovered] = useState(false)

    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const startRef = useRef<number>(0)
    const remainingRef = useRef<number>(duration)
    const isClosedRef = useRef(false)

    const clearTimers = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (intervalRef.current) clearInterval(intervalRef.current)
        timeoutRef.current = null
        intervalRef.current = null
    }

    const startTimers = (ms: number) => {
        if (!autoClose || isClosedRef.current) return
        clearTimers()
        startRef.current = Date.now()
        remainingRef.current = ms

        intervalRef.current = setInterval(() => {
            if (!isHovered && !isClosedRef.current) {
                const elapsed = Date.now() - startRef.current
                const p = 100 - (elapsed / ms) * 100
                setProgress(Math.max(0, p))
                if (p <= 0) {
                    clearTimers()
                    setShow(false)
                    setTimeout(() => onClose(id), 200)
                }
            }
        }, 50)

        timeoutRef.current = setTimeout(() => {
            if (!isHovered && !isClosedRef.current) {
                setShow(false)
                setTimeout(() => onClose(id), 200)
            }
            clearTimers()
        }, ms)
    }

    useEffect(() => {
        if (autoClose) startTimers(duration)
        return () => clearTimers()
    }, [id])

    const handleClose = () => {
        if (isClosedRef.current) return
        isClosedRef.current = true
        clearTimers()
        setShow(false)
        setTimeout(() => onClose(id), 150)
    }

    const styles = typeStyles[type]
    const Icon = styles.icon

    return (
        <div
            className={[
                "pointer-events-auto w-full max-w-md mx-auto sm:mx-0",
                "rounded-xl border-l-4 shadow-lg shadow-black/10 text-white",
                "backdrop-blur-sm",
                styles.bg,
                styles.border,
                "transition-all duration-300",
                show
                    ? "animate-in slide-in-from-right-6 fade-in-0"
                    : "animate-out slide-out-to-right-6 fade-out-0",
            ].join(" ")}
            onMouseEnter={() => {
                if (isClosedRef.current) return
                setIsHovered(true)
                if (startRef.current) {
                    const elapsed = Date.now() - startRef.current
                    remainingRef.current = Math.max(0, remainingRef.current - elapsed)
                }
                clearTimers()
            }}
            onMouseLeave={() => {
                if (isClosedRef.current) return
                setIsHovered(false)
                if (autoClose && remainingRef.current > 0) startTimers(remainingRef.current)
            }}
            role="status"
        >
            {autoClose && (
                <div className="w-full h-1 bg-white/20 rounded-t-xl overflow-hidden">
                    <div
                        className={`h-full transition-all duration-75 ${styles.progress}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{styles.title}</p>
                        <div className="text-sm mt-1 opacity-90 max-h-60 overflow-y-auto">
                            {html ? (
                                <div
                                    className="prose prose-sm prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: message }}
                                />
                            ) : (
                                <p className="break-words">{message}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0 text-white/80 hover:text-white transition-colors self-start p-1 rounded-full hover:bg-white/20"
                        aria-label="Cerrar notificación"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

/** Proveedor global de toasts */
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastRecord[]>([])

    const show = (opts: ToastOptions) => {
        const id = opts.id ?? crypto.randomUUID()
        const record: ToastRecord = {
            id,
            message: opts.message,
            html: opts.html ?? false,
            type: opts.type ?? "info",
            autoClose: opts.autoClose ?? true,
            duration: opts.duration ?? 5000,
        }
        setToasts((prev) => [record, ...prev].slice(0, 8))
        playToastSound(record.type)
        return id
    }

    const close = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))
    const clear = () => setToasts([])

    useEffect(() => {
        const legacyHandler = (e: Event) => {
            const ev = e as CustomEvent
            const { message, type = "error", autoClose = true, duration = 5000, html = false } = ev.detail || {}
            show({ message, type, autoClose, duration, html })
        }
        const standardHandler = (e: Event) => {
            const ev = e as CustomEvent
            const { message, type = "info", autoClose = true, duration = 5000, html = false } = ev.detail || {}
            show({ message, type, autoClose, duration, html })
        }

        window.addEventListener("showError", legacyHandler)
        window.addEventListener("showToast", standardHandler)
            ; (window as any).emitToast = (detail: ToastOptions) =>
                window.dispatchEvent(new CustomEvent("showToast", { detail }))

        return () => {
            window.removeEventListener("showError", legacyHandler)
            window.removeEventListener("showToast", standardHandler)
            delete (window as any).emitToast
        }
    }, [])

    return (
        <ToastContext.Provider value={{ show, close, clear }}>
            {children}
            <div
                className={[
                    "pointer-events-none fixed inset-0 z-[9999]",
                    "flex flex-col items-center justify-end p-4 md:items-end md:p-6",
                ].join(" ")}
                aria-live="polite"
            >
                <div className="flex flex-col gap-3 items-stretch pointer-events-none w-full max-w-md md:items-end">
                    {toasts.map((t) => (
                        <div key={t.id} className="pointer-events-auto w-full">
                            <ToastItem data={t} onClose={close} />
                        </div>
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    )
}