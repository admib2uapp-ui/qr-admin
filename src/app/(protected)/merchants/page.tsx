"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { UsersTable } from "@/components/users/UsersTable";
import { MobileMerchants } from "@/components/mobile/MobileMerchants";

export default function UsersPage() {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-[6vw] sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[5vw] sm:text-2xl font-black text-foreground tracking-tight uppercase">Merchants</h1>
          <p className="text-[2.5vw] sm:text-sm text-muted-foreground font-medium">Manage users and their merchants</p>
        </div>
      </div>
      {isMobile ? <MobileMerchants /> : <UsersTable />}
    </div>
  );
}
