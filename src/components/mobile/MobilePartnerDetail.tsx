"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, ExternalLink, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";

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

export function MobilePartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

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
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-5 w-36" />
        </div>
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
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

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/partners')} className="h-8 w-8 rounded-xl shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-black text-lg text-foreground tracking-tight truncate">
          {partner?.name}
        </h1>
        <div className="flex gap-1 ml-auto">
          <Button variant="ghost" size="sm" onClick={startEdit} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={deletePartner} className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 shrink-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Partner Info Card */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 space-y-3">
        {editingName ? (
          <div className="flex items-center gap-2">
            <Input value={editNameValue} onChange={e => setEditNameValue(e.target.value)} className="h-9 text-sm font-black rounded-lg flex-1" />
            <Button variant="ghost" size="sm" onClick={saveEdit} disabled={editLoading} className="h-8 w-8 p-0 text-emerald-500 shrink-0">
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-8 w-8 p-0 text-rose-500 shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-black text-sm text-foreground">{partner?.name}</p>
              <p className="text-[10px] text-muted-foreground">
                Created {partner?.created_at ? new Date(partner.created_at).toLocaleDateString('en-LK') : '-'}
              </p>
            </div>
          </div>
        )}
        <div className="flex gap-6">
          <div>
            <p className="text-lg font-black text-blue-600 leading-none">{merchantCount}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Merchants</p>
          </div>
          <div>
            <p className="text-lg font-black text-amber-600 leading-none">{adminCount}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Admins</p>
          </div>
        </div>
      </div>

      {/* Admins */}
      <div className="space-y-2">
        <p className="text-xs font-black text-foreground uppercase tracking-widest">Admins ({admins.length})</p>
        {admins.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No admins for this partner</p>
        ) : (
          <div className="space-y-2">
            {admins.map(a => (
              <div key={a.id} className="bg-primary/5 rounded-xl p-3 border border-primary/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm truncate">{a.email}</p>
                  <Badge variant="outline" className="rounded-full px-3 py-0 font-black text-[10px] uppercase tracking-widest border-2 bg-blue-500/10 text-blue-600 border-blue-500/20 shrink-0">
                    Partner Admin
                  </Badge>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>Position: {a.position || '-'}</span>
                  <span>Level: {a.level != null ? `Lv.${a.level}` : '-'}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Added {new Date(a.created_at).toLocaleDateString('en-LK')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Merchants */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black text-foreground uppercase tracking-widest">Merchants ({merchants.length})</p>
          <Button onClick={() => router.push('/merchants')} variant="outline" size="sm" className="h-8 rounded-xl text-[10px] font-black uppercase tracking-widest">
            View All
          </Button>
        </div>
        {merchants.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No merchants for this partner</p>
        ) : (
          <div className="space-y-2">
            {merchants.map(m => (
              <Link
                key={m.id}
                href={`/merchants/${m.id}`}
                className="block bg-primary/5 rounded-xl p-3 border border-primary/10 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-sm truncate">{m.merchant_name}</p>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-2" />
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>Bank: {m.bank_code || '-'}</span>
                  <span>Terminal: {m.terminal_id || '-'}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Created {new Date(m.created_at).toLocaleDateString('en-LK')}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
