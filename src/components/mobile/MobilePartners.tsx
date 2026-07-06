"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Building2, Plus, ExternalLink, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Partner {
  id: string;
  name: string;
  created_at: string;
  merchantCount: number;
  adminCount: number;
}

export function MobilePartners() {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">{partners.length} partners</p>
        <div className="flex gap-2">
          <Button onClick={fetchPartners} variant="outline" size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
          <Button onClick={() => setShowCreate(true)} size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
            <Plus className="h-3 w-3 mr-1" /> New
          </Button>
        </div>
      </div>

      {showCreate && (
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-xs font-black text-foreground uppercase tracking-widest">New Partner</span>
          </div>
          <form onSubmit={createPartner} className="space-y-3">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Partner name" className="h-10 rounded-xl border-primary/10 bg-background text-sm" required />
            <Input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="Admin email" className="h-10 rounded-xl border-primary/10 bg-background text-sm" required />
            {error && <p className="text-rose-500 text-xs font-medium">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={createLoading} className="flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-widest">
                {createLoading ? "Creating..." : "Create Partner"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="h-10 rounded-xl text-xs font-black uppercase tracking-widest">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-primary/5 rounded-xl p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))
        ) : partners.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-medium">
            No partners found
          </div>
        ) : (
          partners.map(p => (
            <Link
              key={p.id}
              href={`/admin/partners/${p.id}`}
              className="block bg-primary/5 rounded-xl p-4 border border-primary/10 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Created {new Date(p.created_at).toLocaleDateString('en-LK')}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-black text-blue-600">{p.merchantCount}</span>
                  <span className="text-muted-foreground">merchants</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-black text-amber-600">{p.adminCount}</span>
                  <span className="text-muted-foreground">admins</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
