"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, RefreshCw, ArrowUpDown, ExternalLink } from "lucide-react";
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

export function UsersTable() {
  const { adminUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

    if (roleFilter !== "ALL") {
      result = result.filter(u => u.role === roleFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'full_name':
          cmp = (a.full_name || '').localeCompare(b.full_name || '');
          break;
        case 'email':
          cmp = (a.email || '').localeCompare(b.email || '');
          break;
        case 'created_at':
        default:
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [users, search, roleFilter, sortField, sortDir]);

  const individuals = users.filter(u => u.role === 'individual').length;
  const companies = users.filter(u => u.role === 'company').length;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
      <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="text-[4vw] sm:text-lg font-black text-foreground tracking-tight uppercase flex items-center gap-2">
            All Merchants
            <span className="text-[2vw] sm:text-xs font-bold text-muted-foreground">({users.length})</span>
          </CardTitle>
          <Button onClick={fetchUsers} variant="outline" size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 text-[2vw] sm:text-xs font-bold text-muted-foreground">
          <span className="bg-primary/10 px-3 py-1 rounded-full">Individuals: {individuals}</span>
          <span className="bg-primary/10 px-3 py-1 rounded-full">Companies: {companies}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="pl-9 h-12 rounded-xl border-primary/10 bg-primary/5 text-sm"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px] h-12 border-primary/10 bg-primary/5 rounded-xl text-xs font-bold">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(""); setRoleFilter("ALL"); }}
            className="h-12 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground"
          >
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-[3vw] sm:p-4 pt-0">
        <div className="rounded-xl border border-primary/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-primary/10">
              <TableRow className="border-primary/10 hover:bg-transparent">
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px] cursor-pointer" onClick={() => handleSort('created_at')}>
                  Joined <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px] cursor-pointer" onClick={() => handleSort('full_name')}>
                  Name <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px] cursor-pointer" onClick={() => handleSort('email')}>
                  Email <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Phone</TableHead>
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Merchant</TableHead>
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Role</TableHead>
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Status</TableHead>
                {isSuperAdmin && <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-primary/5">
                    {Array.from({ length: isSuperAdmin ? 8 : 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 8 : 7} className="text-center py-12 text-muted-foreground font-medium">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(u => (
                  <TableRow key={u.id} className="border-primary/5 hover:bg-primary/5 transition-all cursor-default">
                    <TableCell className="text-[2.5vw] sm:text-xs font-medium">
                      {new Date(u.created_at).toLocaleDateString('en-LK')}
                    </TableCell>
                    <TableCell className="font-bold">{u.full_name || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{u.phone || '-'}</TableCell>
                    <TableCell>
                      {u.merchants && u.merchants.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {u.merchants.slice(0, 2).map((m: any) => (
                            <Link
                              key={m.id}
                              href={`/merchants/${m.id}`}
                              className="text-primary hover:underline font-medium text-xs flex items-center gap-1"
                            >
                              {m.merchant_name}
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </Link>
                          ))}
                          {u.merchants.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">+{u.merchants.length - 2} more</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-widest border-2 ${
                        u.role === 'company'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      }`}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-widest border-2 ${
                        u.disabled
                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      }`}>
                        {u.disabled ? 'Disabled' : 'Active'}
                      </Badge>
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={!u.disabled}
                            onCheckedChange={() => toggleStatus(u.id, u.disabled)}
                            disabled={togglingId === u.id}
                          />
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {u.disabled ? 'Enable' : 'Disable'}
                          </span>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
