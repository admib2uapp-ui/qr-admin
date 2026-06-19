"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, UserPlus, Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  role: string;
  position: string | null;
  level: number | null;
  created_at: string;
}

interface Position {
  id: string;
  partner_id: string;
  position: string;
  level: number;
}

export default function TeamPage() {
  const { adminUser } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  const [newEmail, setNewEmail] = useState("");
  const [newPositionId, setNewPositionId] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const [newPosName, setNewPosName] = useState("");
  const [newPosLevel, setNewPosLevel] = useState("");
  const [posLoading, setPosLoading] = useState(false);
  const [posError, setPosError] = useState("");

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/team');
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team || []);
        setCurrentLevel(data.currentLevel || 1);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await apiFetch('/api/admin/team/positions');
      if (res.ok) {
        const data = await res.json();
        setPositions(data.positions || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchTeam();
    fetchPositions();
  }, []);

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      const res = await apiFetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, position_level_id: newPositionId }),
      });
      if (res.ok) {
        setNewEmail("");
        setNewPositionId("");
        await fetchTeam();
      } else {
        const data = await res.json();
        setAddError(data.error || "Failed to add member");
      }
    } catch {
      setAddError("Failed to add member");
    } finally {
      setAddLoading(false);
    }
  };

  const addPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosError("");
    setPosLoading(true);
    try {
      const res = await apiFetch('/api/admin/team/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: newPosName, level: parseInt(newPosLevel) }),
      });
      if (res.ok) {
        setNewPosName("");
        setNewPosLevel("");
        await fetchPositions();
      } else {
        const data = await res.json();
        setPosError(data.error || "Failed to add position");
      }
    } catch {
      setPosError("Failed to add position");
    } finally {
      setPosLoading(false);
    }
  };

  const availablePositions = positions.filter(p => p.level > currentLevel);

  return (
    <div className="space-y-[6vw] sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[5vw] sm:text-2xl font-black text-foreground tracking-tight uppercase">Team Management</h1>
          <p className="text-[2.5vw] sm:text-sm text-muted-foreground font-medium">
            Manage your partner organization — Level {currentLevel}
          </p>
        </div>
        <Button onClick={() => { fetchTeam(); fetchPositions(); }} variant="outline" size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
        <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
          <CardTitle className="text-[4vw] sm:text-lg font-black text-foreground tracking-tight uppercase flex items-center gap-2">
            <Plus className="h-5 w-5" /> Positions
          </CardTitle>
          <CardDescription className="text-[2vw] sm:text-xs uppercase tracking-widest font-bold opacity-50">Define your organization levels</CardDescription>
        </CardHeader>
        <CardContent className="p-[3vw] sm:p-4 pt-0 space-y-4">
          <div className="flex flex-wrap gap-2">
            {positions.map(p => (
              <Badge key={p.id} variant="outline" className="rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-widest border-2 bg-primary/10 text-primary border-primary/20">
                Lvl {p.level} — {p.position}
              </Badge>
            ))}
          </div>
          <form onSubmit={addPosition} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Position Name</label>
              <Input value={newPosName} onChange={e => setNewPosName(e.target.value)} placeholder="e.g. Manager" className="h-12 rounded-xl border-primary/10 bg-primary/5 text-sm" required />
            </div>
            <div>
              <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Level (1-5)</label>
              <Select value={newPosLevel} onValueChange={setNewPosLevel}>
                <SelectTrigger className="w-[100px] h-12 border-primary/10 bg-primary/5 rounded-xl text-xs font-bold">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(l => (
                    <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={posLoading} className="h-12 rounded-xl text-xs font-black uppercase tracking-widest">
              {posLoading ? "Adding..." : "Add Position"}
            </Button>
          </form>
          {posError && <p className="text-rose-500 text-sm font-medium">{posError}</p>}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
        <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
          <CardTitle className="text-[4vw] sm:text-lg font-black text-foreground tracking-tight uppercase">
            Team Members ({team.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-[3vw] sm:p-4 pt-0 space-y-4">
          <form onSubmit={addMember} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Email</label>
              <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@company.com" className="h-12 rounded-xl border-primary/10 bg-primary/5 text-sm" required />
            </div>
            <div>
              <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Position</label>
              <Select value={newPositionId} onValueChange={setNewPositionId}>
                <SelectTrigger className="w-[180px] h-12 border-primary/10 bg-primary/5 rounded-xl text-xs font-bold">
                  <SelectValue placeholder={availablePositions.length === 0 ? "No positions available" : "Select position"} />
                </SelectTrigger>
                <SelectContent>
                  {availablePositions.map(p => (
                    <SelectItem key={p.id} value={p.id}>Lvl {p.level} — {p.position}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={addLoading || availablePositions.length === 0} className="h-12 rounded-xl text-xs font-black uppercase tracking-widest">
              {addLoading ? "Adding..." : "Add Member"}
            </Button>
          </form>
          {addError && <p className="text-rose-500 text-sm font-medium">{addError}</p>}

          <div className="rounded-xl border border-primary/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-primary/10">
                <TableRow className="border-primary/10 hover:bg-transparent">
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Email</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Position</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Level</TableHead>
                  <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Joined</TableHead>
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
                ) : team.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-medium">No team members found</TableCell>
                  </TableRow>
                ) : (
                  team.map(m => (
                    <TableRow key={m.id} className="border-primary/5 hover:bg-primary/5 transition-all cursor-default">
                      <TableCell className="font-bold">{m.email}</TableCell>
                      <TableCell className="text-muted-foreground">{m.position || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-widest border-2 bg-primary/10 text-primary border-primary/20">
                          Level {m.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[2.5vw] sm:text-xs">{new Date(m.created_at).toLocaleDateString('en-LK')}</TableCell>
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
