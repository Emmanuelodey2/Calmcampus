"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  open?: boolean;
  description?: string;
}

interface ToastContextValue {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  toasts: Toast[];
  dismiss: (toastId?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, type, title, message, open: true }]);
    setTimeout(() => dismiss(id), 4500);
  }, []);

  const dismiss = useCallback((toastId?: number) => {
    setToasts((prev) => {
      if (toastId === undefined) return [];
      return prev.filter((t) => t.id !== toastId);
    });
  }, []);

  const value: ToastContextValue = {
    success: (t, m) => push("success", t, m),
    error: (t, m) => push("error", t, m),
    info: (t, m) => push("info", t, m),
    warning: (t, m) => push("warning", t, m),
    toasts,
    dismiss,
  };

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
  };

  const bar: Record<ToastType, string> = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className="pointer-events-auto relative flex w-[340px] items-start gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_32px_rgba(15,23,42,0.12)]"
          >
            <div className={`absolute left-0 top-0 h-full w-1 ${bar[toast.type]}`} />
            <div className="ml-2">{icons[toast.type]}</div>
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
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
