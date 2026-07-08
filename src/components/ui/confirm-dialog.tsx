"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-[4vw] animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => onOpenChange(false)} />

      <div className="relative w-full max-w-sm bg-background/80 backdrop-blur-2xl border border-white/10 rounded-[10vw] rounded-b-none sm:rounded-2xl p-[8vw] sm:p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 duration-500">
        <div className="flex flex-col items-center text-center space-y-[4vh]">
          <div className="p-[4vw] bg-rose-500/10 rounded-full relative">
            <div className="absolute inset-0 bg-rose-500 blur-2xl opacity-20 animate-pulse" />
            <AlertCircle className="w-[12vw] h-[12vw] sm:w-12 sm:h-12 text-rose-500 relative" />
          </div>

          <div className="space-y-[1vh]">
            <h3 className="text-[6vw] sm:text-2xl font-black tracking-tight text-foreground">{title}</h3>
            <p className="text-[3.5vw] sm:text-sm text-muted-foreground font-medium px-[2vw]">{description}</p>
          </div>

          <div className="w-full space-y-[2vh] pt-[2vh]">
            <button
              onClick={onConfirm}
              disabled={loading}
              className="w-full py-[4vw] sm:py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-[5vw] sm:rounded-xl font-black text-[3.5vw] sm:text-sm uppercase tracking-widest shadow-xl shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-[2vw]"
            >
              {loading && <Loader2 className="w-[4vw] h-[4vw] sm:w-4 sm:h-4 animate-spin" />}
              {loading ? "Processing..." : confirmLabel}
            </button>

            <button
              onClick={() => onOpenChange(false)}
              className="w-full py-[3vw] sm:py-2 text-muted-foreground font-bold text-[3vw] sm:text-xs uppercase tracking-[0.2em] active:text-foreground transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
