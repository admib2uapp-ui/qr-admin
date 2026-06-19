"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Trash2, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface PendingMerchant {
  id: string;
  merchant_id: string;
  created_at: string;
}

export default function PendingMerchantsPage() {
  const [pending, setPending] = useState<PendingMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMerchantId, setNewMerchantId] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/pending-merchants');
      if (res.ok) {
        const data = await res.json();
        setPending(data.pendingMerchants || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const addPending = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAddLoading(true);
    try {
      const res = await apiFetch('/api/admin/pending-merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_id: newMerchantId }),
      });
      if (res.ok) {
        setNewMerchantId("");
        await fetchPending();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add merchant ID");
      }
    } catch {
      setError("Failed to add merchant ID");
    } finally {
      setAddLoading(false);
    }
  };

  const removePending = async (id: string) => {
    try {
      const res = await apiFetch(`/api/admin/pending-merchants?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchPending();
      }
    } catch {}
  };

  return (
    <div className="space-y-[6vw] sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[5vw] sm:text-2xl font-black text-foreground tracking-tight uppercase">Pending Merchant IDs</h1>
          <p className="text-[2.5vw] sm:text-sm text-muted-foreground font-medium">Pre-register merchant IDs for automatic linking</p>
        </div>
      </div>

      <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
        <CardHeader className="p-[5vw] sm:p-6 pb-[2vw] sm:pb-4">
          <CardTitle className="text-[4vw] sm:text-lg font-black text-foreground tracking-tight uppercase flex items-center gap-2">
            <Plus className="h-5 w-5" /> Add Merchant ID
          </CardTitle>
        </CardHeader>
        <CardContent className="p-[5vw] sm:p-6 pt-0">
          <form onSubmit={addPending} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Merchant ID</label>
              <Input
                value={newMerchantId}
                onChange={e => setNewMerchantId(e.target.value)}
                placeholder="0000000007960044503"
                className="h-12 rounded-xl border-primary/10 bg-primary/5 text-sm font-mono"
                required
              />
            </div>
            <Button type="submit" disabled={addLoading} className="h-12 rounded-xl text-xs font-black uppercase tracking-widest">
              {addLoading ? "Adding..." : "Add"}
            </Button>
          </form>
          {error && <p className="text-rose-500 text-sm mt-2 font-medium">{error}</p>}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
        <CardHeader className="p-[5vw] sm:p-6 pb-[2vw] sm:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[4vw] sm:text-lg font-black text-foreground tracking-tight uppercase">
              Pending IDs ({pending.length})
            </CardTitle>
            <Button onClick={fetchPending} variant="outline" size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-[5vw] sm:p-6 pt-0">
          <div className="rounded-xl border border-primary/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-primary/10">
                <TableRow className="border-primary/10 hover:bg-transparent">
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Merchant ID</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Status</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Added</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-primary/5">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : pending.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-medium">
                      No pending merchant IDs. Add one above.
                    </TableCell>
                  </TableRow>
                ) : (
                  pending.map(p => (
                    <TableRow key={p.id} className="border-primary/5 hover:bg-primary/5 transition-all cursor-default">
                      <TableCell className="font-mono font-bold text-primary">{p.merchant_id}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[8px] uppercase tracking-wider">Pending</Badge>
                      </TableCell>
                      <TableCell className="text-[2.5vw] sm:text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString('en-LK')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removePending(p.id)} className="text-rose-500 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
