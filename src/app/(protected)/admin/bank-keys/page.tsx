"use client";

import BankKeySection from "@/components/partners/BankKeySection";

export default function BankKeysPage() {
  return (
    <div className="space-y-[4vw] sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-[5vw] sm:text-2xl font-black text-foreground tracking-tight uppercase">
        Bank API Keys
      </h1>
      <BankKeySection />
    </div>
  );
}
