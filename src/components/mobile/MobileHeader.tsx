"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export function MobileHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40 md:hidden">
      <div className="flex items-center h-[min(15vw,60px)] px-4 gap-3">
        <SidebarTrigger className="hover:bg-primary/10 hover:text-primary transition-colors" />
        <span className="text-sm font-black text-foreground tracking-tight">QR4POS Admin</span>
      </div>
    </header>
  );
}
