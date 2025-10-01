// components/SimpleToast.tsx
"use client"

import { useEffect, useState, useRef } from "react"
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react"

interface ToastState {
  show: boolean
  message: string
  type: "error" | "success" | "warning" | "info"
  autoClose?: boolean
  duration?: number
}

export function SimpleToast() {
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "error",
    autoClose: true,
    duration: 5000,
  })
  const [progress, setProgress] = useState(100)
  const [isHovered, setIsHovered] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const remainingTimeRef = useRef<number>(0)

  const typeStyles = {
    error: {
      bg: "bg-red-500/90",
      border: "border-red-600/60",
      icon: AlertCircle,
      progress: "bg-red-300/80",
      title: "Error",
    },
    success: {
      bg: "bg-emerald-500/90",
      border: "border-emerald-600/60",
      icon: CheckCircle,
      progress: "bg-emerald-300/80",
      title: "Éxito",
    },
    warning: {
      bg: "bg-amber-500/90",
      border: "border-amber-600/60",
      icon: AlertTriangle,
      progress: "bg-amber-300/80",
      title: "Advertencia",
    },
    info: {
      bg: "bg-blue-500/90",
      border: "border-blue-600/60",
      icon: Info,
      progress: "bg-blue-300/80",
      title: "Información",
    },
  }

  const clearTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  const startAutoClose = (duration: number) => {
    if (!toast.autoClose) return
    clearTimers()

    const interval = 50
    startTimeRef.current = Date.now()
    remainingTimeRef.current = duration

    progressIntervalRef.current = setInterval(() => {
      if (!isHovered) {
        const elapsed = Date.now() - startTimeRef.current
        const newProgress = 100 - (elapsed / duration) * 100
        setProgress(Math.max(0, newProgress))

        if (newProgress <= 0) {
          clearTimers()
          setToast({ show: false, message: "", type: toast.type })
        }
      }
    }, interval)

    timeoutRef.current = setTimeout(() => {
      if (!isHovered) {
        setToast({ show: false, message: "", type: toast.type })
      }
      clearTimers()
    }, duration)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    clearTimers()

    if (startTimeRef.current > 0) {
      const elapsed = Date.now() - startTimeRef.current
      remainingTimeRef.current = Math.max(
        0,
        (toast.duration || 5000) - elapsed
      )
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (toast.show && toast.autoClose && remainingTimeRef.current > 0) {
      startAutoClose(remainingTimeRef.current)
    }
  }

  const handleClose = () => {
    setToast({ show: false, message: "", type: toast.type })
    clearTimers()
  }

  const getToastStyles = () => {
    const styles = typeStyles[toast.type]

    return `
      fixed bottom-6 right-6 z-50 max-w-sm w-full
      rounded-xl shadow-lg shadow-black/10 border-l-4 
      ${styles.bg} ${styles.border} 
      backdrop-blur-sm text-white
      transition-all duration-300
      ${toast.show 
        ? "animate-in slide-in-from-right fade-in" 
        : "animate-out slide-out-to-right fade-out"
      }
    `
  }

  useEffect(() => {
    const handleError = (event: CustomEvent) => {
      const { message, type = "error", autoClose = true, duration = 5000 } =
        event.detail

      setToast({
        show: true,
        message,
        type,
        autoClose,
        duration,
      })

      setProgress(100)
      setIsHovered(false)
      startTimeRef.current = Date.now()
      remainingTimeRef.current = duration

      startAutoClose(duration)
    }

    // @ts-ignore
    window.addEventListener("showError", handleError)

    return () => {
      // @ts-ignore
      window.removeEventListener("showError", handleError)
      clearTimers()
    }
  }, [])

  if (!toast.show) return null

  const { icon: Icon, progress: progressColor, title } = typeStyles[toast.type]

  return (
    <div
      className={getToastStyles()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {toast.autoClose && (
        <div className="w-full h-1 bg-white/20 rounded-t-xl overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ${progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-full bg-white/20 flex items-center justify-center">
            <Icon className="h-5 w-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-sm mt-1 break-words opacity-90">
              {toast.message}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
