"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Search, Volume2, CheckCircle2, XCircle, Activity } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileSoundboxReport } from "@/components/mobile/MobileSoundboxReport";

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

export default function SoundboxReportPage() {
  const isMobile = useIsMobile();
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [summary, setSummary] = useState<{ total: number; success: number; failed: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchReport = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const filtered = useMemo(() => {
    if (!search) return partners;
    const s = search.toLowerCase();
    return partners.filter(p => p.name.toLowerCase().includes(s));
  }, [partners, search]);

  if (isMobile) {
    return (
      <div className="space-y-[6vw] sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[5vw] sm:text-2xl font-black text-foreground tracking-tight uppercase">Soundbox Report</h1>
            <p className="text-[2.5vw] sm:text-sm text-muted-foreground font-medium">TTS usage across partners</p>
          </div>
        </div>
        <MobileSoundboxReport />
      </div>
    );
  }

  return (
    <div className="space-y-[6vw] sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[5vw] sm:text-2xl font-black text-foreground tracking-tight uppercase">Soundbox Report</h1>
          <p className="text-[2.5vw] sm:text-sm text-muted-foreground font-medium">TTS usage across partners</p>
        </div>
        <Button onClick={fetchReport} variant="outline" size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[4vw] sm:gap-4">
        <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
          <CardContent className="p-[4vw] sm:p-6 flex items-center gap-4">
            <div className="p-[2vw] sm:p-3 rounded-[2vw] sm:rounded-xl bg-primary/10">
              <Activity className="w-[5vw] h-[5vw] sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <p className="text-[2.5vw] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Requests</p>
              <p className="text-[6vw] sm:text-3xl font-black tabular-nums">{summary?.total?.toLocaleString() ?? "-"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-emerald-500/20 shadow-xl shadow-emerald-500/5">
          <CardContent className="p-[4vw] sm:p-6 flex items-center gap-4">
            <div className="p-[2vw] sm:p-3 rounded-[2vw] sm:rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="w-[5vw] h-[5vw] sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[2.5vw] sm:text-xs font-bold text-emerald-600/60 uppercase tracking-widest">Success</p>
              <p className="text-[6vw] sm:text-3xl font-black tabular-nums text-emerald-600">{summary?.success?.toLocaleString() ?? "-"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-destructive/20 shadow-xl shadow-destructive/5">
          <CardContent className="p-[4vw] sm:p-6 flex items-center gap-4">
            <div className="p-[2vw] sm:p-3 rounded-[2vw] sm:rounded-xl bg-destructive/10">
              <XCircle className="w-[5vw] h-[5vw] sm:w-6 sm:h-6 text-destructive" />
            </div>
            <div>
              <p className="text-[2.5vw] sm:text-xs font-bold text-destructive/60 uppercase tracking-widest">Failed</p>
              <p className="text-[6vw] sm:text-3xl font-black tabular-nums text-destructive">{summary?.failed?.toLocaleString() ?? "-"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partners Table */}
      <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
        <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3 space-y-3">
          <CardTitle className="text-[4vw] sm:text-lg font-black text-foreground tracking-tight uppercase">
            Partners ({filtered.length})
          </CardTitle>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search partner..."
              className="pl-9 h-12 rounded-xl border-primary/10 bg-primary/5 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-[3vw] sm:p-4 pt-0">
          <div className="rounded-xl border border-primary/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-primary/10">
                <TableRow className="border-primary/10 hover:bg-transparent">
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Partner</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px] text-right">Total</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px] text-right">Success</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px] text-right">Failed</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px] text-right">Avg Amount</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px] text-right">Terminals</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Last Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-primary/5">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground font-medium">No partners found</TableCell>
                  </TableRow>
                ) : (
                  filtered.map(p => (
                    <TableRow key={p.id} className="border-primary/5 hover:bg-primary/5 transition-all cursor-default">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-bold">{p.name}</span>
                          <Badge variant="outline" className={`rounded-full px-2 py-0 font-black text-[9px] uppercase tracking-widest border-2 ${
                            p.active
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-muted/10 text-muted-foreground border-muted/20"
                          }`}>
                            {p.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">{p.total.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-emerald-600">{p.success.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-destructive">{p.failed.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums">{p.avg_amount ? `LKR ${p.avg_amount.toLocaleString()}` : "-"}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums">{p.terminals}</TableCell>
                      <TableCell className="text-[2.5vw] sm:text-xs text-muted-foreground">
                        {p.last_used ? new Date(p.last_used).toLocaleDateString("en-LK") : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
