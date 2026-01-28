// components/ToastProvider.tsx

"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from "react"
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react"

// 🔥 TIPADO GLOBAL PARA USAR window.emitToast EN CUALQUIER PARTE
declare global {
  interface Window {
    emitToast: (opts: ToastOptions) => void
  }
}
// --------------------------------------------------------------------

type ToastType = "error" | "success" | "warning" | "info"

export interface ToastOptions {
  id?: string
  message: string
  html?: boolean // Nueva propiedad para indicar que el mensaje contiene HTML
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

/** ======= AUDIO: sonidos sutiles por tipo (WebAudio, sin archivos) ======= */
function playToastSound(type: ToastType) {
  try {
    // Evitar sonido si el usuario está en modo reducción de movimiento/audio (opcional)
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    const presets: Record<ToastType, { freq: number; time: number; gain: number }> = {
      success: { freq: 880, time: 0.12, gain: 0.04 },
      info: 	 { freq: 740, time: 0.12, gain: 0.035 },
      warning: { freq: 560, time: 0.14, gain: 0.045 },
      error: 	 { freq: 320, time: 0.16, gain: 0.05 },
    }

    const { freq, time, gain: vol } = presets[type]
    osc.frequency.value = freq
    osc.type = "sine"
    gain.gain.value = vol

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()

    // decay suave
    const now = ctx.currentTime
    gain.gain.exponentialRampToValueAtTime(0.0001, now + time)
    osc.stop(now + time + 0.02)

    // Cerrar contexto luego de un rato (libera recursos)
    setTimeout(() => ctx.close(), (time + 0.2) * 1000)
  } catch {
    /* silencio si algo falla */
  }
}

/** ======= ESTILOS CENTRALIZADOS ======= */
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

/** ======= Toast individual (maneja su propio timer y hover-pause) ======= */
function ToastItem({
  data,
  onClose,
}: {
  data: ToastRecord
  onClose: (id: string) => void
}) {
  const { id, message, html, type, autoClose, duration } = data
  const [progress, setProgress] = useState(100)
  const [show, setShow] = useState(true) // para animación de salida
  const [isHovered, setIsHovered] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startRef = useRef<number>(0)
  const remainingRef = useRef<number>(duration)

  const styles = typeStyles[type]
  const Icon = styles.icon

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
    timeoutRef.current = null
    intervalRef.current = null
  }

  const startTimers = (ms: number) => {
    if (!autoClose) return
    clearTimers()
    startRef.current = Date.now()
    remainingRef.current = ms

    intervalRef.current = setInterval(() => {
      if (!isHovered) {
        const elapsed = Date.now() - startRef.current
        const p = 100 - (elapsed / ms) * 100
        setProgress(Math.max(0, p))
        if (p <= 0) {
          clearTimers()
          // animación de salida
          setShow(false)
          setTimeout(() => onClose(id), 240)
        }
      }
    }, 50)

    timeoutRef.current = setTimeout(() => {
      if (!isHovered) {
        setShow(false)
        setTimeout(() => onClose(id), 240)
      }
      clearTimers()
    }, ms)
  }

  useEffect(() => {
    if (autoClose) startTimers(duration)
    return () => clearTimers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <div
      className={[
        // container
        "pointer-events-auto w-full max-w-md min-w-[360px] max-w-[92vw]",
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
        setIsHovered(true)
        // pausar: recalcula tiempo restante
        if (startRef.current) {
          const elapsed = Date.now() - startRef.current
          remainingRef.current = Math.max(0, remainingRef.current - elapsed)
        }
        clearTimers()
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        if (autoClose && remainingRef.current > 0) startTimers(remainingRef.current)
      }}
      role="status"
      aria-live="polite"
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

          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-semibold">{typeStyles[type].title}</p>
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
            onClick={() => {
              setShow(false)
              setTimeout(() => onClose(id), 220)
            }}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors self-start"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/** ======= Provider (maneja el stack, eventos globales y dark mode) ======= */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])

  const show = (opts: ToastOptions) => {
    const id = opts.id ?? crypto.randomUUID()
    const record: ToastRecord = {
      id,
      message: opts.message,
      html: opts.html ?? false, // Por defecto no interpretar HTML
      type: opts.type ?? "info",
      autoClose: opts.autoClose ?? true,
      duration: opts.duration ?? 5000,
    }
    setToasts((prev) => [record, ...prev].slice(0, 8)) // límite de 8 visibles
    playToastSound(record.type)
    return id
  }

  const close = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))
  const clear = () => setToasts([])

  // Eventos globales:
  useEffect(() => {
    // Compat: tu evento anterior "showError"
    const legacy = (e: Event) => {
      const ev = e as CustomEvent
      const { 
        message, 
        type = "error", 
        autoClose = true, 
        duration = 5000,
        html = false // Nuevo parámetro
      } = ev.detail || {}
      show({ message, type, autoClose, duration, html })
    }

    // Nuevo evento "showToast"
    const standard = (e: Event) => {
      const ev = e as CustomEvent
      const { 
        message, 
        type = "info", 
        autoClose = true, 
        duration = 5000,
        html = false // Nuevo parámetro
      } = ev.detail || {}
      show({ message, type, autoClose, duration, html })
    }

    // @ts-ignore
    window.addEventListener("showError", legacy)
    // @ts-ignore
    window.addEventListener("showToast", standard)

    // Exponer helper global opcional (compatible con el tipado global)
    ;(window as any).emitToast = (detail: ToastOptions) =>
      window.dispatchEvent(new CustomEvent("showToast", { detail }))

    return () => {
      // @ts-ignore
      window.removeEventListener("showError", legacy)
      // @ts-ignore
      window.removeEventListener("showToast", standard)
      delete (window as any).emitToast
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ToastContext.Provider value={{ show, close, clear }}>
      {children}

      {/* Contenedor del stack - esquina inferior derecha */}
      <div
        className={[
          "pointer-events-none fixed inset-0 z-[9999]",
          // zonas clickables solo sobre los toasts
          "flex flex-col items-end justify-end p-4 md:p-6",
        ].join(" ")}
        aria-live="polite"
      >
        <div className="flex flex-col gap-3 items-end pointer-events-none w-full max-w-md">
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