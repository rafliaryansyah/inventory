"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; type: ToastType; message: string };

type ToastCtx = {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

let counter = 0;

const STYLES: Record<ToastType, { cls: string; icon: React.ReactNode }> = {
  success: { cls: "border-sage/40 text-sage", icon: <CheckCircle2 className="h-5 w-5" /> },
  error: { cls: "border-rust/40 text-rust", icon: <AlertCircle className="h-5 w-5" /> },
  info: { cls: "border-navy/40 text-navy", icon: <Info className="h-5 w-5" /> },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = ++counter;
      setItems((prev) => [...prev, { id, type, message }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  const value: ToastCtx = {
    toast,
    success: (m) => toast(m, "success"),
    error: (m) => toast(m, "error"),
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {items.map((t) => (
          <ToastView key={t.id} item={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastView({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: () => void;
}) {
  const s = STYLES[item.type];
  useEffect(() => {
    // keep mounted; auto-dismiss handled by provider
  }, []);
  return (
    <div
      className={cn(
        "anim-slide flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-lg border-l-4 bg-paper px-4 py-3 shadow-lift",
        s.cls,
      )}
    >
      <span className="mt-0.5 shrink-0">{s.icon}</span>
      <p className="flex-1 text-sm text-ink">{item.message}</p>
      <button
        onClick={onClose}
        className="shrink-0 text-ink-mute hover:text-ink"
        aria-label="Tutup"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
