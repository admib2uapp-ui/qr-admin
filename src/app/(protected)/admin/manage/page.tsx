"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Trash2, UserPlus } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AdminRecord {
  id: string;
  user_id: string;
  email: string;
  role: string;
  partner_name: string | null;
  created_at: string;
  merchantCount: number;
}

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("partner_admin");
  const [newPartnerName, setNewPartnerName] = useState("");
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
      if (newRole === 'super_admin') {
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
        return;
      }

      const partnerRes = await apiFetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPartnerName, create_default_position: true }),
      });

      if (!partnerRes.ok) {
        const err = await partnerRes.json();
        setError(err.error || "Failed to create partner");
        return;
      }

      const partnerData = await partnerRes.json();
      const partnerId = partnerData.partner.id;
      const positionLevelId = partnerData.default_position.id;

      const res = await apiFetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          role: 'partner_admin',
          partner_id: partnerId,
          position_level_id: positionLevelId,
        }),
      });

      if (res.ok) {
        setNewEmail("");
        setNewPartnerName("");
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
    <div className="space-y-[6vw] sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[5vw] sm:text-2xl font-black text-foreground tracking-tight uppercase">Manage Admins</h1>
          <p className="text-[2.5vw] sm:text-sm text-muted-foreground font-medium">Add or remove admin users</p>
        </div>
      </div>

      <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
        <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
          <CardTitle className="text-[4vw] sm:text-lg font-black text-foreground tracking-tight uppercase flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Add New Admin
          </CardTitle>
        </CardHeader>
        <CardContent className="p-[3vw] sm:p-4 pt-0">
          <form onSubmit={addAdmin} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Email</label>
              <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="admin@company.com" className="h-12 rounded-xl border-primary/10 bg-primary/5 text-sm" required />
            </div>
            <div>
              <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Role</label>
              <Select value={newRole} onValueChange={(v) => { setNewRole(v); setNewPartnerName(""); }}>
                <SelectTrigger className="w-[160px] h-12 border-primary/10 bg-primary/5 rounded-xl text-xs font-bold">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="partner_admin">Partner Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newRole === 'partner_admin' && (
              <div className="flex-1 min-w-[150px]">
                <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Partner Name</label>
                <Input value={newPartnerName} onChange={e => setNewPartnerName(e.target.value)} placeholder="Partner name" className="h-12 rounded-xl border-primary/10 bg-primary/5 text-sm" required />
              </div>
            )}

            <Button type="submit" disabled={addLoading} className="h-12 rounded-xl text-xs font-black uppercase tracking-widest">
              {addLoading ? "Adding..." : "Add Admin"}
            </Button>
          </form>
          {error && <p className="text-rose-500 text-sm mt-2 font-medium">{error}</p>}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
        <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[4vw] sm:text-lg font-black text-foreground tracking-tight uppercase">
              Admins ({admins.length})
            </CardTitle>
            <Button onClick={fetchAdmins} variant="outline" size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-[3vw] sm:p-4 pt-0">
          <div className="rounded-xl border border-primary/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-primary/10">
                <TableRow className="border-primary/10 hover:bg-transparent">
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Email</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Role</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Partner</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Merchants</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Created</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-primary/5">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-medium">No admins found</TableCell>
                  </TableRow>
                ) : (
                  admins.map(a => (
                    <TableRow key={a.id} className="border-primary/5 hover:bg-primary/5 transition-all cursor-default">
                      <TableCell className="font-bold">{a.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-widest border-2 ${
                          a.role === 'super_admin'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        }`}>
                          {a.role === 'super_admin' ? 'Super Admin' : 'Partner Admin'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{a.partner_name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{a.merchantCount}</TableCell>
                      <TableCell className="text-[2.5vw] sm:text-xs">{new Date(a.created_at).toLocaleDateString('en-LK')}</TableCell>
                      <TableCell>
                        {a.role !== 'super_admin' && (
                          <Button variant="ghost" size="sm" onClick={() => removeAdmin(a.id)} className="text-rose-500 hover:text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
