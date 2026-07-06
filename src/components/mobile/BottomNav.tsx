"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Store, BarChart3, LifeBuoy } from "lucide-react";

const navItems = [
  { path: "/merchants", label: "Merchants", icon: Store },
  { path: "/transactions", label: "Txns", icon: ArrowLeftRight },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/helpdesk", label: "Helpdesk", icon: LifeBuoy },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/40 md:hidden pointer-events-none transition-colors duration-300">
      <div className="flex items-center justify-around h-[min(14vw,56px)] px-[1vw] pointer-events-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-[1vw] transition-all duration-300 ${
                active
                  ? "text-primary scale-110"
                  : "text-muted-foreground/30 hover:text-foreground"
              }`}
            >
              <div className="relative">
                 <Icon className="w-[5.5vw] h-[5.5vw] max-w-[24px] max-h-[24px]" />
                 {active && <div className="absolute -inset-2 bg-primary/20 blur-lg rounded-full" />}
              </div>
              <span className={`text-[2vw] sm:text-[8px] mt-[0.5vw] font-black uppercase tracking-[0.2em] transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
