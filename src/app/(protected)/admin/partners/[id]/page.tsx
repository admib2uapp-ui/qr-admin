"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, ExternalLink, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobilePartnerDetail } from "@/components/mobile/MobilePartnerDetail";

interface AdminRecord {
  id: string;
  email: string;
  role: string;
  position: string | null;
  level: number | null;
  created_at: string;
}

interface MerchantRecord {
  id: string;
  merchant_id: string;
  merchant_name: string;
  bank_code: string;
  terminal_id: string;
  created_at: string;
}

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [partner, setPartner] = useState<any>(null);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [merchants, setMerchants] = useState<MerchantRecord[]>([]);
  const [merchantCount, setMerchantCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/api/admin/partners/${id}`);
      if (res.status === 404) {
        setError("Partner not found");
        return;
      }
      if (!res.ok) {
        setError("Failed to load partner");
        return;
      }
      const data = await res.json();
      setPartner(data.partner);
      setAdmins(data.admins || []);
      setMerchants(data.merchants || []);
      setMerchantCount(data.merchantCount || 0);
      setAdminCount(data.adminCount || 0);
    } catch {
      setError("Failed to load partner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const startEdit = () => {
    setEditNameValue(partner?.name || "");
    setEditingName(true);
  };

  const cancelEdit = () => {
    setEditingName(false);
    setEditNameValue("");
  };

  const saveEdit = async () => {
    if (!editNameValue.trim()) return;
    setEditLoading(true);
    try {
      const res = await apiFetch(`/api/admin/partners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editNameValue }),
      });
      if (res.ok) {
        setEditingName(false);
        await fetchData();
      }
    } catch {
    } finally {
      setEditLoading(false);
    }
  };

  const deletePartner = async () => {
    if (!confirm(`Are you sure you want to delete "${partner?.name}"?`)) return;
    try {
      const res = await apiFetch(`/api/admin/partners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/partners');
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete partner");
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="space-y-[4vw] sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 animate-in fade-in">
        <p className="text-destructive font-bold text-lg">{error}</p>
        <Button onClick={() => router.push('/admin/partners')} variant="outline" className="rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Partners
        </Button>
      </div>
    );
  }

  if (isMobile) {
    return <MobilePartnerDetail />;
  }

  return (
    <div className="space-y-[4vw] sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/partners')} className="h-10 w-10 rounded-xl">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-[5vw] sm:text-2xl font-black text-foreground tracking-tight uppercase truncate max-w-[300px]">
          {partner?.name}
        </h1>
      </div>

      <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
        <CardContent className="p-[3vw] sm:p-4">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input value={editNameValue} onChange={e => setEditNameValue(e.target.value)} className="h-9 text-base font-black rounded-lg" />
              <Button variant="ghost" size="sm" onClick={saveEdit} disabled={editLoading} className="h-9 w-9 p-0 text-emerald-500">
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-9 w-9 p-0 text-rose-500">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 items-center">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-[5vw] sm:text-xl font-black text-foreground tracking-tight uppercase truncate">
                  {partner?.name}
                </CardTitle>
              </div>

              <div className="flex flex-col items-center justify-center">
                <span className="text-[5vw] sm:text-2xl font-black text-blue-600 leading-none">{merchantCount}</span>
                <span className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Merchants</span>
              </div>

              <div className="flex flex-col items-center justify-center">
                <span className="text-[5vw] sm:text-2xl font-black text-amber-600 leading-none">{adminCount}</span>
                <span className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Admins</span>
              </div>

              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={startEdit} className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={deletePartner} className="h-9 w-9 p-0 text-rose-500 hover:text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <div className="mt-3 text-sm text-muted-foreground">
            Created {partner?.created_at ? new Date(partner.created_at).toLocaleDateString('en-LK') : '-'}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
        <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
          <CardTitle className="text-[4vw] sm:text-lg font-black text-foreground tracking-tight uppercase">
            Merchants ({merchants.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-[3vw] sm:p-4 pt-0">
          <div className="rounded-xl border border-primary/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-primary/10">
                <TableRow className="border-primary/10 hover:bg-transparent">
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Email</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Role</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Position</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Level</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-medium">No admins for this partner</TableCell>
                  </TableRow>
                ) : (
                  admins.map(a => (
                    <TableRow key={a.id} className="border-primary/5 hover:bg-primary/5 transition-all cursor-default">
                      <TableCell className="font-bold">{a.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-widest border-2 bg-blue-500/10 text-blue-600 border-blue-500/20">
                          Partner Admin
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium">{a.position || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{a.level != null ? `Lv.${a.level}` : '-'}</TableCell>
                      <TableCell className="text-[2.5vw] sm:text-xs">{new Date(a.created_at).toLocaleDateString('en-LK')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
        <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[4vw] sm:text-lg font-black text-foreground tracking-tight uppercase">
              Merchants ({merchants.length})
            </CardTitle>
            <Button onClick={() => router.push('/merchants')} variant="outline" size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-[3vw] sm:p-4 pt-0">
          <div className="rounded-xl border border-primary/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-primary/10">
                <TableRow className="border-primary/10 hover:bg-transparent">
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Name</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Bank</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Terminal</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Created</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {merchants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-medium">No merchants for this partner</TableCell>
                  </TableRow>
                ) : (
                  merchants.map(m => (
                    <TableRow key={m.id} className="border-primary/5 hover:bg-primary/5 transition-all cursor-default">
                      <TableCell className="font-bold">
                        <Link href={`/merchants/${m.id}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                          {m.merchant_name}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.bank_code || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{m.terminal_id || '-'}</TableCell>
                      <TableCell className="text-[2.5vw] sm:text-xs">{new Date(m.created_at).toLocaleDateString('en-LK')}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/merchants/${m.id}`)} className="h-8 px-3 text-xs font-bold">
                          View
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
