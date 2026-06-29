"use client";

import { ReactNode } from "react";

export { ToastProvider, useToast } from "@/hooks/use-toast";

export interface ToastProps {
  id: number;
  title?: string;
  description?: string;
  type?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface ToastActionElement {
  altText?: string;
  children?: ReactNode;
}

export function Toast({ children, ...props }: ToastProps & { children?: ReactNode }) {
  return <div data-toast-id={props.id}>{children}</div>;
}

export function ToastTitle({ children }: { children: ReactNode }) {
  return <p className="text-sm font-semibold text-slate-900 leading-5">{children}</p>;
}

export function ToastDescription({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-5 text-slate-500">{children}</p>;
}

export function ToastClose({ onClose }: { onClose?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-700 transition"
      aria-label="Close"
    >
      ×
    </button>
  );
}

export function ToastViewport() {
  return <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none" />;
}
