"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      const lastDismissed = localStorage.getItem("pwa-prompt-dismissed");
      const oneDay = 24 * 60 * 60 * 1000;

      if (!lastDismissed || Date.now() - parseInt(lastDismissed) > oneDay) {
        setTimeout(() => setIsVisible(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  if (!isVisible || isInstalled) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-[100] md:bottom-8 md:right-8 md:left-auto md:max-w-sm animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="relative overflow-hidden bg-background/80 backdrop-blur-2xl border border-primary/20 rounded-3xl p-6 shadow-2xl shadow-primary/20">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px]" />

        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-tight">Install QR4POS Admin</h3>
              <p className="text-sm text-muted-foreground leading-snug">
                Add to home screen for faster access and a seamless experience.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit">
              <CheckCircle2 className="w-3.5 h-3.5" />
              No PlayStore or AppStore needed
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleInstall}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 text-base"
              >
                <Download className="w-5 h-5 mr-2" />
                Install Now
              </Button>
              <Button
                variant="ghost"
                onClick={handleDismiss}
                className="h-12 px-6 rounded-xl font-semibold text-muted-foreground border border-border/40 hover:bg-secondary/50"
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
