"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";

interface Transaction {
  id: string;
  reference_no: string;
  amount: number;
  tag: string | null;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const methodLabels: Record<string, string> = {
  CASH: "Cash",
  CREDIT: "Credit",
};

export default function MobileMerchantDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [merchant, setMerchant] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMerchant = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/api/merchants/${id}`);
      if (res.status === 404) {
        setError("Merchant not found");
        return;
      }
      if (!res.ok) {
        setError("Failed to load merchant");
        return;
      }
      const data = await res.json();
      setMerchant(data.merchant);
      setUser(data.user);
      setTeam(data.team || []);
      setPartner(data.partner);
      setTransactions(data.recentTransactions || []);
    } catch {
      setError("Failed to load merchant");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchant();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-5 w-36" />
        </div>
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 animate-in fade-in">
        <p className="text-destructive font-bold text-lg">{error}</p>
        <Button onClick={() => router.push('/merchants')} variant="outline" className="rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Merchants
        </Button>
      </div>
    );
  }

  const userDisabled = user?.disabled ?? false;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/merchants')} className="h-8 w-8 rounded-xl shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-black text-lg text-foreground tracking-tight truncate">
          {merchant.merchant_name}
        </h1>
      </div>

      {/* Business Info */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 space-y-3">
        <p className="text-xs font-black text-foreground uppercase tracking-tight">Business Info</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Name</p>
            <p className="text-sm font-bold">{merchant.merchant_name}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">QR ID</p>
            <p className="text-sm font-mono">{merchant.merchant_id}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bank Code</p>
            <p className="text-sm font-bold">{merchant.bank_code}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</p>
            <p className="text-sm font-bold">{merchant.merchant_city || "-"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Terminal ID</p>
            <p className="text-sm font-mono">{merchant.terminal_id || "-"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</p>
            <Badge variant="outline" className={`mt-1 rounded-full px-3 py-0.5 font-black text-[10px] uppercase tracking-widest border-2 ${
              userDisabled
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            }`}>
              {userDisabled ? "Disabled" : "Active"}
            </Badge>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Partner</p>
            <p className="text-sm font-bold">{partner?.name || "-"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Created</p>
            <p className="text-sm font-bold">{new Date(merchant.created_at).toLocaleDateString("en-LK")}</p>
          </div>
        </div>
      </div>

      {/* Linked User */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 space-y-3">
        <p className="text-xs font-black text-foreground uppercase tracking-tight">Linked User</p>
        {user ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Name</p>
              <p className="text-sm font-bold mt-0.5">{user.full_name || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email</p>
              <p className="text-sm font-bold mt-0.5">{user.email || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Company</p>
              <p className="text-sm font-bold mt-0.5">{user.company_name || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">WhatsApp</p>
              <p className="text-sm font-bold mt-0.5">{user.whatsapp_number || "-"}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-1">No user linked to this merchant</p>
        )}
      </div>

      {/* Team Members */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 space-y-3">
        <p className="text-xs font-black text-foreground uppercase tracking-tight">Team Members ({team.length})</p>
        {team.length === 0 ? (
          <p className="text-sm text-muted-foreground py-1">No team members</p>
        ) : (
          <div className="space-y-2">
            {team.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{m.full_name || "Unknown"}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{m.email || "-"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black text-foreground uppercase tracking-tight">Recent Transactions</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/transactions?search=${encodeURIComponent(merchant.merchant_name)}`)}
            className="text-[10px] font-black uppercase tracking-widest text-primary h-8"
          >
            View All
          </Button>
        </div>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((t: Transaction) => (
              <div key={t.id} className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-mono font-bold">{t.reference_no}</p>
                  <Badge variant="outline" className={`rounded-full px-2 py-0 font-black text-[9px] uppercase tracking-widest border-2 shrink-0 ${statusColors[t.status] || "bg-primary/10 text-primary border-primary/20"}`}>
                    {t.status === "completed" || t.status === "success" ? "Success" : t.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{methodLabels[t.tag || ""] || "QR"}</span>
                    <span>{new Date(t.created_at).toLocaleString("en-LK")}</span>
                  </div>
                  <p className="text-sm font-black tabular-nums">LKR {t.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
