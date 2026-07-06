"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, RefreshCw, ExternalLink, ChevronDown, ChevronUp, Building2, User } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Merchant {
  id: string;
  merchant_id: string;
  merchant_name: string;
  is_active: boolean;
}

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  phone: string | null;
  role: 'individual' | 'company';
  merchantCount: number;
  merchants: Merchant[];
  disabled: boolean;
  created_at: string;
}

const ROLE_FILTERS = ["ALL", "individual", "company"] as const;

export function MobileMerchants() {
  const { adminUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isSuperAdmin = adminUser?.role === 'super_admin';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/users/list');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (uid: string, currentDisabled: boolean) => {
    setTogglingId(uid);
    try {
      const res = await apiFetch('/api/users/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, disabled: !currentDisabled }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === uid ? { ...u, disabled: !currentDisabled } : u));
      }
    } catch {
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = useMemo(() => {
    let result = [...users];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(u =>
        (u.full_name?.toLowerCase() || '').includes(s) ||
        (u.email?.toLowerCase() || '').includes(s) ||
        (u.phone?.toLowerCase() || '').includes(s) ||
        (u.company_name?.toLowerCase() || '').includes(s)
      );
    }
    if (roleFilter !== "ALL") result = result.filter(u => u.role === roleFilter);
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result;
  }, [users, search, roleFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">
          <span className="font-bold text-foreground">{users.length}</span> total merchants
        </p>
        <Button onClick={fetchUsers} variant="outline" size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, phone..."
          className="pl-9 h-10 rounded-xl border-primary/10 bg-primary/5 text-sm"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {ROLE_FILTERS.map(r => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2 ${
              roleFilter === r
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-primary/5 text-muted-foreground border-primary/10'
            }`}
          >
            {r === 'ALL' ? 'All' : r}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-primary/5 rounded-xl p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-medium">
            No users found
          </div>
        ) : (
          filtered.map(u => {
            const expanded = expandedId === u.id;
            return (
              <div key={u.id}>
                <div
                  onClick={() => setExpandedId(expanded ? null : u.id)}
                  className="bg-primary/5 rounded-xl p-4 border border-primary/10 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {u.role === 'company' ? <Building2 className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{u.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email || u.phone || '-'}</p>
                    </div>
                    <Badge variant="outline" className={`rounded-full px-3 py-0.5 font-black text-[10px] uppercase tracking-widest border-2 ${
                      u.role === 'company'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                    }`}>
                      {u.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`rounded-full px-3 py-0.5 font-black text-[10px] uppercase tracking-widest border-2 ${
                      u.disabled
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    }`}>
                      {u.disabled ? 'Disabled' : 'Active'}
                    </Badge>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      Joined {new Date(u.created_at).toLocaleDateString('en-LK')}
                      {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
                {expanded && (
                  <div className="mx-4 px-4 py-3 bg-primary/5 border-x border-b border-primary/10 rounded-b-xl -mt-1 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-bold">{u.email || '-'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-bold">{u.phone || '-'}</span>
                    </div>
                    {u.company_name && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Company</span>
                        <span className="font-bold">{u.company_name}</span>
                      </div>
                    )}
                    <div className="text-xs">
                      <span className="text-muted-foreground">Merchants</span>
                      <div className="mt-1 space-y-1">
                        {u.merchants && u.merchants.length > 0 ? (
                          u.merchants.map(m => (
                            <Link
                              key={m.id}
                              href={`/merchants/${m.id}`}
                              className="flex items-center gap-1 text-primary hover:underline font-medium"
                            >
                              {m.merchant_name}
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </Link>
                          ))
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>
                    {isSuperAdmin && (
                      <div className="flex items-center justify-between pt-1 border-t border-primary/10">
                        <span className="text-xs font-bold text-muted-foreground">{u.disabled ? 'Enable' : 'Disable'} user</span>
                        <Switch
                          checked={!u.disabled}
                          onCheckedChange={() => toggleStatus(u.id, u.disabled)}
                          disabled={togglingId === u.id}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
