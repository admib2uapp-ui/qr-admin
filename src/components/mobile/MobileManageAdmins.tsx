"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Trash2, UserPlus } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AdminRecord {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export function MobileManageAdmins() {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/manage');
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAddLoading(true);
    try {
      const res = await apiFetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, role: 'super_admin' }),
      });
      if (res.ok) {
        setNewEmail("");
        await fetchAdmins();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add admin");
      }
    } catch {
      setError("Failed to add admin");
    } finally {
      setAddLoading(false);
    }
  };

  const removeAdmin = async (id: string) => {
    if (!confirm("Are you sure you want to remove this admin?")) return;
    try {
      const res = await apiFetch(`/api/admin/manage/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAdmins();
      }
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">{admins.length} admins</p>
        <Button onClick={fetchAdmins} variant="outline" size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      {/* Add Admin Form */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 space-y-3">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          <span className="text-xs font-black text-foreground uppercase tracking-widest">Add New Admin</span>
        </div>
        <form onSubmit={addAdmin} className="space-y-3">
          <Input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="admin@qr4pos.com"
            className="h-10 rounded-xl border-primary/10 bg-background text-sm"
            required
          />
          {error && <p className="text-rose-500 text-xs font-medium">{error}</p>}
          <Button type="submit" disabled={addLoading} className="w-full h-10 rounded-xl text-xs font-black uppercase tracking-widest">
            {addLoading ? "Adding..." : "Add Admin"}
          </Button>
        </form>
      </div>

      {/* Admin List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-primary/5 rounded-xl p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))
        ) : admins.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-medium">
            No admins found
          </div>
        ) : (
          admins.map(a => (
            <div key={a.id} className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-bold text-sm truncate">{a.email}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Added {new Date(a.created_at).toLocaleDateString('en-LK')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="rounded-full px-3 py-0.5 font-black text-[10px] uppercase tracking-widest border-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    Super Admin
                  </Badge>
                  <button
                    onClick={() => removeAdmin(a.id)}
                    className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
