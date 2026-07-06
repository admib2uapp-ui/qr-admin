"use client";

import { Suspense } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { MobileTransactions } from "@/components/mobile/MobileTransactions";

export default function TransactionsPage() {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-[6vw] sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[5vw] sm:text-2xl font-black text-foreground tracking-tight uppercase">Transactions</h1>
          <p className="text-[2.5vw] sm:text-sm text-muted-foreground font-medium">All transactions across the system</p>
        </div>
      </div>
      {isMobile ? (
        <MobileTransactions />
      ) : (
        <Suspense fallback={null}>
          <TransactionsTable />
        </Suspense>
      )}
    </div>
  );
}
