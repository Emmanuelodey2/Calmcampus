"use client"

import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  const icons: Record<string, React.ReactNode> = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
  }

  const bar: Record<string, string> = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  }

  return (
    <div aria-live="assertive" className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className="pointer-events-auto relative flex w-[340px] items-start gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_32px_rgba(15,23,42,0.12)]"
        >
          <div className={`absolute left-0 top-0 h-full w-1 ${bar[toast.type] || "bg-slate-500"}`} />
          <div className="ml-2">{toast.type ? (icons[toast.type] as React.ReactNode) : null}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 leading-5">{toast.title}</p>
            {toast.message && <p className="mt-0.5 text-xs leading-5 text-slate-500">{toast.message}</p>}
          </div>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-700 transition"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
