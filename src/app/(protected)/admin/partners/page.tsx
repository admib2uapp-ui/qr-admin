"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Building2, Plus, ExternalLink } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Partner {
  id: string;
  name: string;
  created_at: string;
  merchantCount: number;
  adminCount: number;
}

export default function PartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/partners');
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPartners(); }, []);

  const createPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreateLoading(true);
    try {
      const res = await apiFetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, admin_email: newAdminEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/admin/partners/${data.partner.id}`);
      } else {
        setError(data.error || "Failed to create partner");
      }
    } catch {
      setError("Failed to create partner");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-[6vw] sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[5vw] sm:text-2xl font-black text-foreground tracking-tight uppercase">Partners</h1>
          <p className="text-[2.5vw] sm:text-sm text-muted-foreground font-medium">Manage partner organizations</p>
        </div>
      </div>

      {showCreate && (
        <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
          <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
            <CardTitle className="text-[4vw] sm:text-lg font-black text-foreground tracking-tight uppercase flex items-center gap-2">
              <Building2 className="h-5 w-5" /> New Partner
            </CardTitle>
          </CardHeader>
          <CardContent className="p-[3vw] sm:p-4 pt-0">
            <form onSubmit={createPartner} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Partner Name</label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Enter partner name" className="h-12 rounded-xl border-primary/10 bg-primary/5 text-sm" required />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Admin Email</label>
                <Input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="admin@partner.com" className="h-12 rounded-xl border-primary/10 bg-primary/5 text-sm" required />
              </div>
              <Button type="submit" disabled={createLoading} className="h-12 rounded-xl text-xs font-black uppercase tracking-widest">
                {createLoading ? "Creating..." : "Create Partner"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="h-12 rounded-xl text-xs font-black uppercase tracking-widest">
                Cancel
              </Button>
            </form>
            {error && <p className="text-rose-500 text-sm mt-2 font-medium">{error}</p>}
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
        <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[4vw] sm:text-lg font-black text-foreground tracking-tight uppercase">
              All Partners ({partners.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={fetchPartners} variant="outline" size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
                <RefreshCw className="h-3 w-3 mr-1" /> Refresh
              </Button>
              <Button onClick={() => setShowCreate(true)} size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
                <Plus className="h-3 w-3 mr-1" /> New Partner
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-[3vw] sm:p-4 pt-0">
          <div className="rounded-xl border border-primary/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-primary/10">
                <TableRow className="border-primary/10 hover:bg-transparent">
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Name</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Merchants</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Admins</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Created</TableHead>
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
                ) : partners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-medium">No partners found</TableCell>
                  </TableRow>
                ) : (
                  partners.map(p => (
                    <TableRow key={p.id} className="border-primary/5 hover:bg-primary/5 transition-all cursor-default">
                      <TableCell className="font-bold">
                        <Link href={`/admin/partners/${p.id}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                          {p.name}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.merchantCount}</TableCell>
                      <TableCell className="text-muted-foreground">{p.adminCount}</TableCell>
                      <TableCell className="text-[2.5vw] sm:text-xs">{new Date(p.created_at).toLocaleDateString('en-LK')}</TableCell>
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
