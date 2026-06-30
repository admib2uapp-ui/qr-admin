"use client";

import { Badge } from "@/components/ui/badge";

interface Merchant {
  id: string;
  merchant_id: string;
  merchant_name: string;
  bank_code: string;
  terminal_id: string;
  merchant_city: string;
  mcc: string;
  country_code: string;
  currency_code: string;
  is_active: boolean;
  partner_id: string | null;
  user_id: string | null;
  created_at: string;
}

interface Partner {
  id: string;
  name: string;
}

interface Props {
  merchant: Merchant;
  partner: Partner | null;
  userDisabled: boolean;
}

export default function MerchantInfo({ merchant, partner, userDisabled }: Props) {
  return (
    <div className="rounded-xl border border-primary/10 bg-card p-[3vw] sm:p-4 shadow-lg shadow-primary/5">
      <h3 className="text-[3vw] sm:text-sm font-black text-foreground uppercase tracking-tight mb-4">Business Info</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Merchant Name</label>
          <p className="text-sm font-bold mt-1">{merchant.merchant_name}</p>
        </div>
        <div>
          <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">QR ID</label>
          <p className="text-sm font-mono mt-1">{merchant.merchant_id}</p>
        </div>
        <div>
          <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bank Code</label>
          <p className="text-sm font-bold mt-1">{merchant.bank_code}</p>
        </div>
        <div>
          <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</label>
          <p className="text-sm font-bold mt-1">{merchant.merchant_city || "-"}</p>
        </div>
        <div>
          <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Terminal ID</label>
          <p className="text-sm font-mono mt-1">{merchant.terminal_id || "-"}</p>
        </div>
        <div>
          <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</label>
          <div className="mt-1">
            <Badge variant="outline" className={`rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-widest border-2 ${
              userDisabled
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            }`}>
              {userDisabled ? "Disabled" : "Active"}
            </Badge>
          </div>
        </div>
        <div>
          <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Partner</label>
          <p className="text-sm font-bold mt-1">{partner?.name || "-"}</p>
        </div>
        <div>
          <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Created</label>
          <p className="text-sm font-bold mt-1">{new Date(merchant.created_at).toLocaleDateString("en-LK")}</p>
        </div>
      </div>
    </div>
  );
}
