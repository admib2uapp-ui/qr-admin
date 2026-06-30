"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import MerchantInfo from "@/components/merchants/MerchantInfo";
import MerchantTransactions from "@/components/merchants/MerchantTransactions";

export default function MerchantDetailPage() {
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
      <div className="space-y-[4vw] sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
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
    <div className="space-y-[4vw] sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/merchants')} className="h-10 w-10 rounded-xl">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-[5vw] sm:text-2xl font-black text-foreground tracking-tight uppercase truncate max-w-[300px]">
          {merchant.merchant_name}
        </h1>
      </div>

      <MerchantInfo merchant={merchant} partner={partner} userDisabled={userDisabled} />

      <div className="rounded-xl border border-primary/10 bg-card p-[3vw] sm:p-4 shadow-lg shadow-primary/5">
        <h3 className="text-[3vw] sm:text-sm font-black text-foreground uppercase tracking-tight mb-4">Linked User</h3>
        {user ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Name</label>
              <p className="text-sm font-bold mt-1">{user.full_name || "-"}</p>
            </div>
            <div>
              <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email</label>
              <p className="text-sm font-bold mt-1">{user.email || "-"}</p>
            </div>
            <div>
              <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Company</label>
              <p className="text-sm font-bold mt-1">{user.company_name || "-"}</p>
            </div>
            <div>
              <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">WhatsApp</label>
              <p className="text-sm font-bold mt-1">{user.whatsapp_number || "-"}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No user linked to this merchant</p>
        )}
      </div>

      <div className="rounded-xl border border-primary/10 bg-card p-[3vw] sm:p-4 shadow-lg shadow-primary/5">
        <h3 className="text-[3vw] sm:text-sm font-black text-foreground uppercase tracking-tight mb-4">Team Members ({team.length})</h3>
        {team.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No team members</p>
        ) : (
          <div className="space-y-2">
            {team.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{m.full_name || "Unknown"}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {m.email || "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MerchantTransactions transactions={transactions} merchantName={merchant.merchant_name} />
    </div>
  );
}
