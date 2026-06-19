"use client";

import { StatsCards } from "@/components/dashboard/StatsCards";

export default function DashboardPage() {
  return (
    <div className="space-y-[6vw] sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[5vw] sm:text-2xl font-black text-foreground tracking-tight uppercase">Dashboard</h1>
          <p className="text-[2.5vw] sm:text-sm text-muted-foreground font-medium">Today's overview</p>
        </div>
      </div>
      <StatsCards />
    </div>
  );
}
