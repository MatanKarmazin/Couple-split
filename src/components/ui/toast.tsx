"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

type Toast = { id: string; title: string; message?: string; tone?: "success" | "error" };
type ToastContextValue = {
  showToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { t } = useLanguage();

  const dismiss = useCallback((id: string) => {
    setToasts((items) => items.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { ...toast, id }]);
    window.setTimeout(() => dismiss(id), 3600);
  }, [dismiss]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 z-50 grid gap-2 sm:left-auto sm:w-96">
        {toasts.map((toast) => (
          <div key={toast.id} className="rounded-lg border border-border bg-surface p-3 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">{toast.title}</p>
                {toast.message ? <p className="mt-1 text-sm text-text-muted">{toast.message}</p> : null}
              </div>
              <Button variant="ghost" className="h-8 w-8 px-0" onClick={() => dismiss(toast.id)} aria-label={t("common.cancel")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
