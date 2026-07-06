"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Search, Volume2, CheckCircle2, XCircle, Activity } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface PartnerRow {
  id: number;
  name: string;
  active: boolean;
  total: number;
  success: number;
  failed: number;
  avg_amount: number | null;
  terminals: number;
  last_used: string | null;
}

export function MobileSoundboxReport() {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [summary, setSummary] = useState<{ total: number; success: number; failed: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/soundbox-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || []);
        setSummary(data.summary || null);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return partners;
    const s = search.toLowerCase();
    return partners.filter(p => p.name.toLowerCase().includes(s));
  }, [partners, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">{partners.length} partners</p>
        <Button onClick={fetchReport} variant="outline" size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 text-center">
          <Activity className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-black tabular-nums">{summary?.total ?? "-"}</p>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
        </div>
        <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/20 text-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
          <p className="text-lg font-black tabular-nums text-emerald-600">{summary?.success ?? "-"}</p>
          <p className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-widest">Success</p>
        </div>
        <div className="bg-destructive/5 rounded-xl p-3 border border-destructive/20 text-center">
          <XCircle className="w-4 h-4 text-destructive mx-auto mb-1" />
          <p className="text-lg font-black tabular-nums text-destructive">{summary?.failed ?? "-"}</p>
          <p className="text-[9px] font-bold text-destructive/60 uppercase tracking-widest">Failed</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search partner..."
          className="pl-9 h-10 rounded-xl border-primary/10 bg-primary/5 text-sm"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-primary/5 rounded-xl p-4 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-medium">
            No partners found
          </div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Volume2 className="w-4 h-4 text-primary shrink-0" />
                  <p className="font-bold text-sm truncate">{p.name}</p>
                </div>
                <Badge variant="outline" className={`rounded-full px-3 py-0.5 font-black text-[10px] uppercase tracking-widest border-2 shrink-0 ${
                  p.active
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-muted/10 text-muted-foreground border-muted/20"
                }`}>
                  {p.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
                  <p className="text-sm font-black tabular-nums">{p.total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-widest">Success</p>
                  <p className="text-sm font-black tabular-nums text-emerald-600">{p.success.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-destructive/60 uppercase tracking-widest">Failed</p>
                  <p className="text-sm font-black tabular-nums text-destructive">{p.failed.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Avg: {p.avg_amount ? `LKR ${p.avg_amount.toLocaleString()}` : "-"}</span>
                <span>{p.terminals} terminals</span>
                {p.last_used && <span>Last: {new Date(p.last_used).toLocaleDateString("en-LK")}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
